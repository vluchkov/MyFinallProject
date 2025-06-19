import { useSelector, useDispatch } from 'react-redux';
import { setLanguage } from '../Redux/languageSlice';
import { translations } from '../translations';

export const useTranslations = () => {
  const dispatch = useDispatch();
  const { currentLanguage, availableLanguages, languageNames } = useSelector(state => state.language);

  // Функция перевода
  const t = (key, fallback = key) => {
    const langTranslations = translations[currentLanguage] || translations.ru;
    return langTranslations[key] || fallback;
  };

  // Функция смены языка
  const changeLanguage = (language) => {
    if (availableLanguages.includes(language)) {
      dispatch(setLanguage(language));
    }
  };

  return {
    t,
    changeLanguage,
    currentLanguage,
    availableLanguages,
    languageNames
  };
}; 