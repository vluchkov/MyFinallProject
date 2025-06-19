import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchUsers } from '../../Redux/userSlice';
import styles from './UserSearch.module.css';
import { DEFAULT_AVATAR } from '../../config/constants';

const UserSearch = ({ onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const dispatch = useDispatch();
  const { searchResults, loading, error } = useSelector((state) => state.users);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        dispatch(searchUsers(searchTerm))
          .finally(() => setIsSearching(false));
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, dispatch]);

  const handleUserClick = (user) => {
    onUserSelect(user);
    setSearchTerm('');
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Поиск пользователей"
        className={styles.searchInput}
      />
      
      {isSearching && <div className={styles.loading}>Поиск...</div>}
      
      {error && <div className={styles.error}>{error}</div>}
      
      {searchResults.length > 0 && (
        <div className={styles.results}>
          {searchResults.map((user) => (
            <div
              key={user._id}
              className={styles.userItem}
              onClick={() => handleUserClick(user)}
            >
              <img
                src={user.avatar || DEFAULT_AVATAR}
                alt="Аватар пользователя"
                className={styles.avatar}
              />
              <div className={styles.userInfo}>
                <div className={styles.username}>{user.username}</div>
                <div className={styles.email}>{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchTerm && !isSearching && searchResults.length === 0 && (
        <div className={styles.noResults}>Пользователи не найдены</div>
      )}
    </div>
  );
};

export default UserSearch; 