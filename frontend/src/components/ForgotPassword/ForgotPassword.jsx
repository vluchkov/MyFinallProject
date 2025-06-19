import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import styles from '../Auth/AuthForm.module.css';
import { LOGO_URL, API_URL } from '../../config/constants';
import BackgroundImg from '../../assets/Background.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslations();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError(t('email_required'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('invalid_email'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || t('password_reset_error'));
      }
    } catch (err) {
      setError(t('request_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authPageWrapper}>
      <div className={styles.imageWrapper}>
        <img src={BackgroundImg} alt={t('background')} className={styles.backgroundImg} />
      </div>
      <div className={styles.authContainer}>
        <div className={styles.formContainer}>
          <div className={styles.logo}>
            <img 
              src={LOGO_URL}
              alt="Instagram"
              className={styles.logoImage}
            />
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.title}>{t('forgot_password')}</h2>
            <p className={styles.subtitle}>{t('forgot_password_subtitle')}</p>

            <div className={styles.inputGroup}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email')}
                className={`${styles.input} ${error ? styles.error : ''}`}
                disabled={isLoading}
              />
              {error && <div className={styles.errorMessage}>{error}</div>}
              {success && <div className={styles.successMessage}>{t('password_reset_success')}</div>}
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? t('sending', 'Отправка') : t('reset_password')}
            </button>
          </form>
        </div>

        <div className={styles.alternativeAction}>
          <p>
            {t('remember_password')} <Link to="/login">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 