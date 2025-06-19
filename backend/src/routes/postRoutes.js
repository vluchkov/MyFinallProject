import express from "express";
import {
  createPost,
  deletePost,
  updatePost,
  getAllPosts,
  getMyPosts,
  getPostsByUserId,
  getPostsByUsername,
  likePost,
  getFollowedUsersPosts,
  getPostById,
} from "../controllers/postController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ========== ОТКРЫТЫЕ РОУТЫ ==========

// ОТКРЫТЫЕ РОУТЫ
router.get("/", getAllPosts);
router.get("/user/username/:username", getPostsByUsername);
router.get("/user/:userId", getPostsByUserId);

// Защищённые (сначала — специфичные!)
router.use(verifyToken);

router.get("/my", getMyPosts);
router.get("/followed", getFollowedUsersPosts); // <-- перемещено выше

router.get("/:id", getPostById); // <-- теперь в конце!

router.post("/", upload.single("media"), createPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.post("/:id/like", likePost);


export default router;
