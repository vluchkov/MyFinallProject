import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../Redux/authSlice';
import { API_URL } from '../../config/constants';
import { useTranslations } from '../../hooks/useTranslations';
import styles from './Auth.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslations();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('login_error'));
      }

      // Сохраняем токен
      localStorage.setItem('token', data.token);
      
      // Обновляем состояние Redux
      dispatch(loginUser(data.user));
      
      // Переходим на главную страницу
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <div className={styles.logo}>
          <img src="/instagram-logo.png" alt="Instagram" />
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('email')}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password')}
              required
              className={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.showPasswordButton}
            >
              {showPassword ? t('close') : t('edit')}
            </button>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? t('loading') : t('login')}
          </button>
        </form>

        <Link to="/forgot-password" className={styles.forgotPassword}>
          {t('forgot_password')}
        </Link>
      </div>

      <div className={styles.authBox}>
        <p className={styles.registerPrompt}>
          {t('register_prompt', 'У вас ещё нет аккаунта?')}{' '}
          <Link to="/register" className={styles.registerLink}>
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 