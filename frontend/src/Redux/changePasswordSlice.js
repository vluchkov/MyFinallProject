import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config/constants";

export const changeUserPassword = createAsyncThunk(
  "user/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Отсутствует токен авторизации");
      }

      const response = await axios.put(
        `${API_URL}/api/users/change-password`, // Предполагаемый эндпоинт
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; // Ожидаем сообщение об успехе от бэкенда
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Ошибка при смене пароля"
      );
    }
  }
);

const initialState = {
  loading: false,
  successMessage: null,
  error: null,
};

const changePasswordSlice = createSlice({
  name: "changePassword",
  initialState,
  reducers: {
    clearChangePasswordState: (state) => {
      state.loading = false;
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(changeUserPassword.pending, (state) => {
        state.loading = true;
        state.successMessage = null;
        state.error = null;
      })
      .addCase(changeUserPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage =
          action.payload?.message || "Пароль успешно изменен.";
        state.error = null;
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.successMessage = null;
        state.error = action.payload;
      });
  },
});

export const { clearChangePasswordState } = changePasswordSlice.actions;
export default changePasswordSlice.reducer;
