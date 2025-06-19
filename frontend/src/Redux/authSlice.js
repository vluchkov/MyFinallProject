import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import { API_URL } from "../config/constants";

const token = localStorage.getItem("token");

// Асинхронный action для логина
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        credentials
      );
      const { token, user } = response.data;

      // Сохраняем токен в localStorage
      localStorage.setItem("token", token);

      return { user, token };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при входе"
      );
    }
  }
);

// Асинхронный action для проверки токена и получения данных пользователя
export const checkAuth = createAsyncThunk(
  "auth/check",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      console.log('Checking auth with token:', token);
      
      if (!token) {
        console.log('No token found');
        throw new Error("Нет токена");
      }

      console.log('Making request to /api/users/me');
      const response = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Response from /api/users/me:', response.data);

      return { user: response.data, token };
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem("token");
      return rejectWithValue(
        error.response?.data?.message || "Ошибка аутентификации"
      );
    }
  }
);

// Асинхронный action для регистрации
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        userData
      );
      const { token, user } = response.data;

      localStorage.setItem("token", token);

      return { user, token };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при регистрации"
      );
    }
  }
);

// Асинхронный action для восстановления пароля
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при запросе сброса пароля');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Асинхронный action для смены пароля
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Необходима авторизация. Токен отсутствует.");
      }

      const response = await axios.put(
        `${API_URL}/api/users/change-password`,
        { currentPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при смене пароля"
      );
    }
  }
);

// Функция для получения данных пользователя
export const fetchUserData = createAsyncThunk(
  "auth/fetchUserData",
  async (token) => {
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Ошибка получения данных пользователя");
    }

    const data = await response.json();
    console.log("Полученные данные пользователя:", data);

    // Убедимся, что у нас правильный формат ID
    const userData = {
      ...data,
      _id: data._id || data.id, // Используем MongoDB _id
      id: data._id || data.id, // Поддерживаем обратную совместимость
    };

    console.log("Обработанные данные пользователя:", userData);
    return userData;
  }
);

// Функция для установки аутентификации из токена при загрузке приложения
export const setAuthFromToken = () => async (dispatch) => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      dispatch(setAuth({ token }));
      const userData = await dispatch(fetchUserData(token)).unwrap();
      dispatch(setUser(userData));
    } catch (error) {
      console.error("Error restoring auth:", error);
      localStorage.removeItem("token");
      dispatch(logout());
    }
  }
};

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при сбросе пароля');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  token: token,
  isAuthenticated: false,
  loading: !!token,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    setUser: (state, action) => {
      console.log("Сохранение пользователя в store:", action.payload);
      state.user = {
        ...action.payload,
        _id: action.payload._id || action.payload.id,
        id: action.payload._id || action.payload.id,
      };
      state.loading = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserData.pending, (state) => {
        if (!state.loading) state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setAuth, setUser, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
