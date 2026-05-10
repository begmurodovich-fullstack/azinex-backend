import { Router } from "express";
import { notify } from "../controllers/notifyController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/notify", requireAuth, notify);

export default router;
