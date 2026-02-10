import { AuthClient } from "https://esm.sh/@dfinity/auth-client";

const II_URL = "https://identity.ic0.app";
const MAX_TTL = BigInt(7 * 24 * 60 * 60 * 1_000_000_000);

let authClient;

const byId = (id) => document.getElementById(id);
const loginButtons = [byId("ii-login-nav"), byId("ii-login-hero")].filter(Boolean);
const logoutButton = byId("ii-logout");
const statusEl = byId("ii-status");

const setStatus = (text) => {
    if (statusEl) {
        statusEl.textContent = text;
    }
};

const updateUI = async () => {
    const isAuthenticated = await authClient.isAuthenticated();

    if (isAuthenticated) {
        const principal = authClient.getIdentity().getPrincipal().toText();
        setStatus(`Signed in as ${principal}`);
        loginButtons.forEach((btn) => {
            btn.textContent = "Connected";
            btn.disabled = true;
        });
        if (logoutButton) {
            logoutButton.hidden = false;
        }
        return;
    }

    setStatus("");
    loginButtons.forEach((btn) => {
        if (btn.id === "ii-login-nav") {
            btn.textContent = "Internet Identity";
        } else {
            btn.textContent = "Continue with Internet Identity";
        }
        btn.disabled = false;
    });
    if (logoutButton) {
        logoutButton.hidden = true;
    }
};

const login = async () => {
    setStatus("Opening Internet Identity...");
    await authClient.login({
        identityProvider: II_URL,
        maxTimeToLive: MAX_TTL,
        onSuccess: async () => {
            await updateUI();
        },
        onError: (err) => {
            console.error(err);
            setStatus("Sign-in failed. Please try again.");
        },
    });
};

const logout = async () => {
    await authClient.logout();
    await updateUI();
};

const init = async () => {
    authClient = await AuthClient.create();
    loginButtons.forEach((btn) => btn.addEventListener("click", login));
    logoutButton?.addEventListener("click", logout);
    await updateUI();
};

init();
