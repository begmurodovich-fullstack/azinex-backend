import crypto from "crypto";
import { findUserById } from "../services/userService.js";
import { withStore } from "../store/jsonDb.js";

// Helper to mutate user data safely
function updateUser(userId, mutateFn) {
  return withStore((store) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: "Foydalanuvchi topilmadi" };
    const result = mutateFn(user);
    return { ok: true, data: result };
  });
}

export function getUserData(req, res) {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  res.json({
    ok: true,
    expenses: user.expenses || [],
    balance: user.balance || 0,
    categories: user.categories || [],
  });
}

export function updateBalance(req, res) {
  const { amount } = req.body;
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) {
    return res.status(400).json({ error: "Noto'g'ri qiymat" });
  }

  const result = updateUser(req.userId, (u) => {
    u.balance = Math.round(n);
    return u.balance;
  });

  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true, balance: result.data });
}

export function addExpense(req, res) {
  const { amount, categoryKey, categoryLabel, date, time } = req.body;

  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    return res.status(400).json({ error: "Noto'g'ri summa" });
  }

  const id = crypto.randomUUID();
  const d = new Date();
  const pad = (num) => String(num).padStart(2, "0");
  
  const expense = {
    id,
    date: date || `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: time || `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    category: categoryLabel,
    categoryKey,
    amount: Math.round(n),
  };

  const result = updateUser(req.userId, (u) => {
    if (!Array.isArray(u.expenses)) u.expenses = [];
    u.expenses.unshift(expense); // Prepend
    return expense;
  });

  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true, expense: result.data });
}

export function deleteExpense(req, res) {
  const { id } = req.params;

  const result = updateUser(req.userId, (u) => {
    if (!Array.isArray(u.expenses)) return false;
    const initialLength = u.expenses.length;
    u.expenses = u.expenses.filter((e) => e.id !== id);
    return u.expenses.length !== initialLength;
  });

  if (!result.ok) return res.status(400).json({ error: result.error });
  if (!result.data) return res.status(404).json({ error: "Xarajat topilmadi" });
  
  res.json({ ok: true });
}

export function addCategory(req, res) {
  const { label } = req.body;
  const t = String(label || "").trim();
  if (!t) return res.status(400).json({ error: "Bo'sh nom" });

  const id = crypto.randomUUID();
  const key = `u_${id}`;
  
  const category = { id, key, label: t };

  const result = updateUser(req.userId, (u) => {
    if (!Array.isArray(u.categories)) u.categories = [];
    // Check for duplicates
    if (u.categories.some((c) => c.label.toLowerCase() === t.toLowerCase())) {
      return null;
    }
    u.categories.push(category);
    return category;
  });

  if (!result.ok) return res.status(400).json({ error: result.error });
  if (!result.data) return res.status(400).json({ error: "Bunday turkum allaqachon mavjud" });
  
  res.json({ ok: true, category: result.data });
}

export function deleteCategory(req, res) {
  const { key } = req.params;

  const result = updateUser(req.userId, (u) => {
    if (!Array.isArray(u.categories)) return false;
    const initialLength = u.categories.length;
    u.categories = u.categories.filter((c) => c.key !== key);
    return u.categories.length !== initialLength;
  });

  if (!result.ok) return res.status(400).json({ error: result.error });
  if (!result.data) return res.status(404).json({ error: "Turkum topilmadi" });
  
  res.json({ ok: true });
}
