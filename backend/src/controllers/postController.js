import Post from "../models/postModel.js";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import User from "../models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/posts"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Только изображения разрешены к загрузке!"));
  },
});

// Создание поста
export const createPost = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received file:', req.file);
    
    const { content, videoLink } = req.body;
    const file = req.file;

    if (!content) {
      return res.status(400).json({ error: "Добавьте описание к публикации" });
    }

    let imageUrl = null;
    let videoUrl = null;
    let mediaType = null;

    if (file) {
      // Загружен файл
      if (file.mimetype.startsWith("image/")) {
        mediaType = "image";
        imageUrl = `/uploads/posts/${file.filename}`;
      } else if (file.mimetype.startsWith("video/")) {
        mediaType = "video";
        videoUrl = `/uploads/posts/${file.filename}`;
      } else {
        return res.status(400).json({ error: "Неподдерживаемый тип файла" });
      }
    } else if (videoLink) {
      // Предоставлена ссылка на видео
      mediaType = "video";
      videoUrl = videoLink;
    } else {
      return res.status(400).json({
        error: "Пожалуйста, загрузите изображение или укажите ссылку на видео"
      });
    }

    console.log('Creating post with data:', {
      content,
      imageUrl,
      videoUrl,
      mediaType,
      author: req.user.id
    });

    const post = await Post.create({
      content,
      imageUrl,
      videoUrl,
      mediaType,
      author: req.user.id,
    });

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "username avatar"
    );

    console.log('Created post:', populatedPost);
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    // Удаляем загруженный файл, если произошла ошибка при сохранении поста в БД
    if (req.file && req.file.path) {
      const fs = await import("fs"); // Динамический импорт
      fs.unlink(req.file.path, (err) => {
        if (err)
          console.error(
            "Error deleting uploaded file after post creation error:",
            err
          );
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Получить все посты
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const excludeUserId = req.query.excludeUserId;

    console.log("Getting all posts with params:", {
      page,
      limit,
      excludeUserId,
    });

    const filter = {};

    if (excludeUserId) {
      filter.author = { $ne: excludeUserId };
    }

    console.log("Filter:", filter);

    const totalPosts = await Post.countDocuments(filter);
    console.log("Total posts found:", totalPosts);

    const posts = await Post.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "username avatar")
      .populate("likes", "username avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatar",
        },
      })
      .sort({ createdAt: -1 });

    console.log("Posts fetched:", posts.length);

    res.json({
      posts,
      totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
    });
  } catch (err) {
    console.error("Error in getAllPosts:", err);
    res.status(500).json({ error: "Ошибка сервера при получении постов" });
  }
};

// Получить мои посты
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await Post.find({ author: userId })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    if (!posts) {
      return res.status(404).json({ error: "Посты не найдены" });
    }

    res.status(200).json(posts);
  } catch (error) {
    console.error("Ошибка при получении собственных постов:", error);
    res.status(500).json({ error: error.message });
  }
};

// Получить посты пользователя по ID
export const getPostsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Получение постов для пользователя с ID:", userId);

    const posts = await Post.find({ author: userId })
      .populate("author", "username avatar")
      .populate("likes", "username avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatar",
        },
      })
      .sort({ createdAt: "desc" });

    console.log("Найдено постов:", posts.length);

    if (!posts || posts.length === 0) {
      console.log("Посты не найдены");
      return res.status(200).json([]); // Возвращаем пустой массив вместо ошибки
    }

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getPostsByUserId:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      details: "Произошла ошибка при получении постов пользователя",
    });
  }
};

// Получить посты от пользователей, на которых текущий пользователь подписан
export const getFollowedUsersPosts = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Пользователь не аутентифицирован" });
    }
    const userId = req.user.id; // Получаем ID текущего аутентифицированного пользователя
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Находим текущего пользователя, чтобы получить список его подписок
    const currentUser = await User.findById(userId).select('following');

    if (!currentUser) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    // Получаем ID пользователей, на которых подписан текущий пользователь
    let followedUserIds = currentUser.following.map(id => id.toString());

    // Исключаем ID текущего пользователя из списка отслеживаемых, чтобы его посты не отображались на главной
    followedUserIds = followedUserIds.filter(id => id !== userId.toString());

    // Если пользователь не подписан ни на кого (или подписан только на себя), возвращаем пустой список постов
    if (followedUserIds.length === 0) {
      return res.json({
        posts: [],
        totalPosts: 0,
        currentPage: page,
        totalPages: 0,
      });
    }

    // Фильтруем посты по авторам, на которых подписан текущий пользователь (без своих постов)
    const filter = { author: { $in: followedUserIds } };

    const totalPosts = await Post.countDocuments(filter);

    const posts = await Post.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "username avatar")
      .populate("likes", "username avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatar",
        },
      })
      .sort({ createdAt: -1 });

    // Фильтруем посты, чтобы исключить невалидные элементы
    const validPosts = posts.filter(post => post && typeof post === 'object' && typeof post._id === 'object');

    res.json({
      posts: validPosts,
      totalPosts: validPosts.length,
      currentPage: page,
      totalPages: Math.ceil(validPosts.length / limit),
    });
  } catch (err) {
    console.error("Ошибка в getFollowedUsersPosts:", err);
    res.status(500).json({ error: "Ошибка сервера при получении постов от отслеживаемых пользователей" });
  }
};

// Получить посты пользователя по username
export const getPostsByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    console.log("Получение постов для пользователя:", username);

    // Сначала находим пользователя по username
    const user = await User.findOne({ username });
    console.log("Найденный пользователь:", user);

    if (!user) {
      console.log("Пользователь не найден");
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    // Затем получаем все посты этого пользователя
    console.log("Поиск постов для пользователя с ID:", user._id);
    const posts = await Post.find({ author: user._id })
      .populate("author", "username avatar")
      .populate("likes", "username avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatar",
        },
      })
      .sort({ createdAt: "desc" });

    console.log("Найдено постов:", posts.length);
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getPostsByUsername:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      details: "Произошла ошибка при получении постов пользователя",
    });
  }
};

// Удаление поста
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.user.id)
      return res.status(401).json({ error: "Unauthorized" });

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Редактирование поста
export const updatePost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true }
    );

    if (!post) return res.status(404).json({ error: "Post not found" });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Лайк поста
export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Пост не найден" });
    }

    // Проверяем, не лайкнул ли уже пользователь этот пост
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Если пост уже лайкнут - удаляем лайк
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Если пост не лайкнут - добавляем лайк
      post.likes.push(userId);
    }

    // --- НАЧАЛО ИСПРАВЛЕНИЯ: Проверка и установка mediaType ---
    if (!post.mediaType) {
      if (post.imageUrl) {
        post.mediaType = "image";
      } else if (post.videoUrl) {
        post.mediaType = "video";
      } else {
        post.mediaType = "image"; // Значение по умолчанию
      }
      console.warn(
        `[postController.js] У поста ${post._id} отсутствовал mediaType при операции лайка. Установлено значение: ${post.mediaType}.`
      );
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

    await post.save();

    // Получаем обновленный пост со всеми связанными данными
    const populatedPost = await Post.findById(post._id)
      .populate("author", "username avatar")
      .populate("likes", "username avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatar",
        },
      });

    res.json(populatedPost);
  } catch (error) {
    console.error("Error in likePost:", error);
    res.status(500).json({ error: error.message });
  }
};

// Получить один пост по id
export const getPostById = async (req, res) => {
  const { id } = req.params;

  // Если невалидный ObjectId — сразу ошибка
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Невалидный ID поста" });
  }

  try {
    const post = await Post.findById(id)
      .populate('author', 'username avatar')
      .populate('likes', 'username avatar')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username avatar' }
      });

    if (!post) return res.status(404).json({ message: 'Пост не найден' });

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
