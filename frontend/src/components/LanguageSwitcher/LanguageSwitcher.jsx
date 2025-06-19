import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import styles from './LanguageSwitcher.module.css';

const LanguageSwitcher = () => {
  const { currentLanguage, availableLanguages, languageNames, changeLanguage } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = (language) => {
    changeLanguage(language);
    setIsOpen(false);
  };

  const getLanguageIcon = (lang) => {
    switch (lang) {
      case 'en':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="12" fill="#1976d2"/>
            <rect y="8" width="24" height="8" fill="#fff"/>
            <rect y="10" width="24" height="4" fill="#d32f2f"/>
          </svg>
        );
      case 'ru':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="12" fill="#fff"/>
            <rect y="8" width="24" height="8" fill="#0033a0"/>
            <rect y="16" width="24" height="8" fill="#d52b1e"/>
          </svg>
        );
      case 'uk':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="12" fill="#0057b7"/>
            <rect y="12" width="24" height="12" fill="#ffd700"/>
          </svg>
        );
      case 'de':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="12" fill="#000"/>
            <rect y="8" width="24" height="8" fill="#dd0000"/>
            <rect y="16" width="24" height="8" fill="#ffce00"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.languageSwitcher} ref={dropdownRef}>
      <button
        className={styles.languageButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Сменить язык"
      >
        {getLanguageIcon(currentLanguage)}
        <span className={styles.languageCode}>{currentLanguage.toUpperCase()}</span>
        <svg 
          className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              className={`${styles.languageOption} ${currentLanguage === lang ? styles.active : ''}`}
              onClick={() => handleLanguageSelect(lang)}
            >
              {getLanguageIcon(lang)}
              <span className={styles.languageName}>{languageNames[lang]}</span>
              {currentLanguage === lang && (
                <svg className={styles.checkmark} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 