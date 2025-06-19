import 'dotenv/config';
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Загрузка переменных окружения из .env файла
dotenv.config();

// Импорт моделей
import Message from "./models/messageModel.js";
import Conversation from "./models/conversationModel.js";

// Импорт маршрутов
import commentRoutes from "./routes/commentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Получение __dirname (для ES-модулей)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Конфигурация по умолчанию (теперь берется из .env)
// process.env.PORT = process.env.PORT || 3000; // Удалено, так как PORT будет из .env
// process.env.MONGO_URI = // Удалено, так как MONGO_URI будет из .env
//   process.env.MONGO_URI ||
//   "mongodb+srv://ghays:ghays@cluster0.mongodb.net/instagram-clone";
// process.env.JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here"; // Удалено, так как JWT_SECRET будет из .env

// Подключение к базе данных
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);
app.options("*", cors());

// Маршруты
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/users", userRoutes);

// Socket.io логика
io.on("connection", (socket) => {
  console.log("🟢 Клиент подключён:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Клиент ${socket.id} присоединился к комнате ${roomId}`);
  });

  socket.on("sendMessage", async ({ roomId, senderId, text }) => {
    try {
      const newMessage = await Message.create({
        conversation: roomId,
        sender: senderId,
        text,
      });

      await Conversation.findByIdAndUpdate(roomId, {
        lastMessage: text,
      });

      io.to(roomId).emit("receiveMessage", {
        _id: newMessage._id,
        sender: senderId,
        text,
        createdAt: newMessage.createdAt,
      });
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Клиент отключён:", socket.id);
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000; // Используем значение из .env, или 3000 по умолчанию
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
