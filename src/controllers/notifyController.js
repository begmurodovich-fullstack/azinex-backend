import { sendExpenseNotification } from "../services/telegramService.js";

export async function notify(req, res) {
  const { amount, category } = req.body || {};

  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  if (!req.chatId) {
    return res.status(400).json({
      error: "Telegram ulanmagan. Dashboard'dan Telegram ni ulang.",
    });
  }

  try {
    await sendExpenseNotification(req.chatId, Math.round(n), category || "Boshqa");
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Notify failed" });
  }
}
