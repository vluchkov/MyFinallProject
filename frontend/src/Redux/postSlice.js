import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config/constants";

// Получить все посты
export const fetchAllPosts = createAsyncThunk(
  "posts/fetchAllPosts",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/posts`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch posts");
    }
  }
);

// Получить посты пользователей, на которых подписан текущий пользователь
export const fetchFollowedPosts = createAsyncThunk(
  "posts/fetchFollowedPosts",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Токен не найден");
      }
      const response = await axios.get(`${API_URL}/api/posts/followed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.posts; // Бэкенд возвращает объект с полем posts
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при получении постов от отслеживаемых пользователей"
      );
    }
  }
);

// Лайк поста
export const likePost = createAsyncThunk(
  "posts/likePost",
  async (postId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/posts/${postId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to like post");
    }
  }
);

// Редактирование поста
export const editPost = createAsyncThunk(
  "posts/editPost",
  async ({ postId, postData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_URL}/api/posts/${postId}`,
        postData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при редактировании поста"
      );
    }
  }
);

// Удаление поста
export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { postId: postId, message: response.data.message }; // Возвращаем ID удаленного поста
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при удалении поста"
      );
    }
  }
);

// Добавление комментария
export const addComment = createAsyncThunk(
  "posts/addComment",
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/comments`,
        { postId, content }, // Тело запроса
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // response.data должен содержать созданный комментарий с populated автором
      return { postId, comment: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при добавлении комментария"
      );
    }
  }
);

// Получить избранные посты пользователя
export const fetchFavoritePosts = createAsyncThunk(
  "posts/fetchFavoritePosts",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data; // Бэкенд возвращает массив постов
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при получении избранных постов"
      );
    }
  }
);

// Добавить пост в избранное
export const addPostToFavorites = createAsyncThunk(
  "posts/addPostToFavorites",
  async (postId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/favorites`,
        { postId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Бэкенд возвращает { message: '...', favorite: newFavoriteEntry }
      // newFavoriteEntry содержит { _id, user, post (ID), createdAt }
      // Нам нужен postId для обновления состояния поста в state.posts
      return { postId, favoriteEntry: response.data.favorite };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при добавлении в избранное"
      );
    }
  }
);

// Удалить пост из избранного
export const removePostFromFavorites = createAsyncThunk(
  "posts/removePostFromFavorites",
  async (postId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/favorites/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return postId; // Возвращаем postId для удаления из state.favoritePosts и обновления state.posts
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при удалении из избранного"
      );
    }
  }
);

// Убрать лайк с поста
export const unlikePost = createAsyncThunk(
  "posts/unlikePost",
  async (postId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${API_URL}/api/posts/${postId}/like`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при удалении лайка"
      );
    }
  }
);

// Создание нового поста
export const createPost = createAsyncThunk(
  "posts/createPost",
  async (postData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      // Если есть файл — отправляем FormData
      if (postData.media) {
        const formData = new FormData();
        formData.append('media', postData.media);
        if (postData.caption) {
          formData.append('content', postData.caption);
        }
        const response = await axios.post(
          `${API_URL}/api/posts`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );
        return response.data;
      } else if (postData.videoLink) {
        // YouTube — отправляем JSON
        const response = await axios.post(
          `${API_URL}/api/posts`,
          {
            content: postData.caption,
            videoLink: postData.videoLink
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );
        return response.data;
      }
      throw new Error('Нет данных для публикации');
    } catch (error) {
      console.error('Error in createPost:', error.response?.data || error);
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при создании поста"
      );
    }
  }
);

// Получить один пост по id
export const fetchPostById = createAsyncThunk(
  "posts/fetchPostById",
  async (postId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при получении поста"
      );
    }
  }
);

const postSlice = createSlice({
  name: "posts",
  initialState: {
    posts: [],
    loading: false,
    error: null,
    likeLoading: false,
    likeError: null,
    // Для Избранного
    favoritePosts: [],
    favoriteLoading: false,
    favoriteError: null,
  },
  reducers: {
    clearPostError: (state) => {
      state.error = null;
    },
    updatePost: (state, action) => {
      const updatedPost = action.payload;
      const postIndex = state.posts.findIndex(
        (post) => post._id === updatedPost._id
      );
      if (postIndex !== -1) {
        state.posts[postIndex] = { ...state.posts[postIndex], ...updatedPost };
      }
      const favIndex = state.favoritePosts.findIndex(
        (post) => post._id === updatedPost._id
      );
      if (favIndex !== -1) {
        state.favoritePosts[favIndex] = {
          ...state.favoritePosts[favIndex],
          ...updatedPost,
        };
      }
    },
    // Редьюсер для обновления isFavorite в посте в общем списке и в избранном
    setPostFavoriteStatus: (state, action) => {
      const { postId, isFavorite } = action.payload;
      const postInPosts = state.posts.find((p) => p._id === postId);
      if (postInPosts) {
        postInPosts.isFavorite = isFavorite;
      }
      const postInFavorites = state.favoritePosts.find((p) => p._id === postId);
      if (postInFavorites) {
        postInFavorites.isFavorite = isFavorite; // Хотя в favoritePosts все должны быть isFavorite=true
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Обработка получения всех постов
      .addCase(fetchAllPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        state.loading = false;
        // Фильтруем только валидные объекты постов
        if (action.payload && Array.isArray(action.payload.posts)) {
          state.posts = action.payload.posts.filter(
            post => post && typeof post === 'object' && typeof post._id === 'string' && /^[a-f\d]{24}$/i.test(post._id)
          ).map((post) => {
            const isFavorite = state.favoritePosts.some((fav) => fav.post === post._id);
            return { ...post, isFavorite };
          });
        } else {
          state.posts = [];
          console.error("Expected action.payload.posts to be an array, but received:", action.payload);
        }
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Обработка получения постов отслеживаемых пользователей
      .addCase(fetchFollowedPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFollowedPosts.fulfilled, (state, action) => {
        state.loading = false;
        // Фильтруем только валидные объекты постов
        state.posts = (action.payload || []).filter(
          post => post && typeof post === 'object' && typeof post._id === 'string' && /^[a-f\d]{24}$/i.test(post._id)
        );
      })
      .addCase(fetchFollowedPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Обработка лайка поста
      .addCase(likePost.pending, (state) => {
        state.likeLoading = true;
        state.likeError = null;
      })
      .addCase(likePost.fulfilled, (state, action) => {
        state.likeLoading = false;
        const updatedPost = action.payload;
        const postPredicate = (post) => post._id === updatedPost._id;

        // Обновляем пост в основном списке постов
        const index = state.posts.findIndex(postPredicate);
        if (index !== -1) {
          state.posts[index] = { ...state.posts[index], ...updatedPost };
        }

        // Обновляем пост в списке избранных, если он там есть
        const favIndex = state.favoritePosts.findIndex(postPredicate);
        if (favIndex !== -1) {
          state.favoritePosts[favIndex] = { ...state.favoritePosts[favIndex], ...updatedPost };
        }
      })
      .addCase(likePost.rejected, (state, action) => {
        state.likeLoading = false;
        state.likeError = action.payload;
      })

      // Обработка редактирования поста
      .addCase(editPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editPost.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPost = action.payload;
        // Обновляем пост в основном списке
        const postPredicate = (post) => post._id === updatedPost._id;
        const index = state.posts.findIndex(postPredicate);
        if (index !== -1) {
          state.posts[index] = { ...state.posts[index], ...updatedPost };
        }
        // Обновляем пост в избранных
        const favIndex = state.favoritePosts.findIndex(postPredicate);
        if (favIndex !== -1) {
          state.favoritePosts[favIndex] = { ...state.favoritePosts[favIndex], ...updatedPost };
        }
      })
      .addCase(editPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Обработка удаления поста
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        const { postId } = action.payload;
        state.posts = state.posts.filter((post) => post._id !== postId);
        state.favoritePosts = state.favoritePosts.filter((post) => post._id !== postId); // Удаляем из избранных
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Обработка добавления комментария
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        const post = state.posts.find((p) => p._id === postId);
        if (post) {
          // Убедимся, что comments массив и добавляем комментарий
          if (!post.comments) {
            post.comments = [];
          }
          post.comments.push(comment);
        }
      })

      // Обработка получения избранных постов
      .addCase(fetchFavoritePosts.pending, (state) => {
        state.favoriteLoading = true;
        state.favoriteError = null;
      })
      .addCase(fetchFavoritePosts.fulfilled, (state, action) => {
        state.favoriteLoading = false;
        // Фильтруем только валидные объекты постов
        state.favoritePosts = (action.payload || []).filter(
          post => post && typeof post === 'object' && typeof post._id === 'string' && /^[a-f\d]{24}$/i.test(post._id)
        ).map(post => ({ ...post, isFavorite: true }));
      })
      .addCase(fetchFavoritePosts.rejected, (state, action) => {
        state.favoriteLoading = false;
        state.favoriteError = action.payload;
      })

      // Обработка добавления поста в избранное
      .addCase(addPostToFavorites.fulfilled, (state, action) => {
        const { postId, favoriteEntry } = action.payload;
        // Обновляем статус isFavorite в основном списке постов
        const postInPosts = state.posts.find((p) => p._id === postId);
        if (postInPosts) {
          postInPosts.isFavorite = true;
        }

        // Добавляем пост в список избранных, если его там нет
        // Предполагаем, что favoriteEntry содержит полный объект поста (или id) для добавления
        // Если favoriteEntry только id, то нужно будет получить полный пост из state.posts
        const existingFavorite = state.favoritePosts.find((p) => p._id === postId);
        if (!existingFavorite) {
          const postToAdd = state.posts.find((p) => p._id === postId);
          if (postToAdd) {
            state.favoritePosts.push({ ...postToAdd, isFavorite: true });
          }
        }
      })

      // Обработка удаления поста из избранного
      .addCase(removePostFromFavorites.fulfilled, (state, action) => {
        const postId = action.payload;
        // Обновляем статус isFavorite в основном списке постов
        const postInPosts = state.posts.find((p) => p._id === postId);
        if (postInPosts) {
          postInPosts.isFavorite = false;
        }
        // Удаляем пост из списка избранных
        state.favoritePosts = state.favoritePosts.filter((p) => p._id !== postId);
      })

      // Обработка удаления лайка
      .addCase(unlikePost.pending, (state) => {
        state.likeLoading = true;
        state.likeError = null;
      })
      .addCase(unlikePost.fulfilled, (state, action) => {
        state.likeLoading = false;
        const post = state.posts.find(p => p._id === action.payload._id);
        if (post) {
          post.likes = action.payload.likes;
        }
      })
      .addCase(unlikePost.rejected, (state, action) => {
        state.likeLoading = false;
        state.likeError = action.payload;
      })

      // Обработка создания нового поста
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPostError, updatePost, setPostFavoriteStatus } = postSlice.actions;

export default postSlice.reducer;
