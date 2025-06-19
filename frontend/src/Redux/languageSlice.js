import { createSlice } from '@reduxjs/toolkit';

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage && ['en', 'ru', 'uk', 'de'].includes(savedLanguage)) {
    return savedLanguage;
  }
  // Определяем язык браузера
  const browserLang = navigator.language.split('-')[0];
  if (['en', 'ru', 'uk', 'de'].includes(browserLang)) {
    return browserLang;
  }
  return 'ru'; // По умолчанию русский
};

const languageSlice = createSlice({
  name: 'language',
  initialState: {
    currentLanguage: getInitialLanguage(),
    availableLanguages: ['en', 'ru', 'uk', 'de'],
    languageNames: {
      en: 'English',
      ru: 'Русский',
      uk: 'Українська',
      de: 'Deutsch'
    }
  },
  reducers: {
    setLanguage: (state, action) => {
      const newLanguage = action.payload;
      if (state.availableLanguages.includes(newLanguage)) {
        state.currentLanguage = newLanguage;
        localStorage.setItem('language', newLanguage);
      }
    }
  }
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer; 