import { Router } from "express";
import {
  connectTelegram,
  webhook,
} from "../controllers/telegramController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/connect-telegram", requireAuth, connectTelegram);
router.post("/telegram/webhook", webhook);

export default router;
