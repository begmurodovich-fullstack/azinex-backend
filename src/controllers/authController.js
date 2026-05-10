import * as authService from "../services/authService.js";
import { findUserById, publicUser } from "../services/userService.js";

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body || {};
    const result = await authService.signup({ name, email, password });
    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(201).json({
      ok: true,
      message: "Ro'yxatdan o'tdingiz. Endi login qiling.",
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Signup error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const result = await authService.login(email, password);
    if (!result.ok) return res.status(401).json({ error: result.error });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Login error" });
  }
}

export function me(req, res) {
  const u = findUserById(req.userId);
  if (!u) return res.status(404).json({ error: "User not found" });
  return res.json({ ok: true, user: publicUser(u) });
}
