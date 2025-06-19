import express from 'express';
import { followUser, unfollowUser } from '../controllers/followController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/follow', verifyToken, followUser);
router.post('/unfollow', verifyToken, unfollowUser);

export default router;
