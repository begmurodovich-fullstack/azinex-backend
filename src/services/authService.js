import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config.js";
import * as userService from "./userService.js";

const BCRYPT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup({ name, email, password }) {
  const n = String(name || "").trim();
  const e = String(email || "").trim().toLowerCase();
  const p = String(password || "");

  if (n.length < 1 || n.length > 80) {
    return { ok: false, error: "Ism 1–80 belgi bo‘lsin" };
  }
  if (!EMAIL_RE.test(e)) {
    return { ok: false, error: "Email noto‘g‘ri" };
  }
  if (p.length < 8) {
    return { ok: false, error: "Parol kamida 8 belgi bo‘lsin" };
  }
  if (p.length > 128) {
    return { ok: false, error: "Parol juda uzun" };
  }
  return { ok: true, name: n, email: e, password: p };
}

export async function signup({ name, email, password }) {
  const v = validateSignup({ name, email, password });
  if (!v.ok) return v;

  const passwordHash = await bcrypt.hash(v.password, BCRYPT_ROUNDS);
  const id = crypto.randomUUID();
  const created = userService.createUser({
    id,
    email: v.email,
    passwordHash,
    name: v.name,
  });
  if (!created.ok) return created;

  return {
    ok: true,
    user: userService.publicUser(userService.findUserById(id)),
  };
}

export async function login(email, password) {
  const e = String(email || "").trim().toLowerCase();
  const p = String(password || "");
  const user = userService.findUserByEmail(e);
  if (!user) {
    return { ok: false, error: "Email yoki parol noto‘g‘ri" };
  }
  const match = await bcrypt.compare(p, user.passwordHash);
  if (!match) {
    return { ok: false, error: "Email yoki parol noto‘g‘ri" };
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpires },
  );

  return {
    ok: true,
    token,
    user: userService.publicUser(user),
  };
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const id = payload.sub;
    const email = payload.email;
    if (typeof id !== "string" || typeof email !== "string") return null;
    const user = userService.findUserById(id);
    if (!user || user.email !== email) return null;
    return { id, email };
  } catch {
    return null;
  }
}
