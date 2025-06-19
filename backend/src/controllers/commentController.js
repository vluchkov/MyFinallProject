import Comment from "../models/commentModel.js";
import Post from "../models/postModel.js";
import Notification from "../models/notificationModel.js";

export const createComment = async (req, res) => {
  const { postId, content } = req.body;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = new Comment({
      post: postId,
      author: userId,
      content,
    });

    const savedComment = await newComment.save();

    post.comments.push(savedComment._id);
    await post.save();

    if (post.author.toString() !== userId.toString()) {
      console.log(
        `COMMENT_NOTIFICATION_DEBUG: Attempting to create notification for comment.`
      );
      console.log(
        `COMMENT_NOTIFICATION_DEBUG: Recipient (post.author): ${post.author}`
      );
      console.log(`COMMENT_NOTIFICATION_DEBUG: Commenter (userId): ${userId}`);
      console.log(
        `COMMENT_NOTIFICATION_DEBUG: Commenter username (req.user.username): ${req.user.username}`
      );
      try {
        await Notification.create({
          user: post.author,
          sender: userId,
          type: "comment",
          post: postId,
          message: `Пользователь @${
            req.user.username || "Someone"
          } прокомментировал ваш пост.`,
        });
        console.log(
          `COMMENT_NOTIFICATION_DEBUG: Notification successfully created for comment.`
        );
      } catch (notificationError) {
        console.error(
          "Error creating comment notification:",
          notificationError
        );
      }
    }

    const populatedComment = await Comment.findById(savedComment._id).populate(
      "author",
      "username avatar"
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getCommentsByPost = async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username"
    );
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
