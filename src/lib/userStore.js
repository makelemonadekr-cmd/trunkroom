/**
 * userStore.js
 *
 * localStorage-backed store for user profile & account data.
 */

const KEY = "trunkroom_user";

const DEFAULT_USER = {
  nickname: "트렁크룸 회원",
  bio: "",
  gender: "",
  birthDate: "",
  height: "",
  styleKeywords: [],
  profileImage: null,
  name: "회원",
  phone: "",
  email: "user@example.com",
  address: "",
  marketingConsent: false,
  pushConsent: true,
  loginMethod: "email",
};

function readRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getUser() {
  const saved = readRaw();
  return { ...DEFAULT_USER, ...(saved || {}) };
}

export function saveUser(partial) {
  const current = getUser();
  const next = { ...current, ...(partial || {}) };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("userStore: failed to save", e);
  }
  return next;
}

export function clearUser() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.warn("userStore: failed to clear", e);
  }
  return { ...DEFAULT_USER };
}
