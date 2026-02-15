use candid::{CandidType, Principal};
use ic_cdk::api::time;
use ic_cdk_timers::set_timer;
use std::cell::RefCell;
use std::collections::HashMap;
use std::time::Duration;

// ─── Types ──────────────────────────────────────────────────────────────

#[derive(CandidType, serde::Deserialize, Clone, Debug)]
pub struct User {
    pub user_principal: Principal,
    pub created_at: u64,
    pub role: String,
}

#[derive(CandidType, serde::Deserialize, Clone, Debug)]
pub struct Email {
    pub sender: Principal,
    pub receiver: Principal,
    pub subject: String,
    pub body: String,
    pub timestamp: u64,
    pub read: bool,
}

#[derive(CandidType, serde::Deserialize, Clone, Debug)]
pub struct GetOrCreateUserResult {
    pub user: User,
    pub is_new_user: bool,
}

#[derive(CandidType, serde::Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub sender: Principal,
    pub receiver: Principal,
    pub content: String,
    pub timestamp: u64,
}

#[derive(CandidType, serde::Deserialize, Clone, Debug)]
pub struct ChatPreview {
    pub other_user: Principal,
    pub last_message: String,
    pub last_timestamp: u64,
    pub unread_count: u64,
}

#[derive(CandidType, serde::Deserialize, Clone, Debug)]
pub struct Reminder {
    pub user: Principal,
    pub email_sender: Principal,
    pub email_timestamp: u64,
    pub remind_at: u64,
    pub fired: bool,
}

// ─── Stable storage ─────────────────────────────────────────────────────

thread_local! {
    static USERS: RefCell<HashMap<Principal, User>> = RefCell::new(HashMap::new());
    static INBOX: RefCell<HashMap<Principal, Vec<Email>>> = RefCell::new(HashMap::new());
    static SENT: RefCell<HashMap<Principal, Vec<Email>>> = RefCell::new(HashMap::new());

    // Starred: maps user principal -> set of (sender, timestamp) pairs
    static STARRED: RefCell<HashMap<Principal, Vec<(Principal, u64)>>> = RefCell::new(HashMap::new());

    // Chat: maps sorted (principal_a, principal_b) -> messages
    static CHATS: RefCell<HashMap<(Principal, Principal), Vec<ChatMessage>>> = RefCell::new(HashMap::new());
    // Chat read timestamps: maps (reader, other_user) -> last read timestamp
    static CHAT_READ_TS: RefCell<HashMap<(Principal, Principal), u64>> = RefCell::new(HashMap::new());

    // Reminders
    static REMINDERS: RefCell<HashMap<Principal, Vec<Reminder>>> = RefCell::new(HashMap::new());
}

// ─── Helpers ────────────────────────────────────────────────────────────

fn require_auth() -> Result<Principal, String> {
    let caller = ic_cdk::api::msg_caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous callers are not allowed. Please authenticate with Internet Identity.".into());
    }
    Ok(caller)
}

fn chat_key(a: Principal, b: Principal) -> (Principal, Principal) {
    if a < b { (a, b) } else { (b, a) }
}

// ─── User management ───────────────────────────────────────────────────

#[ic_cdk::update]
fn get_or_create_user() -> Result<GetOrCreateUserResult, String> {
    let caller = require_auth()?;

    USERS.with(|users| {
        let mut map = users.borrow_mut();

        if let Some(user) = map.get(&caller) {
            return Ok(GetOrCreateUserResult {
                user: user.clone(),
                is_new_user: false,
            });
        }

        let new_user = User {
            user_principal: caller,
            created_at: time(),
            role: "user".into(),
        };
        map.insert(caller, new_user.clone());

        Ok(GetOrCreateUserResult {
            user: new_user,
            is_new_user: true,
        })
    })
}

// ─── Email functions ────────────────────────────────────────────────────

#[ic_cdk::update]
fn send_email(receiver: Principal, subject: String, body: String) -> Result<Email, String> {
    let sender = require_auth()?;

    if receiver == Principal::anonymous() {
        return Err("Cannot send email to anonymous principal.".into());
    }
    if subject.trim().is_empty() {
        return Err("Subject cannot be empty.".into());
    }
    if body.trim().is_empty() {
        return Err("Body cannot be empty.".into());
    }

    let email = Email {
        sender,
        receiver,
        subject,
        body,
        timestamp: time(),
        read: false,
    };

    INBOX.with(|inbox| {
        inbox.borrow_mut().entry(receiver).or_default().push(email.clone());
    });

    SENT.with(|sent| {
        sent.borrow_mut().entry(sender).or_default().push(email.clone());
    });

    Ok(email)
}

#[ic_cdk::query]
fn get_my_inbox() -> Result<Vec<Email>, String> {
    let caller = require_auth()?;
    INBOX.with(|inbox| {
        Ok(inbox.borrow().get(&caller).cloned().unwrap_or_default())
    })
}

#[ic_cdk::query]
fn get_my_sent_mail() -> Result<Vec<Email>, String> {
    let caller = require_auth()?;
    SENT.with(|sent| {
        Ok(sent.borrow().get(&caller).cloned().unwrap_or_default())
    })
}

#[ic_cdk::update]
fn mark_as_read(sender_principal: Principal, timestamp: u64) -> Result<bool, String> {
    let caller = require_auth()?;

    INBOX.with(|inbox| {
        let mut map = inbox.borrow_mut();
        if let Some(emails) = map.get_mut(&caller) {
            for email in emails.iter_mut() {
                if email.sender == sender_principal && email.timestamp == timestamp {
                    email.read = true;
                    return Ok(true);
                }
            }
        }
        Ok(false)
    })
}

// ─── Starred emails ────────────────────────────────────────────────────

#[ic_cdk::update]
fn toggle_star(sender_principal: Principal, timestamp: u64, starred: bool) -> Result<bool, String> {
    let caller = require_auth()?;

    STARRED.with(|s| {
        let mut map = s.borrow_mut();
        let stars = map.entry(caller).or_default();
        let key = (sender_principal, timestamp);

        if starred {
            if !stars.contains(&key) {
                stars.push(key);
            }
        } else {
            stars.retain(|k| *k != key);
        }
        Ok(starred)
    })
}

#[ic_cdk::query]
fn get_starred_emails() -> Result<Vec<Email>, String> {
    let caller = require_auth()?;

    let starred_keys: Vec<(Principal, u64)> = STARRED.with(|s| {
        s.borrow().get(&caller).cloned().unwrap_or_default()
    });

    if starred_keys.is_empty() {
        return Ok(vec![]);
    }

    let mut result = Vec::new();

    // Check inbox
    INBOX.with(|inbox| {
        if let Some(emails) = inbox.borrow().get(&caller) {
            for email in emails {
                if starred_keys.contains(&(email.sender, email.timestamp)) {
                    result.push(email.clone());
                }
            }
        }
    });

    // Check sent
    SENT.with(|sent| {
        if let Some(emails) = sent.borrow().get(&caller) {
            for email in emails {
                let key = (email.sender, email.timestamp);
                if starred_keys.contains(&key) && !result.iter().any(|e: &Email| e.sender == email.sender && e.timestamp == email.timestamp) {
                    result.push(email.clone());
                }
            }
        }
    });

    Ok(result)
}

#[ic_cdk::query]
fn is_starred(sender_principal: Principal, timestamp: u64) -> Result<bool, String> {
    let caller = require_auth()?;

    STARRED.with(|s| {
        let map = s.borrow();
        if let Some(stars) = map.get(&caller) {
            Ok(stars.contains(&(sender_principal, timestamp)))
        } else {
            Ok(false)
        }
    })
}

#[ic_cdk::query]
fn get_my_starred_keys() -> Result<Vec<(Principal, u64)>, String> {
    let caller = require_auth()?;
    STARRED.with(|s| {
        Ok(s.borrow().get(&caller).cloned().unwrap_or_default())
    })
}

// ─── Chat functions ────────────────────────────────────────────────────

#[ic_cdk::update]
fn send_chat_message(receiver: Principal, content: String) -> Result<ChatMessage, String> {
    let sender = require_auth()?;

    if receiver == Principal::anonymous() {
        return Err("Cannot chat with anonymous principal.".into());
    }
    if content.trim().is_empty() {
        return Err("Message cannot be empty.".into());
    }
    if sender == receiver {
        return Err("Cannot chat with yourself.".into());
    }

    let msg = ChatMessage {
        sender,
        receiver,
        content,
        timestamp: time(),
    };

    let key = chat_key(sender, receiver);
    CHATS.with(|c| {
        c.borrow_mut().entry(key).or_default().push(msg.clone());
    });

    Ok(msg)
}

#[ic_cdk::query]
fn get_chat_messages(other_user: Principal) -> Result<Vec<ChatMessage>, String> {
    let caller = require_auth()?;
    let key = chat_key(caller, other_user);

    CHATS.with(|c| {
        Ok(c.borrow().get(&key).cloned().unwrap_or_default())
    })
}

#[ic_cdk::update]
fn mark_chat_read(other_user: Principal) -> Result<bool, String> {
    let caller = require_auth()?;
    let now = time();

    CHAT_READ_TS.with(|ts| {
        ts.borrow_mut().insert((caller, other_user), now);
    });

    Ok(true)
}

#[ic_cdk::query]
fn get_chat_list() -> Result<Vec<ChatPreview>, String> {
    let caller = require_auth()?;

    let mut previews: Vec<ChatPreview> = Vec::new();

    CHATS.with(|c| {
        let chats = c.borrow();
        for ((a, b), messages) in chats.iter() {
            // Only include conversations involving the caller
            let other = if *a == caller {
                *b
            } else if *b == caller {
                *a
            } else {
                continue;
            };

            if let Some(last_msg) = messages.last() {
                // Count unread messages
                let read_ts = CHAT_READ_TS.with(|ts| {
                    ts.borrow().get(&(caller, other)).copied().unwrap_or(0)
                });
                let unread = messages.iter().filter(|m| {
                    m.sender != caller && m.timestamp > read_ts
                }).count() as u64;

                previews.push(ChatPreview {
                    other_user: other,
                    last_message: if last_msg.content.len() > 100 {
                        format!("{}...", &last_msg.content[..100])
                    } else {
                        last_msg.content.clone()
                    },
                    last_timestamp: last_msg.timestamp,
                    unread_count: unread,
                });
            }
        }
    });

    // Sort by last_timestamp descending
    previews.sort_by(|a, b| b.last_timestamp.cmp(&a.last_timestamp));
    Ok(previews)
}

// ─── Reminder functions ────────────────────────────────────────────────

fn schedule_reminder_timer(user: Principal, email_sender: Principal, email_timestamp: u64, remind_at: u64) {
    let now = time();
    if remind_at <= now {
        // Already past due, fire immediately
        REMINDERS.with(|r| {
            let mut map = r.borrow_mut();
            if let Some(reminders) = map.get_mut(&user) {
                for rem in reminders.iter_mut() {
                    if rem.email_sender == email_sender && rem.email_timestamp == email_timestamp && !rem.fired {
                        rem.fired = true;
                        break;
                    }
                }
            }
        });
        return;
    }

    let delay_ns = remind_at - now;
    let delay = Duration::from_nanos(delay_ns);

    set_timer(delay, move || {
        REMINDERS.with(|r| {
            let mut map = r.borrow_mut();
            if let Some(reminders) = map.get_mut(&user) {
                for rem in reminders.iter_mut() {
                    if rem.email_sender == email_sender && rem.email_timestamp == email_timestamp && !rem.fired {
                        rem.fired = true;
                        break;
                    }
                }
            }
        });
    });
}

#[ic_cdk::update]
fn set_reminder(email_sender: Principal, email_timestamp: u64, remind_at_ns: u64) -> Result<Reminder, String> {
    let caller = require_auth()?;
    let now = time();

    if remind_at_ns <= now {
        return Err("Reminder time must be in the future.".into());
    }

    let reminder = Reminder {
        user: caller,
        email_sender,
        email_timestamp,
        remind_at: remind_at_ns,
        fired: false,
    };

    REMINDERS.with(|r| {
        let mut map = r.borrow_mut();
        let reminders = map.entry(caller).or_default();
        // Remove any existing reminder for this email
        reminders.retain(|rem| !(rem.email_sender == email_sender && rem.email_timestamp == email_timestamp));
        reminders.push(reminder.clone());
    });

    schedule_reminder_timer(caller, email_sender, email_timestamp, remind_at_ns);

    Ok(reminder)
}

#[ic_cdk::query]
fn get_my_reminders() -> Result<Vec<Reminder>, String> {
    let caller = require_auth()?;
    REMINDERS.with(|r| {
        Ok(r.borrow().get(&caller).cloned().unwrap_or_default())
    })
}

#[ic_cdk::query]
fn get_due_reminders() -> Result<Vec<Reminder>, String> {
    let caller = require_auth()?;
    REMINDERS.with(|r| {
        let map = r.borrow();
        if let Some(reminders) = map.get(&caller) {
            Ok(reminders.iter().filter(|rem| rem.fired).cloned().collect())
        } else {
            Ok(vec![])
        }
    })
}

#[ic_cdk::update]
fn dismiss_reminder(email_sender: Principal, email_timestamp: u64) -> Result<bool, String> {
    let caller = require_auth()?;
    REMINDERS.with(|r| {
        let mut map = r.borrow_mut();
        if let Some(reminders) = map.get_mut(&caller) {
            let len_before = reminders.len();
            reminders.retain(|rem| !(rem.email_sender == email_sender && rem.email_timestamp == email_timestamp && rem.fired));
            Ok(reminders.len() < len_before)
        } else {
            Ok(false)
        }
    })
}

#[ic_cdk::update]
fn cancel_reminder(email_sender: Principal, email_timestamp: u64) -> Result<bool, String> {
    let caller = require_auth()?;
    REMINDERS.with(|r| {
        let mut map = r.borrow_mut();
        if let Some(reminders) = map.get_mut(&caller) {
            let len_before = reminders.len();
            reminders.retain(|rem| !(rem.email_sender == email_sender && rem.email_timestamp == email_timestamp));
            Ok(reminders.len() < len_before)
        } else {
            Ok(false)
        }
    })
}

// ─── Upgrade persistence ────────────────────────────────────────────────

type StableState = (
    Vec<(Principal, User)>,
    Vec<(Principal, Vec<Email>)>,
    Vec<(Principal, Vec<Email>)>,
    Vec<(Principal, Vec<(Principal, u64)>)>,
    Vec<((Principal, Principal), Vec<ChatMessage>)>,
    Vec<((Principal, Principal), u64)>,
    Vec<(Principal, Vec<Reminder>)>,
);

#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    let users: Vec<(Principal, User)> = USERS.with(|u| u.borrow().iter().map(|(k, v)| (*k, v.clone())).collect());
    let inbox: Vec<(Principal, Vec<Email>)> = INBOX.with(|i| i.borrow().iter().map(|(k, v)| (*k, v.clone())).collect());
    let sent: Vec<(Principal, Vec<Email>)> = SENT.with(|s| s.borrow().iter().map(|(k, v)| (*k, v.clone())).collect());
    let starred: Vec<(Principal, Vec<(Principal, u64)>)> = STARRED.with(|s| s.borrow().iter().map(|(k, v)| (*k, v.clone())).collect());
    let chats: Vec<((Principal, Principal), Vec<ChatMessage>)> = CHATS.with(|c| c.borrow().iter().map(|(k, v)| (*k, v.clone())).collect());
    let chat_read: Vec<((Principal, Principal), u64)> = CHAT_READ_TS.with(|ts| ts.borrow().iter().map(|(k, v)| (*k, *v)).collect());
    let reminders: Vec<(Principal, Vec<Reminder>)> = REMINDERS.with(|r| r.borrow().iter().map(|(k, v)| (*k, v.clone())).collect());

    let state: StableState = (users, inbox, sent, starred, chats, chat_read, reminders);
    ic_cdk::storage::stable_save((state,))
        .expect("Failed to save state before upgrade");
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    let result: Result<(StableState,), _> = ic_cdk::storage::stable_restore();

    if let Ok(((users, inbox, sent, starred, chats, chat_read, reminders),)) = result {
        USERS.with(|u| {
            let mut map = u.borrow_mut();
            for (k, v) in users { map.insert(k, v); }
        });
        INBOX.with(|i| {
            let mut map = i.borrow_mut();
            for (k, v) in inbox { map.insert(k, v); }
        });
        SENT.with(|s| {
            let mut map = s.borrow_mut();
            for (k, v) in sent { map.insert(k, v); }
        });
        STARRED.with(|s| {
            let mut map = s.borrow_mut();
            for (k, v) in starred { map.insert(k, v); }
        });
        CHATS.with(|c| {
            let mut map = c.borrow_mut();
            for (k, v) in chats { map.insert(k, v); }
        });
        CHAT_READ_TS.with(|ts| {
            let mut map = ts.borrow_mut();
            for (k, v) in chat_read { map.insert(k, v); }
        });
        REMINDERS.with(|r| {
            let mut map = r.borrow_mut();
            for (k, v) in reminders {
                // Re-schedule unfired reminders
                for rem in &v {
                    if !rem.fired {
                        schedule_reminder_timer(rem.user, rem.email_sender, rem.email_timestamp, rem.remind_at);
                    }
                }
                map.insert(k, v);
            }
        });
    } else {
        // Try loading old format (3-tuple) for backward compatibility
        let old_result: Result<(Vec<(Principal, User)>, Vec<(Principal, Vec<Email>)>, Vec<(Principal, Vec<Email>)>), _> =
            ic_cdk::storage::stable_restore();

        if let Ok((users, inbox, sent)) = old_result {
            USERS.with(|u| {
                let mut map = u.borrow_mut();
                for (k, v) in users { map.insert(k, v); }
            });
            INBOX.with(|i| {
                let mut map = i.borrow_mut();
                for (k, v) in inbox { map.insert(k, v); }
            });
            SENT.with(|s| {
                let mut map = s.borrow_mut();
                for (k, v) in sent { map.insert(k, v); }
            });
        }
    }
}

ic_cdk::export_candid!();
