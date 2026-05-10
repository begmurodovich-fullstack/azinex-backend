import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getUserData,
  updateBalance,
  addExpense,
  deleteExpense,
  addCategory,
  deleteCategory,
} from "../controllers/userDataController.js";

const router = Router();

// Barcha route-lar faqat avtorizatsiyadan o'tgan foydalanuvchilar uchun
router.use("/user-data", requireAuth);

router.get("/user-data", getUserData);
router.post("/user-data/balance", updateBalance);
router.post("/user-data/expenses", addExpense);
router.delete("/user-data/expenses/:id", deleteExpense);
router.post("/user-data/categories", addCategory);
router.delete("/user-data/categories/:key", deleteCategory);

export default router;
