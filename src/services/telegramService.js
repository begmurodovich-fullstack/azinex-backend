import axios from "axios";
import { config } from "../config.js";
import * as userService from "./userService.js";

function formatAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildExpenseMessage(amount, category) {
  const now = new Date();
  const formattedDate = now.toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const amountPretty = formatAmount(amount);
  const safeCategory = escapeHtml(category || "Boshqa");

  return [
    "✨ <b>Yangi xarajat qo‘shildi!</b>",
    "",
    "┌───────────────────",
    `💰 <b>Summa:</b> <code>${amountPretty} ${config.currency}</code>`,
    `📂 <b>Kategoriya:</b> ${safeCategory}`,
    `🕒 <b>Sana:</b> ${formattedDate}`,
    "└────────────────────",
    "",
    "Azinex orqali avtomatik yuborildi.",
  ].join("\n");
}

export async function sendMessage(chatId, text, parseMode = "HTML") {
  if (!config.botToken) {
    throw new Error("BOT_TOKEN yo‘q");
  }
  await axios.post(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
  });
}

export async function sendExpenseNotification(chatId, amount, category) {
  const text = buildExpenseMessage(amount, category);
  await sendMessage(chatId, text);
}

export async function setupWebhook() {
  if (!config.botToken || !config.publicUrl) {
    console.log("Webhook: PUBLIC_URL yoki BOT_TOKEN yo‘q — o‘tkazib yuborildi");
    return;
  }
  const url = `${config.publicUrl}/telegram/webhook`;
  const body = { url };
  if (config.telegramWebhookSecret) {
    body.secret_token = config.telegramWebhookSecret;
  }
  try {
    const { data } = await axios.post(
      `https://api.telegram.org/bot${config.botToken}/setWebhook`,
      body,
    );
    console.log("Telegram setWebhook:", data.description || data);
  } catch (e) {
    console.log("setWebhook xato:", e.response?.data || e.message);
  }
}

/**
 * @param {import('express').Request} req
 */
export function verifyWebhookSecret(req) {
  if (!config.telegramWebhookSecret) return true;
  const got = req.headers["x-telegram-bot-api-secret-token"];
  return got === config.telegramWebhookSecret;
}

export async function handleWebhookUpdate(update) {
  const msg = update.message || update.edited_message;
  if (!msg?.text) return;

  const text = String(msg.text).trim();
  const chatId = msg.chat?.id;
  if (chatId == null) return;

  if (!text.toLowerCase().startsWith("/start")) return;

  const parts = text.split(/\s+/);
  const arg = parts.length > 1 ? parts[1].trim() : "";

  if (!arg) {
    await sendMessage(
      chatId,
      [
        "👋 <b>Azinex</b>",
        "",
        "Veb-ilovada «Telegramni ulash» tugmasini bosing — bot sizni avtomatik ulaydi.",
        "Yoki veb-saytdagi kod bilan: <code>/start KOD</code>",
      ].join("\n"),
    );
    return;
  }

  const result = userService.linkByCode(arg, chatId);
  if (!result.ok) {
    await sendMessage(
      chatId,
      "❌ Kod yaroqsiz yoki muddati o‘tgan. Veb-ilovadan qayta «Telegramni ulash» ni bosing.",
    );
    return;
  }

  await sendMessage(
    chatId,
    "✅ <b>Telegram ulandi.</b> Endi xarajat bildirishnomalari shu yerga keladi.",
  );
}
