import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    // Получатель уведомления
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    // Отправитель действия (кто лайкнул, прокомментировал, подписался)
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["like", "comment", "follow"], // Тип уведомления
    required: true,
  },
  post: {
    // Связанный пост (для лайков и комментариев)
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: false, // Не для всех типов уведомлений (например, follow)
  },
  message: {
    // Можно оставить для обратной совместимости или для дополнительного текста
    type: String,
    required: false, // Сделаем необязательным, т.к. будем генерировать на фронте
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Добавляем индексы для более быстрого поиска
notificationSchema.index({ user: 1, createdAt: -1 }); // Для выборки уведомлений пользователя
notificationSchema.index({ user: 1, read: 1, createdAt: -1 }); // Для выборки непрочитанных

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
