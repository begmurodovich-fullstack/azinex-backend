import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "..", "data", "store.json");

const defaultStore = () => ({
  users: [],
  pendingTelegramLinks: [],
});

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultStore(), null, 2), "utf8");
  }
}

export function readStore() {
  ensureFile();
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data.users)) data.users = [];
    if (!Array.isArray(data.pendingTelegramLinks)) data.pendingTelegramLinks = [];
    
    // Add missing fields for existing users
    for (const u of data.users) {
      if (!Array.isArray(u.expenses)) u.expenses = [];
      if (typeof u.balance !== "number") u.balance = 0;
      if (!Array.isArray(u.categories)) u.categories = [];
    }
    
    return data;
  } catch {
    return defaultStore();
  }
}

export function writeStore(store) {
  ensureFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf8");
}

/** Run a synchronous read-modify-write transaction */
export function withStore(fn) {
  const store = readStore();
  const out = fn(store);
  writeStore(store);
  return out;
}
