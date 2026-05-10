import crypto from "crypto";
import { readStore, withStore } from "../store/jsonDb.js";

const LINK_TTL_MS = 15 * 60 * 1000;
const CODE_LEN = 8;

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(CODE_LEN);
  let s = "";
  for (let i = 0; i < CODE_LEN; i++) s += alphabet[bytes[i] % alphabet.length];
  return s;
}

export function findUserByEmail(email) {
  const e = email.trim().toLowerCase();
  return readStore().users.find((u) => u.email === e) ?? null;
}

export function findUserById(id) {
  return readStore().users.find((u) => u.id === id) ?? null;
}

export function createUser({ id, email, passwordHash, name }) {
  return withStore((store) => {
    if (store.users.some((u) => u.email === email)) {
      return { ok: false, error: "Bu email bilan ro‘yxatdan o‘tilgan" };
    }
    store.users.push({
      id,
      email,
      passwordHash,
      name,
      chatId: null,
      expenses: [],
      balance: 0,
      categories: [],
    });
    return { ok: true };
  });
}

export function setChatId(userId, chatId) {
  withStore((store) => {
    const u = store.users.find((x) => x.id === userId);
    if (u) u.chatId = String(chatId);
  });
}

/** Remove other users that had this chatId (one Telegram account → one app user) */
export function assignChatIdExclusive(userId, chatId) {
  const cid = String(chatId);
  withStore((store) => {
    for (const u of store.users) {
      if (u.id !== userId && u.chatId === cid) u.chatId = null;
    }
    const u = store.users.find((x) => x.id === userId);
    if (u) u.chatId = cid;
  });
}

export function issueLinkCode(userId) {
  return withStore((store) => {
    const now = Date.now();
    store.pendingTelegramLinks = store.pendingTelegramLinks.filter(
      (p) => p.expiresAt > now && p.userId !== userId,
    );
    let code = randomCode();
    for (let i = 0; i < 5; i++) {
      if (!store.pendingTelegramLinks.some((p) => p.code === code)) break;
      code = randomCode();
    }
    const expiresAt = now + LINK_TTL_MS;
    store.pendingTelegramLinks.push({ code, userId, expiresAt });
    return { code, expiresAt };
  });
}

export function linkByCode(code, chatId) {
  const raw = String(code || "").trim().toUpperCase();
  if (!raw) return { ok: false, error: "code" };

  return withStore((store) => {
    const now = Date.now();
    const idx = store.pendingTelegramLinks.findIndex(
      (p) => p.code === raw && p.expiresAt > now,
    );
    if (idx === -1) return { ok: false, error: "invalid" };

    const { userId } = store.pendingTelegramLinks[idx];
    store.pendingTelegramLinks.splice(idx, 1);

    const cid = String(chatId);
    for (const u of store.users) {
      if (u.id !== userId && u.chatId === cid) u.chatId = null;
    }
    const u = store.users.find((x) => x.id === userId);
    if (!u) return { ok: false, error: "user" };
    u.chatId = cid;
    return { ok: true };
  });
}

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    hasTelegram: !!u.chatId,
  };
}
