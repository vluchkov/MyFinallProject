import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslations } from '../../hooks/useTranslations';
import { startConversation, setSelectedChatId } from '../../Redux/messagesSlice';
import { DEFAULT_AVATAR } from '../../config/constants';
import styles from './Messages.module.css';

const NewChatModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const { t } = useTranslations();
  const currentUser = useSelector(state => state.auth.user);
  const chats = useSelector(state => state.messages.chats);
  const myId = currentUser?._id || currentUser?.id;

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setError('');
    }
  }, [isOpen]);

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (query) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (query.trim()) {
            performSearch(query);
          } else {
            setSearchResults([]);
          }
        }, 300);
      };
    })(),
    []
  );

  const performSearch = async (query) => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка поиска');
      }

      const data = await response.json();
      // Фильтруем пользователей, исключая текущего пользователя и тех, с кем уже есть чат
      const filteredUsers = data.items.filter(user => {
        const userId = user._id || user.id;
        const isNotCurrentUser = userId !== myId;
        const hasNoExistingChat = !chats.some(chat => 
          chat.participants?.some(p => (p._id || p.id) === userId)
        );
        return isNotCurrentUser && hasNoExistingChat;
      });
      
      setSearchResults(filteredUsers);
    } catch (err) {
      setError(t('search_error'));
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleUserSelect = async (user) => {
    try {
      setLoading(true);
      const userId = user._id || user.id;
      await dispatch(startConversation(userId)).unwrap();
      onClose();
    } catch (err) {
      setError(t('cannot_start_conversation'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.newChatModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t('new_message')}</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('search_users')}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.searchResults}>
          {loading && (
            <div className={styles.loading}>
              {t('searching')}...
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div className={styles.usersList}>
              {searchResults.map((user) => (
                <div
                  key={user._id || user.id}
                  className={styles.userItem}
                  onClick={() => handleUserSelect(user)}
                >
                  <img
                    src={user.avatar || DEFAULT_AVATAR}
                    alt={user.username}
                    className={styles.userAvatar}
                  />
                  <div className={styles.userInfo}>
                    <div className={styles.username}>{user.username}</div>
                    {user.fullName && (
                      <div className={styles.fullName}>{user.fullName}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && searchTerm && searchResults.length === 0 && (
            <div className={styles.noResults}>
              {t('no_users_found')}
            </div>
          )}

          {!loading && !searchTerm && (
            <div className={styles.searchHint}>
              {t('start_typing_to_search')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal; 