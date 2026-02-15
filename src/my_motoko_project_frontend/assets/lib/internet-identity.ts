"use client";

import { Actor, type ActorSubclass, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { IDL } from "@dfinity/candid";
import type { Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

const LOCAL_BACKEND_CANISTER_ID = "uxrrr-q7777-77774-qaaaq-cai";
const LOCAL_IC_HOST = "http://127.0.0.1:4943";
const MAINNET_IC_HOST = "https://icp-api.io";
const LOCAL_II_PROVIDER = "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943/#authorize";
const MAINNET_II_PROVIDER = "https://identity.ic0.app/#authorize";

// ─── Types matching the Rust backend ────────────────────────────────────

export type User = {
  user_principal: Principal;
  created_at: bigint;
  role: string;
};

export type Email = {
  sender: Principal;
  receiver: Principal;
  subject: string;
  body: string;
  timestamp: bigint;
  read: boolean;
};

export type GetOrCreateUserResult = {
  user: User;
  is_new_user: boolean;
};

export type ChatMessage = {
  sender: Principal;
  receiver: Principal;
  content: string;
  timestamp: bigint;
};

export type ChatPreview = {
  other_user: Principal;
  last_message: string;
  last_timestamp: bigint;
  unread_count: bigint;
};

export type Reminder = {
  user: Principal;
  email_sender: Principal;
  email_timestamp: bigint;
  remind_at: bigint;
  fired: boolean;
};

type ResultUser = { Ok: GetOrCreateUserResult } | { Err: string };
type ResultEmail = { Ok: Email } | { Err: string };
type ResultEmails = { Ok: Email[] } | { Err: string };
type ResultBool = { Ok: boolean } | { Err: string };
type ResultChatMessage = { Ok: ChatMessage } | { Err: string };
type ResultChatMessages = { Ok: ChatMessage[] } | { Err: string };
type ResultChatPreviews = { Ok: ChatPreview[] } | { Err: string };
type ResultReminder = { Ok: Reminder } | { Err: string };
type ResultReminders = { Ok: Reminder[] } | { Err: string };
type ResultStarredKeys = { Ok: Array<[Principal, bigint]> } | { Err: string };

type BackendActor = ActorSubclass<{
  get_or_create_user: () => Promise<ResultUser>;
  send_email: (receiver: Principal, subject: string, body: string) => Promise<ResultEmail>;
  get_my_inbox: () => Promise<ResultEmails>;
  get_my_sent_mail: () => Promise<ResultEmails>;
  mark_as_read: (sender: Principal, timestamp: bigint) => Promise<ResultBool>;
  // Starred
  toggle_star: (sender: Principal, timestamp: bigint, starred: boolean) => Promise<ResultBool>;
  get_starred_emails: () => Promise<ResultEmails>;
  is_starred: (sender: Principal, timestamp: bigint) => Promise<ResultBool>;
  get_my_starred_keys: () => Promise<ResultStarredKeys>;
  // Chat
  send_chat_message: (receiver: Principal, content: string) => Promise<ResultChatMessage>;
  get_chat_messages: (other_user: Principal) => Promise<ResultChatMessages>;
  mark_chat_read: (other_user: Principal) => Promise<ResultBool>;
  get_chat_list: () => Promise<ResultChatPreviews>;
  // Reminders
  set_reminder: (email_sender: Principal, email_timestamp: bigint, remind_at_ns: bigint) => Promise<ResultReminder>;
  get_my_reminders: () => Promise<ResultReminders>;
  get_due_reminders: () => Promise<ResultReminders>;
  dismiss_reminder: (email_sender: Principal, email_timestamp: bigint) => Promise<ResultBool>;
  cancel_reminder: (email_sender: Principal, email_timestamp: bigint) => Promise<ResultBool>;
}>;

// ─── Environment helpers ────────────────────────────────────────────────

function isLocalHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

function getBackendCanisterId(): string {
  return (
    process.env.NEXT_PUBLIC_MY_MOTOKO_PROJECT_BACKEND_CANISTER_ID ??
    process.env.NEXT_PUBLIC_CANISTER_ID_MY_MOTOKO_PROJECT_BACKEND ??
    LOCAL_BACKEND_CANISTER_ID
  );
}

function getHost(): string {
  if (process.env.NEXT_PUBLIC_IC_HOST) {
    return process.env.NEXT_PUBLIC_IC_HOST;
  }
  if (typeof window === "undefined") {
    return LOCAL_IC_HOST;
  }
  return isLocalHost(window.location.hostname) ? LOCAL_IC_HOST : MAINNET_IC_HOST;
}

function getIdentityProvider(): string {
  if (process.env.NEXT_PUBLIC_INTERNET_IDENTITY_URL) {
    return process.env.NEXT_PUBLIC_INTERNET_IDENTITY_URL;
  }
  if (typeof window === "undefined") {
    return MAINNET_II_PROVIDER;
  }
  return isLocalHost(window.location.hostname) ? LOCAL_II_PROVIDER : MAINNET_II_PROVIDER;
}

// ─── IDL factory (matches .did) ─────────────────────────────────────────

const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const User = IDL.Record({
    user_principal: IDL.Principal,
    created_at: IDL.Nat64,
    role: IDL.Text,
  });

  const Email = IDL.Record({
    sender: IDL.Principal,
    receiver: IDL.Principal,
    subject: IDL.Text,
    body: IDL.Text,
    timestamp: IDL.Nat64,
    read: IDL.Bool,
  });

  const GetOrCreateUserResult = IDL.Record({
    user: User,
    is_new_user: IDL.Bool,
  });

  const ChatMessage = IDL.Record({
    sender: IDL.Principal,
    receiver: IDL.Principal,
    content: IDL.Text,
    timestamp: IDL.Nat64,
  });

  const ChatPreview = IDL.Record({
    other_user: IDL.Principal,
    last_message: IDL.Text,
    last_timestamp: IDL.Nat64,
    unread_count: IDL.Nat64,
  });

  const Reminder = IDL.Record({
    user: IDL.Principal,
    email_sender: IDL.Principal,
    email_timestamp: IDL.Nat64,
    remind_at: IDL.Nat64,
    fired: IDL.Bool,
  });

  const ResultUser = IDL.Variant({ Ok: GetOrCreateUserResult, Err: IDL.Text });
  const ResultEmail = IDL.Variant({ Ok: Email, Err: IDL.Text });
  const ResultEmails = IDL.Variant({ Ok: IDL.Vec(Email), Err: IDL.Text });
  const ResultBool = IDL.Variant({ Ok: IDL.Bool, Err: IDL.Text });
  const ResultChatMessage = IDL.Variant({ Ok: ChatMessage, Err: IDL.Text });
  const ResultChatMessages = IDL.Variant({ Ok: IDL.Vec(ChatMessage), Err: IDL.Text });
  const ResultChatPreviews = IDL.Variant({ Ok: IDL.Vec(ChatPreview), Err: IDL.Text });
  const ResultReminder = IDL.Variant({ Ok: Reminder, Err: IDL.Text });
  const ResultReminders = IDL.Variant({ Ok: IDL.Vec(Reminder), Err: IDL.Text });
  const StarredKey = IDL.Tuple(IDL.Principal, IDL.Nat64);
  const ResultStarredKeys = IDL.Variant({ Ok: IDL.Vec(StarredKey), Err: IDL.Text });

  return IDL.Service({
    get_or_create_user: IDL.Func([], [ResultUser], []),
    send_email: IDL.Func([IDL.Principal, IDL.Text, IDL.Text], [ResultEmail], []),
    get_my_inbox: IDL.Func([], [ResultEmails], ["query"]),
    get_my_sent_mail: IDL.Func([], [ResultEmails], ["query"]),
    mark_as_read: IDL.Func([IDL.Principal, IDL.Nat64], [ResultBool], []),
    // Starred
    toggle_star: IDL.Func([IDL.Principal, IDL.Nat64, IDL.Bool], [ResultBool], []),
    get_starred_emails: IDL.Func([], [ResultEmails], ["query"]),
    is_starred: IDL.Func([IDL.Principal, IDL.Nat64], [ResultBool], ["query"]),
    get_my_starred_keys: IDL.Func([], [ResultStarredKeys], ["query"]),
    // Chat
    send_chat_message: IDL.Func([IDL.Principal, IDL.Text], [ResultChatMessage], []),
    get_chat_messages: IDL.Func([IDL.Principal], [ResultChatMessages], ["query"]),
    mark_chat_read: IDL.Func([IDL.Principal], [ResultBool], []),
    get_chat_list: IDL.Func([], [ResultChatPreviews], ["query"]),
    // Reminders
    set_reminder: IDL.Func([IDL.Principal, IDL.Nat64, IDL.Nat64], [ResultReminder], []),
    get_my_reminders: IDL.Func([], [ResultReminders], ["query"]),
    get_due_reminders: IDL.Func([], [ResultReminders], ["query"]),
    dismiss_reminder: IDL.Func([IDL.Principal, IDL.Nat64], [ResultBool], []),
    cancel_reminder: IDL.Func([IDL.Principal, IDL.Nat64], [ResultBool], []),
  });
};

// ─── Shared helpers ─────────────────────────────────────────────────────

function isLocalReplica(): boolean {
  const host = getHost();
  return (
    host.startsWith("http://127.0.0.1") ||
    host.startsWith("http://localhost") ||
    host.includes(".localhost")
  );
}

async function createAgent(identity?: Identity): Promise<HttpAgent> {
  return HttpAgent.create({
    host: getHost(),
    identity,
    shouldFetchRootKey: isLocalReplica(),
  });
}

// ─── Actor creation ─────────────────────────────────────────────────────

async function createBackendActor(identity: Identity): Promise<BackendActor> {
  const agent = await createAgent(identity);

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: getBackendCanisterId(),
  }) as BackendActor;
}

// ─── Result unwrappers ──────────────────────────────────────────────────

function unwrap<T>(result: { Ok: T } | { Err: string }): T {
  if ("Err" in result) {
    throw new Error(result.Err);
  }
  return result.Ok;
}

// ─── Public API ─────────────────────────────────────────────────────────

export async function clearAuthStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  const authKeys = Object.keys(localStorage).filter((key) =>
    key.includes("auth") || key.includes("identity") || key.includes("ic-")
  );
  authKeys.forEach((key) => localStorage.removeItem(key));

  const dbNames = ["auth-client-db", "ic-keyval", "ic-identity"];
  for (const name of dbNames) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => {
          console.warn(`IndexedDB ${name} deletion blocked`);
          resolve();
        };
      });
    } catch (error) {
      console.warn(`Failed to delete ${name}:`, error);
    }
  }

  console.log("Authentication storage cleared");
}

export async function authenticateWithInternetIdentity(): Promise<{
  identity: Identity;
  principal: string;
}> {
  try {
    const authClient = await AuthClient.create();

    if (!(await authClient.isAuthenticated())) {
      await new Promise<void>((resolve, reject) => {
        authClient.login({
          identityProvider: getIdentityProvider(),
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000),
          onSuccess: resolve,
          onError: (error) => {
            console.error("Internet Identity login error:", error);
            reject(new Error("Internet Identity login failed."));
          },
        });
      });
    }

    const identity = authClient.getIdentity();
    const principal = identity.getPrincipal().toText();
    return { identity, principal };
  } catch (error) {
    if (error instanceof Error && error.message.includes("anchor_number")) {
      console.warn("Detected corrupted auth storage, clearing and retrying...");

      try {
        if (typeof window !== "undefined") {
          const dbNames = ["auth-client-db", "ic-keyval"];
          for (const name of dbNames) {
            await new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase(name);
              req.onsuccess = () => resolve();
              req.onerror = () => resolve();
            });
          }
        }
      } catch (clearError) {
        console.error("Failed to clear storage:", clearError);
      }

      throw new Error(
        "Authentication storage is corrupted. Please refresh the page and try again."
      );
    }

    throw error;
  }
}

export async function loginAndGetUser(): Promise<{
  principal: string;
  user: User;
  isNewUser: boolean;
  actor: BackendActor;
}> {
  const { identity, principal } = await authenticateWithInternetIdentity();
  const actor = await createBackendActor(identity);
  const result = await actor.get_or_create_user();
  const { user, is_new_user } = unwrap(result);
  return { principal, user, isNewUser: is_new_user, actor };
}

// ─── Email API ──────────────────────────────────────────────────────────

export async function sendEmail(
  actor: BackendActor,
  receiver: Principal,
  subject: string,
  body: string
): Promise<Email> {
  const result = await actor.send_email(receiver, subject, body);
  return unwrap(result);
}

export async function getMyInbox(actor: BackendActor): Promise<Email[]> {
  const result = await actor.get_my_inbox();
  return unwrap(result);
}

export async function getMySentMail(actor: BackendActor): Promise<Email[]> {
  const result = await actor.get_my_sent_mail();
  return unwrap(result);
}

export async function markAsRead(
  actor: BackendActor,
  senderPrincipal: Principal,
  timestamp: bigint
): Promise<boolean> {
  const result = await actor.mark_as_read(senderPrincipal, timestamp);
  return unwrap(result);
}

// ─── Starred API ────────────────────────────────────────────────────────

export async function toggleStar(
  actor: BackendActor,
  senderPrincipal: Principal,
  timestamp: bigint,
  starred: boolean
): Promise<boolean> {
  const result = await actor.toggle_star(senderPrincipal, timestamp, starred);
  return unwrap(result);
}

export async function getStarredEmails(actor: BackendActor): Promise<Email[]> {
  const result = await actor.get_starred_emails();
  return unwrap(result);
}

export async function getMyStarredKeys(actor: BackendActor): Promise<Array<[Principal, bigint]>> {
  const result = await actor.get_my_starred_keys();
  return unwrap(result);
}

// ─── Chat API ───────────────────────────────────────────────────────────

export async function sendChatMessage(
  actor: BackendActor,
  receiver: Principal,
  content: string
): Promise<ChatMessage> {
  const result = await actor.send_chat_message(receiver, content);
  return unwrap(result);
}

export async function getChatMessages(
  actor: BackendActor,
  otherUser: Principal
): Promise<ChatMessage[]> {
  const result = await actor.get_chat_messages(otherUser);
  return unwrap(result);
}

export async function markChatRead(
  actor: BackendActor,
  otherUser: Principal
): Promise<boolean> {
  const result = await actor.mark_chat_read(otherUser);
  return unwrap(result);
}

export async function getChatList(
  actor: BackendActor
): Promise<ChatPreview[]> {
  const result = await actor.get_chat_list();
  return unwrap(result);
}

// ─── Reminder API ───────────────────────────────────────────────────────

export async function setReminder(
  actor: BackendActor,
  emailSender: Principal,
  emailTimestamp: bigint,
  remindAtNs: bigint
): Promise<Reminder> {
  const result = await actor.set_reminder(emailSender, emailTimestamp, remindAtNs);
  return unwrap(result);
}

export async function getMyReminders(actor: BackendActor): Promise<Reminder[]> {
  const result = await actor.get_my_reminders();
  return unwrap(result);
}

export async function getDueReminders(actor: BackendActor): Promise<Reminder[]> {
  const result = await actor.get_due_reminders();
  return unwrap(result);
}

export async function dismissReminder(
  actor: BackendActor,
  emailSender: Principal,
  emailTimestamp: bigint
): Promise<boolean> {
  const result = await actor.dismiss_reminder(emailSender, emailTimestamp);
  return unwrap(result);
}

export async function cancelReminder(
  actor: BackendActor,
  emailSender: Principal,
  emailTimestamp: bigint
): Promise<boolean> {
  const result = await actor.cancel_reminder(emailSender, emailTimestamp);
  return unwrap(result);
}
