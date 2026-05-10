import axios from "axios";
import { config } from "../config.js";
import * as userService from "./userService.js";
import { readStore } from "../store/jsonDb.js";

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: "➕ Xarajat qo‘shish" }, { text: "🔄 Hamyonni yangilash" }],
    [{ text: "📊 Statistika" }, { text: "👁 Hamyonni ko‘rish" }],
    [{ text: "📜 Xarajatlarni ko‘rish" }, { text: "👤 Profil" }],
    [{ text: "👨‍💻 Dasturchi bilan bog‘lanish" }]
  ],
  resize_keyboard: true
};

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

export async function sendMessage(chatId, text, parseMode = "HTML", replyMarkup = null) {
  if (!config.botToken) throw new Error("BOT_TOKEN yo‘q");
  const payload = { chat_id: chatId, text, parse_mode: parseMode };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  await axios.post(`https://api.telegram.org/bot${config.botToken}/sendMessage`, payload);
}

export async function sendPhoto(chatId, photoUrl, caption, parseMode = "HTML", replyMarkup = null) {
  if (!config.botToken) throw new Error("BOT_TOKEN yo‘q");
  const payload = { chat_id: chatId, photo: photoUrl, caption, parse_mode: parseMode };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  await axios.post(`https://api.telegram.org/bot${config.botToken}/sendPhoto`, payload);
}

export async function sendExpenseNotification(chatId, amount, category) {
  const text = buildExpenseMessage(amount, category);
  await sendMessage(chatId, text, "HTML", MAIN_KEYBOARD);
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

  const users = readStore().users;
  const user = users.find(u => u.chatId === String(chatId));

  if (text.toLowerCase().startsWith("/start")) {
    const parts = text.split(/\s+/);
    const arg = parts.length > 1 ? parts[1].trim() : "";

    if (!arg) {
      if (user) {
        await sendMessage(chatId, `Assalomu alaykum, <b>${escapeHtml(user.name)}</b>! Bosh menyuga xush kelibsiz.`, "HTML", MAIN_KEYBOARD);
      } else {
        await sendMessage(
          chatId,
          "👋 <b>Azinex</b>\n\nVeb-ilovada «Telegramni ulash» tugmasini bosing — bot sizni avtomatik ulaydi.\nYoki veb-saytdagi kod bilan: <code>/start KOD</code>",
        );
      }
      return;
    }

    const result = userService.linkByCode(arg, chatId);
    if (!result.ok) {
      await sendMessage(chatId, "❌ Kod yaroqsiz yoki muddati o‘tgan. Veb-ilovadan qayta «Telegramni ulash» ni bosing.");
      return;
    }
    await sendMessage(chatId, "✅ <b>Telegram ulandi.</b> Endi xarajat bildirishnomalari shu yerga keladi.", "HTML", MAIN_KEYBOARD);
    return;
  }

  if (!user) {
    await sendMessage(chatId, "❌ Hisobingiz ulanmagan. Iltimos, oldin veb-ilova orqali ulaning.");
    return;
  }

  switch (text) {
    case "➕ Xarajat qo‘shish":
    case "🔄 Hamyonni yangilash":
      const isHttps = config.frontendOrigin && config.frontendOrigin.startsWith("https");
      if (isHttps) {
        await sendMessage(chatId, "Amallarni bajarish uchun ilovani oching:", "HTML", {
          inline_keyboard: [[{ text: "📱 Ilovani ochish", web_app: { url: config.frontendOrigin } }]]
        });
      } else {
        await sendMessage(chatId, "Iltimos, ushbu amalni bajarish uchun saytimizga kiring.", "HTML", MAIN_KEYBOARD);
      }
      break;
    case "📊 Statistika":
      const totalExpenses = user.expenses.reduce((s, e) => s + e.amount, 0);
      await sendMessage(chatId, `📊 Sizning jami xarajatlaringiz: <b>${formatAmount(totalExpenses)} ${config.currency}</b>\nJami tranzaksiyalar: <b>${user.expenses.length}</b> ta`, "HTML", MAIN_KEYBOARD);
      break;
    case "👁 Hamyonni ko‘rish":
      await sendMessage(chatId, `💰 Hamyoningizdagi fond: <b>${formatAmount(user.balance)} ${config.currency}</b>`, "HTML", MAIN_KEYBOARD);
      break;
    case "📜 Xarajatlarni ko‘rish":
      if (!user.expenses || !user.expenses.length) {
        await sendMessage(chatId, "Sizda hech qanday xarajat yo‘q.", "HTML", MAIN_KEYBOARD);
      } else {
        const last = user.expenses.slice(0, 5).map(e => `• ${escapeHtml(e.category)}: <b>${formatAmount(e.amount)}</b> ${config.currency}`).join("\n");
        await sendMessage(chatId, `📜 So‘nggi 5 ta xarajat:\n\n${last}`, "HTML", MAIN_KEYBOARD);
      }
      break;
    case "👤 Profil":
      const profileText = `👤 <b>Profil ma'lumotlari</b>\n\n<b>Ism:</b> ${escapeHtml(user.name)}\n<b>Email:</b> ${escapeHtml(user.email)}\n<b>Telefon:</b> ${escapeHtml(user.phone || "Kiritilmagan")}`;
      if (user.avatarUrl && user.avatarUrl.startsWith("http")) {
        try {
          await sendPhoto(chatId, user.avatarUrl, profileText, "HTML", MAIN_KEYBOARD);
        } catch (e) {
          await sendMessage(chatId, profileText, "HTML", MAIN_KEYBOARD);
        }
      } else {
        await sendMessage(chatId, profileText, "HTML", MAIN_KEYBOARD);
      }
      break;
    case "👨‍💻 Dasturchi bilan bog‘lanish":
      await sendMessage(chatId, "👨‍💻 Dasturchi bilan bog‘lanish uchun: @begmurodovichDeveloper", "HTML", MAIN_KEYBOARD);
      break;
    default:
      await sendMessage(chatId, "Bosh menyu:", "HTML", MAIN_KEYBOARD);
  }
}
