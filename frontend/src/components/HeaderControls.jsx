import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, THEMES } from '../Redux/themeSlice';
import LanguageSwitcher from './LanguageSwitcher/LanguageSwitcher';

import styles from '../App.module.css';

const themeIcons = {
  'light': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="6" fill="#FFD600"/><g stroke="#FFD600" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></g></svg>
  ),
  'dark': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="#222"/><path d="M16 12a4 4 0 0 1-4 4 4 4 0 0 1 0-8 4 4 0 0 1 4 4z" fill="#fff"/></svg>
  ),
  'turquoise': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="#1de9b6"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>
  ),
  'blue-sky': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="#40c4ff"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>
  ),
  'green-forest': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="#43a047"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>
  ),
  'purple-night': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="#7b61ff"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>
  ),
  'red-sunset': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="#ff5252"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>
  ),
};

// const languageIcons = {
//   'en': (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="12" fill="#1976d2"/><rect y="8" width="24" height="8" fill="#fff"/><rect y="10" width="24" height="4" fill="#d32f2f"/></svg>
//   ),
//   'ru': (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="12" fill="#fff"/><rect y="8" width="24" height="8" fill="#0033a0"/><rect y="16" width="24" height="8" fill="#d52b1e"/></svg>
//   ),
//   'uk': (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="12" fill="#0057b7"/><rect y="12" width="24" height="12" fill="#ffd700"/></svg>
//   ),
//   'de': (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="12" fill="#000"/><rect y="8" width="24" height="8" fill="#dd0000"/><rect y="16" width="24" height="8" fill="#ffce00"/></svg>
//   ),
// };

const themeOrder = Object.values(THEMES);
// const languageOrder = Object.values(LANGUAGES);

const HeaderControls = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector(state => state.theme.currentTheme);
  // const currentLanguage = useSelector(state => state.language.currentLanguage);

  const handleThemeClick = () => {
    const idx = themeOrder.indexOf(currentTheme);
    const nextTheme = themeOrder[(idx + 1) % themeOrder.length];
    dispatch(setTheme(nextTheme));
  };

  // const handleLanguageClick = () => {
  //   const idx = languageOrder.indexOf(currentLanguage);
  //   const nextLang = languageOrder[(idx + 1) % languageOrder.length];
  //   dispatch(setLanguage(nextLang));
  // };

  return (
    <div className={styles.headerControls}>
      <button className={styles.iconCircleBtn} onClick={handleThemeClick} title="Сменить тему">
        {themeIcons[currentTheme]}
      </button>
      <LanguageSwitcher />
    </div>
  );
};

export default HeaderControls; 