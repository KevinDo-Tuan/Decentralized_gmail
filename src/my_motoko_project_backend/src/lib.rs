use candid::CandidType;
use ic_cdk::{api::{msg_caller, time}, storage};
use serde::Deserialize;
use std::cell::RefCell;
use std::collections::BTreeMap;

thread_local! {
    static USERS_BY_ANCHOR: RefCell<BTreeMap<u64, UserRecord>> = RefCell::new(BTreeMap::new());
}

#[derive(CandidType, Deserialize, Clone)]
struct UserRecord {
    anchor_number: u64,
    email: String,
    principal: String,
    first_login_at_ns: u64,
    last_login_at_ns: u64,
    login_count: u64,
}

#[derive(CandidType, Deserialize, Clone)]
struct LoginCheckResult {
    existed_before: bool,
    record: UserRecord,
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[ic_cdk::update]
fn check_and_save_identity(anchor_number: u64, email: String) -> Result<LoginCheckResult, String> {
    let normalized_email = email.trim().to_lowercase();
    if normalized_email.is_empty() || !normalized_email.contains('@') {
        return Err("Please provide a valid email address.".to_string());
    }

    let caller_principal = msg_caller().to_text();
    let now = time();

    USERS_BY_ANCHOR.with(|users| {
        let mut users = users.borrow_mut();

        if let Some(existing) = users.get_mut(&anchor_number) {
            if existing.principal != caller_principal {
                return Err(
                    "This anchor number is already linked to a different Internet Identity principal."
                        .to_string(),
                );
            }

            existing.email = normalized_email.clone();
            existing.login_count = existing.login_count.saturating_add(1);
            existing.last_login_at_ns = now;

            return Ok(LoginCheckResult {
                existed_before: true,
                record: existing.clone(),
            });
        }

        let new_record = UserRecord {
            anchor_number,
            email: normalized_email,
            principal: caller_principal,
            first_login_at_ns: now,
            last_login_at_ns: now,
            login_count: 1,
        };

        users.insert(anchor_number, new_record.clone());

        Ok(LoginCheckResult {
            existed_before: false,
            record: new_record,
        })
    })
}

#[ic_cdk::query]
fn get_user(anchor_number: u64) -> Option<UserRecord> {
    USERS_BY_ANCHOR.with(|users| users.borrow().get(&anchor_number).cloned())
}

#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    let snapshot = USERS_BY_ANCHOR.with(|users| {
        users
            .borrow()
            .values()
            .cloned()
            .collect::<Vec<UserRecord>>()
    });

    if let Err(error) = storage::stable_save((snapshot,)) {
        ic_cdk::trap(&format!("failed to save users before upgrade: {error}"));
    }
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    let restored: Result<(Vec<UserRecord>,), _> = storage::stable_restore();
    if let Ok((snapshot,)) = restored {
        USERS_BY_ANCHOR.with(|users| {
            let mut users = users.borrow_mut();
            users.clear();
            for record in snapshot {
                users.insert(record.anchor_number, record);
            }
        });
    }
}

ic_cdk::export_candid!();
