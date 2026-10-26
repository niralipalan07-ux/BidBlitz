// DEMO AUTHENTICATION — runs entirely in the browser for previewing the interface.
// This is NOT production security. Replace with the FastAPI auth endpoints
// (POST /api/auth/login, /api/auth/register) before handling any real data.
import type { Role } from "./types";
import { DEMO_VENDOR_ID } from "./mock-data";

export interface Session {
  userId: string;
  name: string;
  email: string;
  company?: string;
  role: Role;
}

const SESSION_KEY = "tl_demo_session";
const USERS_KEY = "tl_demo_users";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  company: string;
  passwordHash: string;
}

export const DEMO_ACCOUNTS = {
  vendor: { email: "vendor@demo.tenderlens", password: "demo-vendor" },
  official: { email: "official@demo.tenderlens", password: "demo-official" },
};

async function hash(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function setSession(s: Session, remember: boolean) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem(SESSION_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("tl-auth"));
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("tl-auth"));
}

export async function register(input: { name: string; email: string; password: string; company: string }) {
  const users = readUsers();
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email === email) || Object.values(DEMO_ACCOUNTS).some((a) => a.email === email)) {
    throw new Error("An account with this email already exists.");
  }
  // Registration ALWAYS creates a vendor account. Official access is never self-assigned.
  users.push({
    id: `vendor-${crypto.randomUUID()}`,
    name: input.name.trim(),
    email,
    company: input.company.trim(),
    passwordHash: await hash(input.password),
  });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function signIn(
  email: string,
  password: string,
  portal: Role,
  remember = true,
): Promise<Session> {
  const e = email.trim().toLowerCase();
  if (portal === "official") {
    // Officials are provisioned only — no self-registration path exists.
    if (e === DEMO_ACCOUNTS.official.email && password === DEMO_ACCOUNTS.official.password) {
      const s: Session = { userId: "official-demo", name: "Demo Official", email: e, role: "official" };
      setSession(s, remember);
      return s;
    }
    throw new Error("This account is not authorized for official access.");
  }
  if (e === DEMO_ACCOUNTS.vendor.email && password === DEMO_ACCOUNTS.vendor.password) {
    const s: Session = {
      userId: DEMO_VENDOR_ID,
      name: "Asha Mehta",
      email: e,
      company: "Greenfield Systems (Demo)",
      role: "vendor",
    };
    setSession(s, remember);
    return s;
  }
  const user = readUsers().find((u) => u.email === e);
  if (!user || user.passwordHash !== (await hash(password))) {
    throw new Error("Incorrect email or password.");
  }
  const s: Session = { userId: user.id, name: user.name, email: user.email, company: user.company, role: "vendor" };
  setSession(s, remember);
  return s;
}
