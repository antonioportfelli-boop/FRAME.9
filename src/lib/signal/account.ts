import { create } from "zustand";

export const ADMIN_EMAIL = "tkynnap@gmail.com";
export const ADMIN_USERNAME = "archidect9";

type StoredAccount = {
  username: string;
  email: string;
  salt: string;
  hash: string;
  verified: boolean;
  createdAt: string;
};

type Session = { username: string; email: string; role: "admin" | "member" };

const ACCOUNTS = "frame9.accounts.v2";
const SESSION = "frame9.session.v2";

const OWNER: StoredAccount = {
  username: ADMIN_USERNAME,
  email: ADMIN_EMAIL,
  salt: "9a0dee44-6768-4e39-a7ee-dc46f058f1be",
  hash: "0392c19c5cbea3650b9404a5517cc6ad42485c9cb7f6736abece4fd802823b11",
  verified: true,
  createdAt: "2026-10-07T04:43:00.000Z",
};

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS);
    const parsed = raw ? (JSON.parse(raw) as StoredAccount[]) : [];
    const accounts = Array.isArray(parsed) ? parsed.filter((item) => item?.username && item?.hash) : [];
    if (!accounts.some((item) => item.username === ADMIN_USERNAME)) accounts.unshift(OWNER);
    return accounts;
  } catch {
    return [OWNER];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS, JSON.stringify(accounts));
}

async function digest(salt: string, username: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}|${username}|${password}`);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function roleFor(username: string, email: string, verified: boolean): Session["role"] {
  if (!verified) return "member";
  if (username === ADMIN_USERNAME || email === ADMIN_EMAIL) return "admin";
  return "member";
}

function codeFor(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 6).toUpperCase();
}

type AccountState = {
  session: Session | null;
  error: string | null;
  open: boolean;
  pending: { username: string; email: string; code: string } | null;
  hydrate: () => void;
  setOpen: (open: boolean) => void;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  confirmCode: (code: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const useAccount = create<AccountState>((set, get) => ({
  session: null,
  error: null,
  open: false,
  pending: null,
  hydrate: () => {
    saveAccounts(loadAccounts());
    try {
      const raw = sessionStorage.getItem(SESSION);
      if (!raw) return;
      const session = JSON.parse(raw) as Session;
      if (!session?.username) return;
      const account = loadAccounts().find((item) => item.username === session.username);
      if (!account?.verified) return;
      set({ session: { username: account.username, email: account.email, role: roleFor(account.username, account.email, true) } });
    } catch {
      set({ session: null });
    }
  },
  setOpen: (open) => set({ open, error: null }),
  signUp: async (username, email, password) => {
    const name = username.trim().toLowerCase();
    const normalized = email.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(name)) {
      set({ error: "Kasutajanimi: 3–32 märki, ladina tähed ja numbrid." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      set({ error: "See ei ole e-posti aadress." });
      return;
    }
    if (password.length < 8) {
      set({ error: "Parool olgu vähemalt 8 märki." });
      return;
    }
    const accounts = loadAccounts();
    if (accounts.some((item) => item.username === name || item.email === normalized)) {
      set({ error: "See konto on juba olemas. Sisene." });
      return;
    }
    const salt = crypto.randomUUID();
    const hash = await digest(salt, name, password);
    accounts.push({ username: name, email: normalized, salt, hash, verified: false, createdAt: new Date().toISOString() });
    saveAccounts(accounts);
    set({
      pending: { username: name, email: normalized, code: codeFor() },
      error: null,
      session: null,
    });
  },
  confirmCode: async (code) => {
    const pending = get().pending;
    if (!pending) {
      set({ error: "Kinnituskoodi ei oota ükski konto." });
      return;
    }
    if (code.trim().toUpperCase() !== pending.code) {
      set({ error: "Kood ei klapi." });
      return;
    }
    const accounts = loadAccounts();
    const account = accounts.find((item) => item.username === pending.username);
    if (!account) {
      set({ error: "Kontot ei leitud." });
      return;
    }
    account.verified = true;
    saveAccounts(accounts);
    const session = { username: account.username, email: account.email, role: roleFor(account.username, account.email, true) };
    sessionStorage.setItem(SESSION, JSON.stringify(session));
    set({ session, pending: null, error: null, open: false });
  },
  signIn: async (username, password) => {
    const name = username.trim().toLowerCase();
    const account = loadAccounts().find((item) => item.username === name || item.email === name);
    if (!account) {
      set({ error: "Kontot ei ole." });
      return;
    }
    const hash = await digest(account.salt, account.username, password);
    if (hash !== account.hash) {
      set({ error: "Parool ei klapi." });
      return;
    }
    if (!account.verified) {
      set({
        pending: { username: account.username, email: account.email, code: codeFor() },
        error: "Konto on kinnitamata. Kood on siin, sest kirja saatvat serverit ei ole ühendatud.",
      });
      return;
    }
    const session = { username: account.username, email: account.email, role: roleFor(account.username, account.email, true) };
    sessionStorage.setItem(SESSION, JSON.stringify(session));
    set({ session, error: null, open: false, pending: null });
  },
  signOut: () => {
    sessionStorage.removeItem(SESSION);
    set({ session: null });
  },
}));
