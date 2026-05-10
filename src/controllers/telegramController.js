import { issueLinkCode, setChatId } from "../services/userService.js";
import {
  handleWebhookUpdate,
  verifyWebhookSecret,
} from "../services/telegramService.js";

export function connectTelegram(req, res) {
  const { chatId } = req.body || {};

  if (chatId != null && String(chatId).trim() !== "") {
    setChatId(req.userId, String(chatId).trim());
    return res.json({ ok: true, linked: true, mode: "chat_id" });
  }

  const { code, expiresAt } = issueLinkCode(req.userId);
  return res.json({
    ok: true,
    mode: "code",
    code,
    expiresAt,
    startCommand: `/start ${code}`,
  });
}

export async function webhook(req, res) {
  if (!verifyWebhookSecret(req)) {
    return res.status(401).json({ error: "Invalid webhook secret" });
  }
  try {
    await handleWebhookUpdate(req.body || {});
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Webhook error" });
  }
}
