"use client";

import { Actor, type ActorSubclass, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { IDL } from "@dfinity/candid";
import type { Identity } from "@dfinity/agent";

const LOCAL_BACKEND_CANISTER_ID = "uxrrr-q7777-77774-qaaaq-cai";
const LOCAL_IC_HOST = "http://127.0.0.1:4943";
const MAINNET_IC_HOST = "https://icp-api.io";
const LOCAL_II_PROVIDER = "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943/#authorize";
const MAINNET_II_PROVIDER = "https://identity.ic0.app/#authorize";

export type UserRecord = {
  anchor_number: bigint;
  email: string;
  principal: string;
  first_login_at_ns: bigint;
  last_login_at_ns: bigint;
  login_count: bigint;
};

export type LoginCheckResult = {
  existed_before: boolean;
  record: UserRecord;
};

type ResultVariant = { Ok: LoginCheckResult } | { Err: string };

type BackendActor = ActorSubclass<{
  check_and_save_identity: (anchor: bigint, email: string) => Promise<ResultVariant>;
}>;

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
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

const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const UserRecord = IDL.Record({
    anchor_number: IDL.Nat64,
    email: IDL.Text,
    principal: IDL.Text,
    first_login_at_ns: IDL.Nat64,
    last_login_at_ns: IDL.Nat64,
    login_count: IDL.Nat64,
  });

  const LoginCheckResult = IDL.Record({
    existed_before: IDL.Bool,
    record: UserRecord,
  });

  const LoginResult = IDL.Variant({
    Ok: LoginCheckResult,
    Err: IDL.Text,
  });

  return IDL.Service({
    check_and_save_identity: IDL.Func([IDL.Nat64, IDL.Text], [LoginResult], []),
  });
};

async function createBackendActor(identity: Identity): Promise<BackendActor> {
  const host = getHost();
  const agent = new HttpAgent({ host, identity });

  const shouldFetchRootKey =
    host.startsWith("http://127.0.0.1") ||
    host.startsWith("http://localhost") ||
    host.includes(".localhost");

  if (shouldFetchRootKey) {
    await agent.fetchRootKey();
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: getBackendCanisterId(),
  }) as BackendActor;
}

export type AuthenticatedBackendSession = {
  principal: string;
  checkAndSaveIdentity: (anchorNumber: bigint, email: string) => Promise<LoginCheckResult>;
};

export async function loginWithInternetIdentity(): Promise<AuthenticatedBackendSession> {
  const authClient = await AuthClient.create();

  if (!(await authClient.isAuthenticated())) {
    await new Promise<void>((resolve, reject) => {
      authClient.login({
        identityProvider: getIdentityProvider(),
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000),
        onSuccess: resolve,
        onError: () => reject(new Error("Internet Identity login failed.")),
      });
    });
  }

  const identity = authClient.getIdentity();
  const principal = identity.getPrincipal().toText();
  const actor = await createBackendActor(identity);

  return {
    principal,
    checkAndSaveIdentity: async (anchorNumber: bigint, email: string) => {
      const loginResult = await actor.check_and_save_identity(anchorNumber, email);
      if ("Err" in loginResult) {
        throw new Error(loginResult.Err);
      }

      return loginResult.Ok;
    },
  };
}
