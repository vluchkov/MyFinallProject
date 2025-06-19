import Notification from "../models/notificationModel.js";
import mongoose from "mongoose";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("sender", "username avatar")
      .populate("post", "imageUrl videoUrl mediaType content")
      .sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createNotificationManually = async (req, res) => {
  try {
    const { userId, type, message } = req.body;

    if (!userId || !type || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const notification = await Notification.create({
      user: userId,
      type,
      message,
    });

    res.status(201).json({ message: "Notification created", notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false }, // Find unread notifications for the current user
      { $set: { read: true } } // Set read to true
    );
    // Optionally, you can fetch the new unread count or return a success message
    // For now, let's just return a success message.
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};

// Mark a single notification as read
export const markSingleNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res
        .status(400)
        .json({ message: "Неверный формат ID уведомления" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId, read: false }, // Find unread notification for the current user by its ID
      { $set: { read: true } },
      { new: true } // Return the updated document
    );

    if (!notification) {
      // Это может произойти, если уведомление не найдено, не принадлежит пользователю, или уже прочитано
      // В любом из этих случаев мы не должны возвращать ошибку, просто уведомление не было обновлено.
      // Однако, для отладки или специфических нужд можно вернуть 404.
      // Пока что вернем успех, так как основная операция (попытка пометить) выполнена.
      // Или можно проверить, было ли оно просто уже прочитано и вернуть его.
      const existingNotification = await Notification.findOne({
        _id: notificationId,
        user: userId,
      });
      if (existingNotification && existingNotification.read) {
        return res
          .status(200)
          .json({
            message: "Уведомление уже было прочитано",
            notification: existingNotification,
          });
      }
      return res
        .status(404)
        .json({
          message: "Уведомление не найдено или не принадлежит пользователю",
        });
    }

    res
      .status(200)
      .json({ message: "Уведомление помечено как прочитанное", notification });
  } catch (error) {
    console.error("Error marking single notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};
