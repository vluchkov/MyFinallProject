import express from 'express';
import {
  createConversation,
  getConversations,
  sendMessage,
  getMessages,
  deleteConversation,
  markMessagesAsRead,
} from '../controllers/messageController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Conversations routes
router.post('/conversations', verifyToken, createConversation);
router.get('/conversations', verifyToken, getConversations);
router.get('/conversations/:conversationId/messages', verifyToken, getMessages);
router.post('/conversations/:conversationId/messages', verifyToken, sendMessage);
router.delete('/conversations/:conversationId', verifyToken, deleteConversation);
router.put('/conversations/:conversationId/read', verifyToken, markMessagesAsRead);

export default router;
