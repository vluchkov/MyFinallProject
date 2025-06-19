import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslations } from '../../hooks/useTranslations';
import { searchUsers } from '../../Redux/searchSlice';
import styles from './Search.module.css';
import UserLink from '../UserLink/UserLink';

const Search = () => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslations();
  const searchResults = useSelector(state => state.search.results);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError(t('search_field_empty', 'Поле поиска не может быть пустым'));
      return;
    }

    setLoading(true);
    try {
      await dispatch(searchUsers(query)).unwrap();
      setError('');
    } catch (err) {
      setError(t('search_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.searchContainer}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_users')}
            className={styles.searchInput}
          />
          <button type="submit" disabled={loading} className={styles.searchButton}>
            {loading ? t('searching') : t('search')}
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </form>
      <div className={styles.resultsContainer}>
        {searchResults.length > 0 ? (
          searchResults.map(user => (
            <div key={user.id} className={styles.userCard}>
              <UserLink username={user.username}>
                <img src={user.avatar || '/default-avatar.png'} alt={user.username} className={styles.userAvatar} />
                <div className={styles.userInfo}>
                  <h3>{user.username}</h3>
                  <p>{user.bio || t('no_bio', 'Биография отсутствует')}</p>
                </div>
              </UserLink>
            </div>
          ))
        ) : (
          <p className={styles.noResults}>{t('no_users_found')}</p>
        )}
      </div>
    </div>
  );
};

export default Search; 