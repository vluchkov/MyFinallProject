import express from "express";
import {
  addPostToFavorite,
  getFavoritePosts,
  removePostFromFavorite,
} from "../controllers/favoriteController.js";
import { protect } from "../middleware/authMiddleware.js"; // Предполагаем, что у вас есть такой middleware

const router = express.Router();

// POST /api/favorites - Добавить пост в избранное (защищено)
router.post("/", protect, addPostToFavorite);

// GET /api/favorites - Получить все избранные посты пользователя (защищено)
router.get("/", protect, getFavoritePosts);

// DELETE /api/favorites/:postId - Удалить пост из избранного (защищено)
router.delete("/:postId", protect, removePostFromFavorite);

export default router;
