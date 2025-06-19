import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, THEMES } from '../../Redux/themeSlice';
import styles from './TopControls.module.css';

const themeNames = {
  'light': 'Светлая',
  'dark': 'Тёмная',
  'turquoise': 'Бирюзовая',
  'blue-sky': 'Голубое небо',
  'green-forest': 'Зелёный лес',
  'purple-night': 'Фиолетовая ночь',
  'red-sunset': 'Красный закат',
};

const TopControlsComponent = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector(state => state.theme.currentTheme);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const handleThemeClick = () => {
    setShowThemeDropdown(prev => !prev);
  };

  const handleSetTheme = (theme) => {
    dispatch(setTheme(theme));
    setShowThemeDropdown(false);
  };

  return (
    <div className={styles.topControls}>
      <div className={styles.controlGroup}>
        <button 
          className={styles.controlButton}
          onClick={handleThemeClick}
          title="Сменить тему"
        >
          {themeNames[currentTheme]}
        </button>
        {showThemeDropdown && (
          <div className={styles.dropdown}>
            {Object.entries(THEMES).map(([key, value]) => (
              <button 
                key={key} 
                onClick={() => handleSetTheme(value)} 
                className={`${styles.dropdownItem} ${value === currentTheme ? styles.active : ''}`}
              >
                {themeNames[value]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopControlsComponent; 