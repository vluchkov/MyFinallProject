import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getAllUsers,
  getCurrentUserProfile,
  getUserProfileByUsername,
  getUserFollowers,
  getUserFollowing,
  changePassword,
} from "../controllers/userController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import uploadAvatar from "../middleware/avatarUploadMiddleware.js";

const router = express.Router();

// GET: Получить профиль текущего пользователя
router.get("/me", verifyToken, getCurrentUserProfile);

// GET: Получить профиль пользователя
router.get("/:id", verifyToken, getUserProfile);

// GET: Получить профиль пользователя по username
router.get("/profile/:username", verifyToken, getUserProfileByUsername);

// GET: Получить подписчиков пользователя
router.get("/:userId/followers", verifyToken, getUserFollowers);

// GET: Получить подписки пользователя
router.get("/:userId/following", verifyToken, getUserFollowing);

// PUT: Смена пароля пользователя
router.put("/change-password", verifyToken, changePassword);

// PUT: Обновить профиль пользователя
router.put(
  "/:id",
  verifyToken,
  uploadAvatar.single("avatar"),
  updateUserProfile
);

// DELETE: Удалить пользователя
router.delete("/:id", verifyToken, deleteUser);

// GET: Получить всех пользователей
router.get("/", getAllUsers);

export default router;
