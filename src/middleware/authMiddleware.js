import { verifyToken } from "../services/authService.js";
import { findUserById, publicUser } from "../services/userService.js";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = findUserById(payload.id);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  req.user = publicUser(user);
  req.userId = user.id;
  req.chatId = user.chatId || null;
  return next();
}
