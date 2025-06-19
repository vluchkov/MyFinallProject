import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../Redux/authSlice'; // Это мы добавим позже
import { useTranslations } from '../../hooks/useTranslations';
import styles from './ChangePassword.module.css';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslations();

  const { loading, error } = useSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmNewPassword) {
      setMessage(t('passwords_dont_match'));
      return;
    }

    if (newPassword.length < 6) {
      setMessage(t('password_too_short'));
      return;
    }

    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      setMessage(t('password_changed'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      // Добавляем небольшую задержку перед навигацией, чтобы пользователь увидел сообщение об успехе
      setTimeout(() => {
        navigate(-1); // Возвращаемся на шаг назад (в профиль)
      }, 2000);
    } catch (err) {
      setMessage(err.message || t('cannot_change_password', 'Не удалось изменить пароль'));
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t('change_password')}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="currentPassword" className={styles.label}>{t('current_password', 'Текущий пароль')}</label>
          <div style={{position: 'relative'}}>
            <input
              type={showCurrent ? "text" : "password"}
              id="currentPassword"
              className={styles.input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className={styles.showPasswordButton}
              style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)'}}
              onClick={() => setShowCurrent(v => !v)}
              tabIndex={-1}
              aria-label={showCurrent ? t('hide_password', 'Скрыть пароль') : t('show_password', 'Показать пароль')}
            >
              {showCurrent ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="newPassword" className={styles.label}>{t('new_password', 'Новый пароль')}</label>
          <div style={{position: 'relative'}}>
            <input
              type={showNew ? "text" : "password"}
              id="newPassword"
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className={styles.showPasswordButton}
              style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)'}}
              onClick={() => setShowNew(v => !v)}
              tabIndex={-1}
              aria-label={showNew ? t('hide_password', 'Скрыть пароль') : t('show_password', 'Показать пароль')}
            >
              {showNew ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirmNewPassword" className={styles.label}>{t('confirm_new_password', 'Повторите новый пароль')}</label>
          <div style={{position: 'relative'}}>
            <input
              type={showConfirm ? "text" : "password"}
              id="confirmNewPassword"
              className={styles.input}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className={styles.showPasswordButton}
              style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)'}}
              onClick={() => setShowConfirm(v => !v)}
              tabIndex={-1}
              aria-label={showConfirm ? t('hide_password', 'Скрыть пароль') : t('show_password', 'Показать пароль')}
            >
              {showConfirm ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? t('changing_password', 'Изменение пароля') : t('change_password')}
        </button>
        {message && <p className={styles.message}>{message}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </form>
    </div>
  );
};

export default ChangePassword; 