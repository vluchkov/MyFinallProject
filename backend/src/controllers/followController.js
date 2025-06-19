import Follow from "../models/followModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";

export const followUser = async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user._id;

  console.log(`Attempting to follow: User ${currentUserId} -> User ${userId}`);

  try {
    const userToFollow = await User.findById(userId);
    if (!userToFollow)
      return res.status(404).json({ message: "User not found" });

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: userId,
    });
    console.log("Existing follow check result:", existingFollow);
    if (existingFollow)
      return res.status(400).json({ message: "Already following this user" });

    const follow = await Follow.create({
      follower: currentUserId,
      following: userId,
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: currentUserId },
    });
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: userId },
    });

    // 2. Создание уведомления
    console.log(
      `FOLLOW_NOTIFICATION_DEBUG: Attempting to create notification for follow.`
    );
    console.log(
      `FOLLOW_NOTIFICATION_DEBUG: Recipient (userId from req.body, i.e., userToFollowId): ${userId}`
    );
    console.log(
      `FOLLOW_NOTIFICATION_DEBUG: Follower (currentUserId): ${currentUserId}`
    );
    console.log(
      `FOLLOW_NOTIFICATION_DEBUG: Follower username (req.user.username): ${req.user.username}`
    );
    try {
      await Notification.create({
        user: userId,
        sender: currentUserId,
        type: "follow",
        message: `Пользователь @${
          req.user.username || "Someone"
        } начал отслеживать вас.`,
      });
      console.log(
        `FOLLOW_NOTIFICATION_DEBUG: Notification successfully created for follow.`
      );
    } catch (notificationError) {
      console.error("Error creating follow notification:", notificationError);
    }

    res.status(201).json({ message: "User followed successfully", follow });
  } catch (error) {
    console.error("Error in followUser:", error);
    res.status(500).json({ message: error.message });
  }
};

export const unfollowUser = async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user._id;

  try {
    const follow = await Follow.findOneAndDelete({
      follower: currentUserId,
      following: userId,
    });
    if (!follow)
      return res.status(404).json({
        message: "Follow relationship not found or already unfollowed",
      });

    await User.findByIdAndUpdate(userId, {
      $pull: { followers: currentUserId },
    });
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userId },
    });

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Error in unfollowUser:", error);
    res.status(500).json({ message: error.message });
  }
};
