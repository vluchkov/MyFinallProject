import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserSearch.module.css'; // Мы создадим этот файл для стилей
import UserLink from '../UserLink/UserLink';
import { useTranslations } from '../../hooks/useTranslations';

const UserSearch = ({ isOpen, onClose, onUserSelect }) => {
  const navigate = useNavigate();
  const { t } = useTranslations();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // Для сообщений типа "не найдено"

  // Сбрасываем состояние при закрытии панели
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
      setMessage('');
      setLoading(false);
    }
  }, [isOpen]);

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  const fetchUsers = async (searchQuery) => {
    if (!isOpen || !searchQuery.trim()) {
      setResults([]);
      setMessage('');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      // Предполагаем, что токен хранится в localStorage
      const token = localStorage.getItem('token'); 
      if (!token) {
        setError(t('auth_required', 'Требуется авторизация'));
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('search_error', 'Ошибка поиска'));
      }
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        setResults(data.items);
        setMessage('');
      } else {
        setResults([]);
        setMessage(t('users_not_found', 'Пользователи не найдены'));
      }
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 500), [isOpen]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetchUsers(value);
  };

  const handleUserClick = (user) => {
    if (onUserSelect) {
      onUserSelect(user);
      onClose();
    } else {
      navigate(`/profile/${user.username}`);
      onClose();
    }
  };

  if (!isOpen) { // Если панель не открыта, ничего не рендерим
    return null;
  }

  return (
    <div className={styles.searchPanelOverlay} onClick={onClose}> {/* Оверлей для закрытия по клику вне панели */} 
      <div className={styles.searchPanel} onClick={(e) => e.stopPropagation()}> {/* Предотвращаем закрытие при клике на саму панель */} 
        <div className={styles.panelHeader}>
          <h2>{t('search', 'Поиск')}</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <div className={styles.searchInputContainer}>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={t('enter_username', 'Введите имя пользователя...')}
            className={styles.searchInput}
            autoFocus // Автофокус на поле ввода при открытии
          />
        </div>
        {loading && <p className={styles.loadingMessage}>{t('loading')}</p>}
        {error && <p className={styles.errorMessage}>{t('error')}: {error}</p>}
        {message && !loading && !error && results.length === 0 && <p className={styles.infoMessage}>{message}</p>}
        {results.length > 0 && (
          <ul className={styles.resultsList}>
            {results.map((user) => (
              <li 
                key={user._id} 
                className={styles.resultItem}
                onClick={() => handleUserClick(user)}
              >
                <UserLink username={user.username}>
                  <img 
                    src={user.avatar || '/default-avatar.png'}
                    alt={t('user_avatar', 'Аватар пользователя')}
                    className={styles.avatar}
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.username}>{user.username}</span>
                    {user.fullName && <span className={styles.fullName}>{user.fullName}</span>}
                  </div>
                </UserLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserSearch; 