import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const app = express();
app.use(cors());
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const CURRENCY = "UZS";

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

// test route
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

// notify route
app.post("/notify", async (req, res) => {
  if (!TOKEN || !CHAT_ID) {
    return res.status(500).json({
      error: "BOT_TOKEN yoki CHAT_ID topilmadi (.env ni tekshiring)",
    });
  }

  const { amount, category } = req.body;
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

  const text = [
    "✨ <b>Yangi xarajat qo‘shildi!</b>",
    "",
    "┌───────────────────",
    `💰 <b>Summa:</b> <code>${amountPretty} ${CURRENCY}</code>`,
    `📂 <b>Kategoriya:</b> ${safeCategory}`,
    `🕒 <b>Sana:</b> ${formattedDate}`,
    "└────────────────────",
    "",
    "Azinex orqali avtomatik yuborildi.",
  ].join("\n");

  try {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
    });

    res.json({ success: true });
  } catch (error) {
    console.log("Telegram send error:", error.response?.data || error.message);
    res.status(500).json({ error: "Xatolik yuz berdi" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000 🚀");
});
