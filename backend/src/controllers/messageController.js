import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import Conversation from '../models/conversationModel.js';

// Create a new conversation with participants
export const createConversation = async (req, res) => {
  const { participantIds } = req.body; // array of user IDs
  try {
    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({ message: 'At least two participants are required' });
    }
    // Check if conversation with same participants exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: participantIds, $size: participantIds.length },
    });
    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }
    const conversation = await Conversation.create({ participants: participantIds });
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all conversations for the authenticated user
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', '_id username avatar')
      .sort({ updatedAt: -1 });

    // Для каждого чата считаем количество непрочитанных сообщений
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          read: false,
        });
        // lastMessage теперь не строка, а объект (если нужно)
        return {
          ...conv.toObject(),
          unreadCount,
        };
      })
    );
    res.status(200).json(conversationsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a message in a conversation
export const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text,
    });

    // Update lastMessage in conversation
    conversation.lastMessage = text;
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages in a conversation with optional limit and pagination
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const limit = parseInt(req.query.limit) || 50; // default limit 50 messages
  const page = parseInt(req.query.page) || 1; // default page 1
  try {
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username avatar fullName');
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    // Проверка: пользователь должен быть участником беседы
    if (!conversation.participants.map(id => id.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Удалить все сообщения этой беседы
    await Message.deleteMany({ conversation: conversationId });
    // Удалить саму беседу
    await conversation.deleteOne();
    res.status(200).json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all messages in a conversation as read for the current user
export const markMessagesAsRead = async (req, res) => {
  const { conversationId } = req.params;
  try {
    // Обновляем все сообщения, которые не были прочитаны и не отправлены текущим пользователем
    const result = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        read: false,
      },
      { $set: { read: true } }
    );
    res.status(200).json({ message: 'Messages marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
