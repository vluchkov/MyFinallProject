import express from 'express';
import { likePost } from '../controllers/likeController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/:id/like', verifyToken, likePost);


export default router;
