import express from 'express';
import { searchUsers } from '../controllers/searchController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, searchUsers);

export default router;
