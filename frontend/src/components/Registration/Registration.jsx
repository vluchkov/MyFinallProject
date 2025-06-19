import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { registerUser } from '../../Redux/authSlice';
import { useTranslations } from '../../hooks/useTranslations';
import styles from '../Auth/AuthForm.module.css';
import { LOGO_URL, API_URL } from '../../config/constants';
import BackgroundImg from '../../assets/Background.png';

const Registration = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslations();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t('email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('invalid_email');
    }

    if (!formData.username) {
      newErrors.username = t('username_required');
    } else if (formData.username.length < 3) {
      newErrors.username = t('username_too_short', 'Имя пользователя слишком короткое');
    }

    if (!formData.phone) {
      newErrors.phone = t('phone_required', 'Требуется номер телефона');
    }

    if (!formData.password) {
      newErrors.password = t('password_required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('password_too_short');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwords_dont_match', 'Пароли не совпадают');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDirectRegistration = async () => {
    try {
      setDebugInfo(t('sending_registration_request', 'Отправка запроса на регистрацию'));
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          phone: formData.phone
        })
      });

      const responseText = await response.text();
      setDebugInfo(prev => prev + '\n' + t('received_response', 'Получен ответ: ') + responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        setDebugInfo(prev => prev + '\n' + t('json_parse_error', 'Ошибка парсинга JSON: ') + e.message);
        throw new Error(t('server_response_error', 'Ошибка ответа сервера'));
      }

      if (response.ok && data.token) {
        setDebugInfo(prev => prev + '\n' + t('registration_successful', 'Регистрация успешна'));
        localStorage.setItem('token', data.token);
        navigate('/feed');
      } else {
        const errorMessage = data.message || t('unknown_registration_error', 'Неизвестная ошибка регистрации');
        setDebugInfo(prev => prev + '\n' + t('error', 'Ошибка: ') + errorMessage);
        
        if (errorMessage.includes('email')) {
          setErrors(prev => ({ ...prev, email: errorMessage }));
        } else if (errorMessage.includes('имен')) {
          setErrors(prev => ({ ...prev, username: errorMessage }));
        } else if (errorMessage.includes('телефон')) {
          setErrors(prev => ({ ...prev, phone: errorMessage }));
        } else {
          setErrors(prev => ({ ...prev, submit: errorMessage }));
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      setDebugInfo(prev => prev + '\n' + t('request_error', 'Ошибка запроса: ') + error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setDebugInfo(null);
    setErrors({});

    try {
      await handleDirectRegistration();
    } catch (error) {
      console.error('Registration error:', error);
      if (!errors.email && !errors.username && !errors.phone) {
        setErrors(prev => ({
          ...prev,
          submit: error.message || t('registration_error')
        }));
      }
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
            <div className={styles.inputGroup}>
              <input
                type="text"
                name="email"
                placeholder={t('email')}
                value={formData.email}
                onChange={handleChange}
                className={`${styles.input} ${errors.email ? styles.error : ''}`}
                disabled={isLoading}
              />
              {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                name="username"
                placeholder={t('username')}
                value={formData.username}
                onChange={handleChange}
                className={`${styles.input} ${errors.username ? styles.error : ''}`}
                disabled={isLoading}
              />
              {errors.username && <div className={styles.errorMessage}>{errors.username}</div>}
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                name="phone"
                placeholder={t('phone', 'Номер телефона')}
                value={formData.phone}
                onChange={handleChange}
                className={`${styles.input} ${errors.phone ? styles.error : ''}`}
                disabled={isLoading}
              />
              {errors.phone && <div className={styles.errorMessage}>{errors.phone}</div>}
            </div>

            <div className={styles.inputGroup}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t('password')}
                value={formData.password}
                onChange={handleChange}
                className={`${styles.input} ${errors.password ? styles.error : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password')}
                className={styles.showPasswordButton}
              >
                {showPassword ? t('close') : t('edit')}
              </button>
              {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
            </div>

            <div className={styles.inputGroup}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder={t('confirm_password', 'Подтвердите пароль')}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${styles.input} ${errors.confirmPassword ? styles.error : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                className={styles.showPasswordButton}
              >
                {showConfirmPassword ? t('close') : t('edit')}
              </button>
              {errors.confirmPassword && <div className={styles.errorMessage}>{errors.confirmPassword}</div>}
            </div>

            {errors.submit && (
              <div className={styles.errorMessage}>{errors.submit}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? t('loading') : t('register')}
            </button>
          </form>

          <p className={styles.loginPrompt}>
            {t('login_prompt', 'У вас уже есть аккаунт?')}{' '}
            <Link to="/login" className={styles.loginLink}>
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;