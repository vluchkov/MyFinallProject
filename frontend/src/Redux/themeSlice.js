import { createSlice } from "@reduxjs/toolkit";

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  VIOLET: "violet",
  MINT: "mint",
  PEACH: "peach",
};

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const validThemes = Object.values(THEMES);
  if (savedTheme && validThemes.includes(savedTheme)) {
    return savedTheme;
  }
  // По умолчанию устанавливаем светлую тему, если нет сохраненной или она недействительна
  return THEMES.LIGHT;
};

const initialState = {
  currentTheme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      const newTheme = action.payload;
      const validThemes = Object.values(THEMES);
      if (validThemes.includes(newTheme)) {
        state.currentTheme = newTheme;
        localStorage.setItem("theme", newTheme);
        document.body.className = `theme-${newTheme}`; // Обновляем класс на body
      } else {
        console.warn(`Неверная тема: ${newTheme}. Тема не изменена.`);
      }
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
