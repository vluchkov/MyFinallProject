import Post from "../models/postModel.js";
import Notification from "../models/notificationModel.js";

export const likePost = async (req, res) => {
  console.log(
    `[likeController.js] Received request to like/unlike post. Post ID: ${req.params.id}, User ID: ${req.user?._id}`
  );
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "id _id username"
    );
    if (!post) return res.status(404).json({ error: "Post not found" });

    const likerId = req.user._id;

    if (!post.likes.includes(likerId)) {
      post.likes.push(likerId);

      if (!post.mediaType) {
        if (post.imageUrl) {
          post.mediaType = "image";
        } else if (post.videoUrl) {
          post.mediaType = "video";
        } else {
          post.mediaType = "image";
        }
        console.warn(
          `[likeController.js] У поста ${post._id} отсутствовал mediaType при лайке. Установлено значение: ${post.mediaType}.`
        );
      }

      await post.save();

      if (post.author && post.author._id.toString() !== likerId.toString()) {
        console.log(
          `LIKE_NOTIFICATION_DEBUG: Attempting to create notification for like.`
        );
        console.log(
          `LIKE_NOTIFICATION_DEBUG: Recipient (post.author._id): ${post.author._id}`
        );
        console.log(`LIKE_NOTIFICATION_DEBUG: Liker (likerId): ${likerId}`);
        console.log(
          `LIKE_NOTIFICATION_DEBUG: Liker username (req.user.username): ${req.user.username}`
        );
        try {
          await Notification.create({
            user: post.author._id,
            sender: likerId,
            type: "like",
            post: post._id,
            message: `Пользователь @${
              req.user.username || "Someone"
            } лайкнул ваш пост.`,
          });
          console.log(
            `LIKE_NOTIFICATION_DEBUG: Notification successfully created for like.`
          );
        } catch (notificationError) {
          console.error("Error creating like notification:", notificationError);
        }
      }
      const updatedPost = await Post.findById(post._id)
        .populate("author", "username avatar")
        .populate("comments.author", "username avatar");

      return res.status(200).json(updatedPost);
    } else {
      const currentPostState = await Post.findById(post._id)
        .populate("author", "username avatar")
        .populate("comments.author", "username avatar");
      return res.status(200).json(currentPostState);
    }
  } catch (error) {
    console.error("Error in likePost controller:", error);
    res.status(500).json({ error: error.message });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const likerId = req.user._id;
    const likeIndex = post.likes.indexOf(likerId);

    if (likeIndex !== -1) {
      post.likes.splice(likeIndex, 1);

      if (!post.mediaType) {
        if (post.imageUrl) {
          post.mediaType = "image";
        } else if (post.videoUrl) {
          post.mediaType = "video";
        } else {
          post.mediaType = "image";
        }
        console.warn(
          `[likeController.js] У поста ${post._id} отсутствовал mediaType при анлайке. Установлено значение: ${post.mediaType}.`
        );
      }

      await post.save();
    }

    const updatedPost = await Post.findById(post._id)
      .populate("author", "username avatar")
      .populate("comments.author", "username avatar");
    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error in unlikePost controller:", error);
    res.status(500).json({ error: error.message });
  }
};

// export const likePost = async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) return res.status(404).json({ error: 'Post not found' });

//     const likeIndex = post.likes.indexOf(req.user.id);

//     if (likeIndex === -1) {
//       post.likes.push(req.user.id);
//       await post.save();
//       return res.status(200).json({ message: 'Post liked' });
//     } else {
//       post.likes.splice(likeIndex, 1);
//       await post.save();
//       return res.status(200).json({ message: 'Post unliked' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
