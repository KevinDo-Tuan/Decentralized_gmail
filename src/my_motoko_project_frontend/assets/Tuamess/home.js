import { AuthClient } from "./auth-client.js";

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

const getCanisterId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("canisterId");
};

const goToMain = () => {
    const canisterId = getCanisterId();
    const url = new URL("/Tuamess/main.html", window.location.origin);
    if (canisterId) {
        url.searchParams.set("canisterId", canisterId);
    }
    window.location.assign(url.toString());
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
        return true;
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

    return false;
};

const login = async () => {
    setStatus("Opening Internet Identity...");
    await authClient.login({
        identityProvider: II_URL,
        maxTimeToLive: MAX_TTL,
        onSuccess: async () => {
            await updateUI();
            goToMain();
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
    const isAuthenticated = await updateUI();
    if (isAuthenticated) {
        goToMain();
    }
};

init();
