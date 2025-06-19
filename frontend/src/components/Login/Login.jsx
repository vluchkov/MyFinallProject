import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../Redux/authSlice';
import styles from './Login.module.css';
import { LOGO_URL } from '../../config/constants';
import BackgroundImg from '../../assets/Background.png';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: authError, isAuthenticated, loading: authLoading } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (authError) {
      dispatch(clearError());
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Требуется электронная почта";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Некорректный email";
    }
    if (!formData.password) {
      newErrors.password = "Требуется пароль";
    }
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setFieldErrors({});
    try {
      await dispatch(loginUser(formData)).unwrap();
    } catch (error) {
      setFieldErrors(prev => ({
        ...prev,
        submit: error.message || "Ошибка входа. Проверьте данные и попробуйте снова"
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authPageWrapper}>
      <div className={styles.imageWrapper}>
        <img src={BackgroundImg} alt="Фон" className={styles.backgroundImg} />
      </div>
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.logo}>
            <img src={LOGO_URL} alt="Инстаграм" />
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                name="email"
                placeholder="Электронная почта"
                value={formData.email}
                onChange={handleChange}
                className={`${styles.input} ${fieldErrors.email ? styles.error : ''}`}
                disabled={isLoading}
              />
              {fieldErrors.email && <div className={styles.error}>{fieldErrors.email}</div>}
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Пароль"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${styles.input} ${fieldErrors.password ? styles.error : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={styles.showPasswordButton}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {fieldErrors.password && <div className={styles.error}>{fieldErrors.password}</div>}
            </div>
            {fieldErrors.submit && <div className={styles.error}>{fieldErrors.submit}</div>}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "Вход..." : "Войти"}
            </button>
          </form>
          <Link to="/forgot-password" className={styles.forgotPassword}>
            Забыли пароль?
          </Link>
        </div>
        <div className={styles.authBox}>
          <p className={styles.registerPrompt}>
            Нет аккаунта? <Link to="/register" className={styles.registerLink}>Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 