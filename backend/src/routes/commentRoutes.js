import express from 'express';
import { createComment, getCommentsByPost, deleteComment } from '../controllers/commentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, createComment);
router.get('/:postId', verifyToken, getCommentsByPost);
router.delete('/:id', verifyToken, deleteComment);

export default router;
