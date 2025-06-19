import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetPassword } from '../../Redux/authSlice';
import { useTranslations } from '../../hooks/useTranslations';
import styles from '../Auth/AuthForm.module.css';
import { LOGO_URL } from '../../config/constants';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslations();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (validationError) {
      setValidationError('');
    }
  };

  const validateForm = () => {
    if (!formData.password) {
      setValidationError(t('enter_new_password', 'Введите новый пароль'));
      return false;
    }
    if (formData.password.length < 6) {
      setValidationError(t('password_too_short'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError(t('passwords_dont_match'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setValidationError('');
    
    try {
      await dispatch(resetPassword({ token, password: formData.password })).unwrap();
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      setValidationError(err.message || t('cannot_reset_password', 'Не удалось сбросить пароль'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.formContainer}>
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <h2>{t('password_changed')}</h2>
            <p>{t('redirecting_to_login', 'Вы будете перенаправлены на страницу входа')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.formContainer}>
        <div className={styles.logo}>
          <img 
            src={LOGO_URL}
            alt="Instagram"
            className={styles.logoImage}
          />
        </div>

        <h2 className={styles.formTitle}>{t('reset_password')}</h2>
        <p className={styles.formDescription}>
          {t('create_new_password', 'Создайте новый надежный пароль для вашего аккаунта')}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {validationError && (
            <div className={styles.errorMessage}>
              {validationError}
            </div>
          )}

          <div className={styles.inputGroup}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('new_password')}
              className={styles.input}
              disabled={isLoading}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t('confirm_new_password')}
              className={styles.input}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className={styles.showPasswordButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? t('hide', 'Скрыть') : t('show', 'Показать')}
            </button>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? t('saving', 'Сохранение...') : t('reset_password')}
          </button>
        </form>

        <div className={styles.alternativeAction}>
          <Link to="/login" className={styles.link}>
            {t('back_to_login', 'Вернуться к входу')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 