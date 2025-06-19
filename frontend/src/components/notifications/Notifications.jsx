import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Импортируем useNavigate
import { fetchNotifications, markAsRead, markAllAsRead } from '../../Redux/notificationSlice'; // clearNotificationsError пока не используем активно
import { useTranslations } from '../../hooks/useTranslations';
import styles from './Notifications.module.css';
import { Link } from 'react-router-dom';
import { API_URL, DEFAULT_AVATAR, DEFAULT_POST_IMAGE } from '../../config/constants';
import PostModal from '../PostModal/PostModal'; // 1. Импорт PostModal
import { fetchPostById } from '../../Redux/postSlice';

const formatTimeAgo = (dateString, t) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds} ${t('seconds_ago', 'сек. назад')}`;
  if (minutes < 60) return `${minutes} ${t('minutes_ago', 'мин. назад')}`;
  if (hours < 24) return `${hours} ${t('hours_ago', 'ч. назад')}`;
  return `${days} ${t('days_ago', 'дн. назад')}`;
};

// parseNotificationMessage больше не нужен, так как данные структурированы

const NotificationItem = ({ notification, onNotificationClick }) => {
  const { _id, sender, type, post, createdAt, read } = notification;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslations();

  if (!sender) {
    console.warn(t('no_notification_sender', 'Нет отправителя уведомления'));
    return null;
  }

  let actionText = '';
  let primaryLinkPath = `/profile/${sender.username}`;
  let postPreviewSrc = null;

  const senderAvatarSrc = sender.avatar
    ? (sender.avatar.startsWith('http') ? sender.avatar : `${API_URL}${sender.avatar}`)
    : DEFAULT_AVATAR;

  if ((type === 'like' || type === 'comment') && post) {
    actionText = type === 'like' ? t('liked_your_post') : t('commented_on_your_post');
    primaryLinkPath = `/post/${post._id}`;
    if (post.imageUrl) {
      postPreviewSrc = post.imageUrl.startsWith('http') ? post.imageUrl : `${API_URL}${post.imageUrl}`;
    } else if (post.videoUrl && post.mediaType === 'video') {
      postPreviewSrc = DEFAULT_POST_IMAGE;
    }
  } else if (type === 'follow') {
    actionText = t('new_follower');
  }

  const handleItemClick = async () => {
    if (!read) {
      try {
        await dispatch(markAsRead(_id));
      } catch (err) {
        console.error(t('cannot_mark_notification_read', 'Не удалось отметить уведомление как прочитанное'), err);
      }
    }
    if (
      (type === 'like' || type === 'comment') &&
      post &&
      typeof post === 'object' &&
      typeof post._id === 'string' &&
      /^[a-f\d]{24}$/i.test(post._id)
    ) {
      onNotificationClick({ type: 'post', id: post._id, postData: post });
    } else if (type === 'follow') {
      navigate(primaryLinkPath);
    }
  };

  return (
    <div
      className={`${styles.notificationItem} ${read ? styles.read : ''}`}
      onClick={handleItemClick} // Используем общий клик по элементу
    >
      <Link to={`/profile/${sender.username}`} className={styles.avatarLink} onClick={e => e.stopPropagation()}>
        <img
          src={senderAvatarSrc}
          alt={sender.username}
          className={styles.senderAvatar}
          onError={e => { e.target.src = DEFAULT_AVATAR; }}
        />
      </Link>
      <div className={styles.notificationContent}>
        <p className={styles.notificationText}>
          <Link to={`/profile/${sender.username}`} className={styles.senderUsername} onClick={e => e.stopPropagation()}>
            {sender.username}
          </Link>
          <span className={styles.actionText}> {actionText}</span>
        </p>
        <span className={styles.notificationTime}>{formatTimeAgo(createdAt, t)}</span>
      </div>
      {postPreviewSrc && (type === 'like' || type === 'comment') && (
         <div className={styles.postThumbnailContainer} onClick={e => { e.stopPropagation(); handleItemClick(); }} style={{ cursor: 'pointer' }}>
            <img src={postPreviewSrc} alt={t('post_preview', 'Превью публикации')} className={styles.postThumbnail} />
         </div>
      )}
      {!postPreviewSrc && (type === 'like' || type === 'comment') && post && (
        <div className={`${styles.postThumbnailContainer} ${styles.postThumbnailPlaceholder}`}></div>
      )}
    </div>
  );
};

const Notifications = () => {
  const dispatch = useDispatch();
  const { t } = useTranslations();
  const { notifications, loading, error } = useSelector((state) => state.notifications);
  const currentUser = useSelector((state) => state.auth.user);
  const [selectedPostForModal, setSelectedPostForModal] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [dispatch]);

  const loadNotifications = async () => {
    try {
      await dispatch(fetchNotifications()).unwrap();
    } catch (err) {
      console.error(t('cannot_load_notifications', 'Не удалось загрузить уведомления'), err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
    } catch (err) {
      console.error(t('cannot_mark_all_read', 'Не удалось отметить все уведомления как прочитанные'), err);
    }
  };

  const handleNotificationInteraction = async (interactionData) => {
    if (
      interactionData.type === 'post' &&
      interactionData.id &&
      typeof interactionData.id === 'string' &&
      /^[a-f\d]{24}$/i.test(interactionData.id)
    ) {
      setLoadingPost(true);
      try {
        const resultAction = await dispatch(fetchPostById(interactionData.id));
        if (fetchPostById.fulfilled.match(resultAction)) {
          setSelectedPostForModal(resultAction.payload);
        }
      } finally {
        setLoadingPost(false);
      }
    }
  };

  const handlePostModalClose = () => {
    setSelectedPostForModal(null);
  };

  const handlePostUpdatedInModal = (updatedPost) => {
    setSelectedPostForModal(null);
    loadNotifications();
  };

  const handlePostDeletedInModal = (postId) => {
    setSelectedPostForModal(null);
    loadNotifications();
  };

  if (loading || loadingPost) {
    return <div className={styles.loading}>{t('loading')}</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (notifications.length === 0) {
    return <div className={styles.noNotifications}>{t('no_notifications')}</div>;
  }

  return (
    <div className={styles.notificationsContainer}>
      <div className={styles.notificationsHeader}>
        <h1 className={styles.notificationsTitle}>{t('notifications')}</h1>
      </div>
      <div className={styles.notificationsList}>
        {notifications.map((notification) => (
          <NotificationItem 
            key={notification._id} 
            notification={notification} 
            onNotificationClick={handleNotificationInteraction}
          />
        ))}
      </div>
      {selectedPostForModal && (
        <PostModal
          post={selectedPostForModal}
          onClose={handlePostModalClose}
          onPostUpdated={handlePostUpdatedInModal}
          onPostDeleted={handlePostDeletedInModal}
        />
      )}
    </div>
  );
};

export default Notifications; 