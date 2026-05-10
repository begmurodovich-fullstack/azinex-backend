import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });

export const config = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  botToken: process.env.BOT_TOKEN || "",
  /** Public HTTPS base (Render), no trailing slash — used to register webhook */
  publicUrl: (process.env.PUBLIC_URL || "").replace(/\/$/, ""),
  /** Must match secret_token passed to setWebhook; Telegram sends it as X-Telegram-Bot-Api-Secret-Token */
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "",
  currency: "UZS",
};
