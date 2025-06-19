import Favorite from "../models/favoriteModel.js";
import Post from "../models/postModel.js";

// Добавить пост в избранное
export const addPostToFavorite = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user._id; // Предполагаем, что req.user доступен после аутентификации

    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Попытка создать новую запись. Уникальный индекс (user, post) в модели Favorite предотвратит дубликаты.
    const newFavorite = new Favorite({
      post: postId,
      user: userId,
    });

    await newFavorite.save();
    res
      .status(201)
      .json({ message: "Post added to favorites", favorite: newFavorite });
  } catch (error) {
    // Обработка ошибки дублирования (если пост уже в избранном)
    if (error.code === 11000) {
      // Код ошибки MongoDB для дублирующегося ключа
      return res.status(400).json({ message: "Post already in favorites" });
    }
    console.error("Error in addPostToFavorite:", error);
    res.status(500).json({
      message: "Server error while adding to favorites",
      error: error.message,
    });
  }
};

// Получить все избранные посты пользователя
export const getFavoritePosts = async (req, res) => {
  try {
    const userId = req.user._id; // Предполагаем, что req.user доступен

    const favoriteEntries = await Favorite.find({ user: userId })
      .sort({ createdAt: -1 }) // Сортировка по дате добавления (сначала новые)
      .populate({
        path: "post",
        populate: [
          { path: "author", select: "username avatar" }, // Populate author of the post
          { path: "comments.author", select: "username avatar" }, // Populate author of comments
        ],
      });

    // Возвращаем массив самих постов, а не записи из Favorite
    const posts = favoriteEntries
      .map((entry) => entry.post)
      .filter((post) => post != null);

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getFavoritePosts:", error);
    res.status(500).json({
      message: "Server error while fetching favorites",
      error: error.message,
    });
  }
};

// Удалить пост из избранного
export const removePostFromFavorite = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // Предполагаем, что req.user доступен

    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const result = await Favorite.deleteOne({ post: postId, user: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Post not found in favorites" });
    }

    res.status(200).json({ message: "Post removed from favorites" });
  } catch (error) {
    console.error("Error in removePostFromFavorite:", error);
    res.status(500).json({
      message: "Server error while removing from favorites",
      error: error.message,
    });
  }
};
