import express from "express";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import notifyRoutes from "./routes/notifyRoutes.js";
import telegramRoutes from "./routes/telegramRoutes.js";
import userDataRoutes from "./routes/userDataRoutes.js";

const app = express();

app.use(
  cors(
    config.frontendOrigin
      ? {
          origin: config.frontendOrigin,
        }
      : undefined,
  ),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend working");
});

app.use(authRoutes);
app.use(notifyRoutes);
app.use(telegramRoutes);
app.use(userDataRoutes);

// Barcha topilmagan marshrutlar uchun JSON 404 qaytarish
app.use((req, res) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
});

export default app;
