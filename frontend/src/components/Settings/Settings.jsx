import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslations } from '../../hooks/useTranslations';
import { updateSettings } from '../../Redux/settingsSlice';
import styles from './Settings.module.css';

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('ru');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslations();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(updateSettings({
        notifications,
        darkMode,
        language
      })).unwrap();
      setError('');
    } catch (err) {
      setError(t('cannot_update_settings'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <h2>{t('settings')}</h2>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            {t('enable_notifications')}
          </label>
        </div>
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
            {t('enable_dark_mode')}
          </label>
        </div>
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>
            {t('language')}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={styles.languageSelect}
            >
              <option value="ru">{t('russian', 'Русский')}</option>
              <option value="en">{t('english', 'English')}</option>
              <option value="uk">{t('ukrainian', 'Українська')}</option>
              <option value="de">{t('german', 'Deutsch')}</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={loading} className={styles.saveButton}>
          {loading ? t('saving') : t('save_changes')}
        </button>
      </form>
    </div>
  );
};

export default Settings; 