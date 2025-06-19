import React, { useState, useEffect } from 'react';
import UserLink from '../../UserLink/UserLink';
import styles from './FollowListModal.module.css';
import { DEFAULT_AVATAR } from '../../../config/constants'; // Путь к константам
import { useTranslations } from '../../../hooks/useTranslations';


// Ожидаемый формат пользователя в массиве users:
// { _id: 'string', username: 'string', fullName: 'string' (optional), avatar: 'string' (optional), isFollowing: boolean (optional for follow/unfollow button) }

const UserItem = ({ user, currentUserId, onFollowToggle, onCloseModal }) => {
  const { t } = useTranslations();
  
  const handleUserClick = (e) => {
    if (onCloseModal) {
      onCloseModal();
    }
    // Переход произойдет после закрытия модалки
  };

  return (
    <div className={styles.userItem}>
      <UserLink
        username={user.username}
        className={styles.userInfoLink}
        onClick={handleUserClick}
      >
        <img
          src={user.avatar || DEFAULT_AVATAR}
          alt={user.username}
          className={styles.userAvatar}
        />
        <div className={styles.userDetails}>
          <span className={styles.username}>{user.username}</span>
          {user.fullName && <span className={styles.fullName}>{user.fullName}</span>}
        </div>
      </UserLink>
      {currentUserId && user._id !== currentUserId && (
        <button
          className={`${styles.followButton} ${user.isFollowing ? styles.unfollowButton : styles.followingButton}`}
          onClick={() => onFollowToggle(user._id, user.isFollowing)}
        >
          {user.isFollowing ? t('unfollow', 'Отписаться') : t('follow', 'Подписаться')}
        </button>
      )}
       {/* Можно добавить кнопку "Редактировать профиль" если user._id === currentUserId, но это не типично для этого модального окна */}
    </div>
  );
};

const FollowListModal = ({ 
  isOpen, 
  onClose, 
  title, 
  users = [], 
  currentUserId, 
  onFollowToggle, 
  isLoading, // ++ Новый проп
  error // ++ Новый проп
}) => {
  const { t } = useTranslations();
  
  console.log('FollowListModal users:', users);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) setSearchTerm('');
  }, [isOpen]);

  const filteredUsers = (users || []).filter(user => 
    searchTerm === '' ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  console.log('FollowListModal filteredUsers:', filteredUsers);

  if (!isOpen) {
    return null;
  }

  let listContent;
  if (isLoading) {
    listContent = <p className={styles.loadingText}>{t('loading')}</p>;
  } else if (error) {
    listContent = <p className={styles.errorText}>{t('error')}: {typeof error === 'string' ? error : error.message || t('failed_to_load_list', 'Не удалось загрузить список')}</p>;
  } else if (filteredUsers.length > 0) {
    listContent = filteredUsers.map(user => (
      <UserItem 
        key={user._id} 
        user={user} 
        currentUserId={currentUserId} 
        onFollowToggle={onFollowToggle}
        onCloseModal={onClose}
      />
    ));
  } else {
    listContent = (
      <p className={styles.noUsersText}>
        {searchTerm ? t('users_not_found', 'Пользователи не найдены') : (title === t('followers', 'Подписчики') ? t('no_followers', 'Нет подписчиков') : t('no_following', 'Нет подписок'))}
      </p>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        {!isLoading && !error && (
          <div className={styles.searchInputContainer}>
            <input 
              type="text"
              placeholder={t('search', 'Поиск')}
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading || !!error} // Блокируем поиск при загрузке или ошибке
            />
          </div>
        )}
        <div className={styles.userList}>
          {listContent}
        </div>
      </div>
    </div>
  );
};

export default FollowListModal; 