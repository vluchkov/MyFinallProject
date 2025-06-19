import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ReactPlayer from 'react-player/lazy';
import {
  fetchUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  fetchFollowers,
  fetchFollowing,
  clearFollowLists
} from '../../Redux/profileSlice';
import { useTranslations } from '../../hooks/useTranslations';
import EditProfileModal from './EditProfileModal';
import styles from './Profile.module.css';
import { DEFAULT_AVATAR, API_URL, DEFAULT_POST_IMAGE } from '../../config/constants';
import PostModal from '../PostModal/PostModal';
import EditPostModal from '../EditPostModal/EditPostModal';
import FollowListModal from './FollowListModal/FollowListModal';
import { logout } from '../../Redux/authSlice';
import { setTheme, THEMES } from '../../Redux/themeSlice';

import settings from '../../../png/settings.png';
import UserLink from '../UserLink/UserLink';
import { startConversation } from '../../Redux/messagesSlice';

// TODO: Add your like/dislike icon files to the project (e.g., in frontend/src/assets/icons/)
// and uncomment/update the import paths below and the <img> tags in the overlay.
// import likeIcon from '../../assets/icons/like-filled.svg'; 
// import dislikeIcon from '../../assets/icons/like-outline.svg'; 

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslations();
  const {
    profile,
    loading,
    error,
    followLoading,
    followersList,
    followersLoading,
    followersError,
    followingList,
    followingLoading,
    followingError
  } = useSelector(state => state.profile);
  const currentUser = useSelector(state => state.auth.user);
  const currentTheme = useSelector(state => state.theme.currentTheme);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postToEdit, setPostToEdit] = useState(null);

  // Новое состояние для выпадающего меню настроек
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const settingsRef = useRef(null); // Реф для отслеживания кликов вне меню
  // Новое состояние для подменю тем
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // 2. Новые состояния для модального окна подписчиков/подписок
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTitle, setFollowModalTitle] = useState('');
  const [followModalUsers, setFollowModalUsers] = useState([]);
  const [followModalType, setFollowModalType] = useState(''); // 'followers' или 'following'

  useEffect(() => {
    if (!username && currentUser?.username) {
      navigate(`/profile/${currentUser.username}`);
      return;
    }

    if (username) {
      dispatch(fetchUserProfile(username));
    }
  }, [dispatch, username, currentUser, navigate]);

  // Обработчик клика вне выпадающего меню настроек и подменю тем
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsDropdown(false);
        setShowThemeDropdown(false); // Также закрываем подменю тем
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSettingsClick = () => {
    setShowSettingsDropdown(prev => !prev);
    setShowThemeDropdown(false); // Скрываем подменю тем при открытии/закрытии основного меню
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowSettingsDropdown(false);
    setShowThemeDropdown(false);
    navigate('/login'); // Перенаправляем на страницу входа после выхода
  };

  const handleChangeTheme = () => {
    setShowThemeDropdown(prev => !prev); // Переключаем видимость подменю тем
  };

  const handleSetTheme = (theme) => {
    dispatch(setTheme(theme));
    setShowThemeDropdown(false); // Закрываем подменю тем после выбора
    setShowSettingsDropdown(false); // Закрываем основное меню настроек
  };

  const handleChangePassword = () => {
    setShowSettingsDropdown(false);
    setShowThemeDropdown(false);
    navigate('/settings/change-password'); // Пример пути к странице изменения пароля
  };

  const handleImageError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_AVATAR;
  }, []);

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async (formData) => {
    try {
      setUpdateError(null);
      
      // Отладочное логирование
      console.log('Текущий пользователь:', currentUser);
      const userId = currentUser?._id || currentUser?.id;
      console.log('ID пользователя (исходный):', userId);
      console.log('Тип ID пользователя:', typeof userId);
      console.log('Данные формы:', formData);
      
      if (!userId) {
        throw new Error(t('user_id_not_found', 'ID пользователя не найден'));
      }

      // Преобразуем ID в строку, если это еще не строка
      const userIdString = String(userId);
      console.log('ID пользователя (после преобразования):', userIdString);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('auth_token_not_found', 'Токен авторизации не найден'));
      }

      // Создаем FormData для отправки всех данных, включая файл аватара
      const sendData = new FormData();
      sendData.append('username', formData.username || '');
      sendData.append('email', formData.email || '');
      sendData.append('bio', formData.bio || '');
      sendData.append('fullName', formData.fullName || '');
      sendData.append('website', formData.website || '');
      sendData.append('phone', formData.phone || '');

      // Добавляем аватар, если он есть
      if (formData.avatar && formData.avatar instanceof File) {
        sendData.append('avatar', formData.avatar);
      }

      // Отправляем все данные в одном запросе
      const response = await fetch(`${API_URL}/api/users/${userIdString}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Не указываем Content-Type, он будет установлен автоматически для FormData
        },
        body: sendData
      });

      const responseData = await response.json();
      console.log('Ответ сервера (полный):', responseData);
      console.log('Статус ответа:', response.status);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || t('profile_update_error', 'Ошибка обновления профиля'));
      }

      // После успешного обновления — редирект на новый профиль
      navigate(`/profile/${formData.username}`);
      await dispatch(fetchUserProfile(formData.username));
      setShowEditModal(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setUpdateError(error.message);
    }
  };

  const isOwnProfile = currentUser && profile && (currentUser._id === profile._id || currentUser.id === profile.id);

  const handleEditRequest = (post) => {
    setSelectedPost(null);
    setPostToEdit(post);
  };

  const handleCloseEditModal = () => {
    setPostToEdit(null);
  };

  const handlePostSuccessfullyUpdated = (updatedPost) => {
    dispatch(fetchUserProfile(username));
    setPostToEdit(null);
  };

  // Новый обработчик для удаления поста из UI профиля
  const handlePostDeletedInProfile = (postId) => {
    // Перезагружаем данные профиля, чтобы список постов обновился
    // Redux Slice уже удалил пост из глобального состояния, если fetchUserProfile его использует.
    // Если profile.posts управляется локально (что маловероятно здесь), то нужно было бы:
    // setProfile(prevProfile => ({
    //   ...prevProfile,
    //   posts: prevProfile.posts.filter(p => p._id !== postId),
    //   postsCount: prevProfile.postsCount - 1
    // }));
    dispatch(fetchUserProfile(username));
  };

  // Update followModalUsers when Redux state changes
  useEffect(() => {
    if (followModalType === 'followers') {
      setFollowModalUsers(followersList || []);
    } else if (followModalType === 'following') {
      setFollowModalUsers(followingList || []);
    }
  }, [followersList, followingList, followModalType]);

  const openFollowModal = async (type) => {
    if (!profile || !profile._id) return;

    setFollowModalType(type);
    setFollowModalTitle(type === 'followers' ? t('followers', 'Подписчики') : t('following', 'Подписки'));
    setIsFollowModalOpen(true);
    // No longer setFollowModalUsers([]) here, it will be populated by useEffect
    // Loading state will be derived from Redux states (followersLoading, followingLoading)

    if (type === 'followers') {
      dispatch(fetchFollowers(profile._id));
    } else {
      dispatch(fetchFollowing(profile._id));
    }
  };

  const closeFollowModal = () => {
    setIsFollowModalOpen(false);
    setFollowModalTitle('');
    setFollowModalType('');
    setFollowModalUsers([]); // Clear local list on close
    dispatch(clearFollowLists()); // Clear lists and errors in Redux store
  };

  const handleFollowToggleInModal = async (userIdToToggle, currentFollowStatus) => {
    console.log(`Toggling follow status for ${userIdToToggle}, current status: ${currentFollowStatus}`);
    
    try {
      if (currentFollowStatus) {
        await dispatch(unfollowUser(userIdToToggle)).unwrap();
      } else {
        await dispatch(followUser(userIdToToggle)).unwrap();
      }
      // After successful follow/unfollow, update the user list in the modal locally
      // This is a simplification. Ideally, the backend for follow/unfollow would return the updated user object
      // or we would refetch the specific list (followers/following) for the modal.
      setFollowModalUsers(prevUsers => 
        prevUsers.map(u => 
          u._id === userIdToToggle ? { ...u, isFollowing: !currentFollowStatus } : u
        )
      );
      // Refresh the main profile data to update counts and potentially the profile's isFollowing status
      if (username) {
        dispatch(fetchUserProfile(username));
      }
    } catch (err) {
      console.error("Error toggling follow in modal:", err);
      // Optionally, show an error message to the user
    }
  };

  // Determine loading and error for the modal specifically
  const currentFollowModalLoading = followModalType === 'followers' ? followersLoading : followingLoading;
  const currentFollowModalError = followModalType === 'followers' ? followersError : followingError;

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingSpinner}>{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.error}>
          {error}
          <button 
            onClick={() => dispatch(fetchUserProfile(username))}
            className={styles.retryButton}
          >
            {t('retry', 'Повторить')}
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.error}>
          {t('profile_not_found', 'Профиль не найден')}
          <button 
            onClick={() => dispatch(fetchUserProfile(username))}
            className={styles.retryButton}
          >
            {t('retry', 'Повторить')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <UserLink username={profile.username}>
            <img
              src={profile.avatar ? (profile.avatar.startsWith('http') ? profile.avatar : `${API_URL}${profile.avatar}`) : DEFAULT_AVATAR}
              alt={profile.username}
              className={styles.avatar}
              onError={handleImageError}
            />
          </UserLink>
        </div>

        <div className={styles.profileInfo}>
          <div className={styles.profileTopRow}>
            <UserLink username={profile.username}>
              <span className={styles.profileUsername}>{profile.username}</span>
            </UserLink>
            <div className={styles.profileActions}>
              {!isOwnProfile && (
                <>
                  <button
                    className={`${styles.followButton} ${profile.isFollowing ? styles.unfollowButton : ''}`}
                    onClick={async () => {
                      try {
                        if (profile.isFollowing) {
                          await dispatch(unfollowUser(profile.id)).unwrap();
                        } else {
                          await dispatch(followUser(profile.id)).unwrap();
                        }
                        if (username) {
                          dispatch(fetchUserProfile(username));
                        }
                      } catch (err) {
                        console.error('Failed to toggle follow state:', err);
                      }
                    }}
                    disabled={followLoading}
                  >
                    {followLoading ? t('loading') : (profile.isFollowing ? t('unfollow') : t('follow'))}
                  </button>
                  <button
                    className={styles.messageButton}
                    onClick={async () => {
                      try {
                        const resultAction = await dispatch(startConversation(profile._id));
                        console.log('startConversation result:', resultAction);
                        if (startConversation.fulfilled.match(resultAction)) {
                          console.log('Navigating to /messages');
                          navigate('/messages');
                        } else {
                          alert(t('chat_creation_error', 'Ошибка создания чата: ') + (resultAction.error?.message || t('unknown_error', 'Неизвестная ошибка')));
                        }
                      } catch (err) {
                        console.error('Ошибка при открытии чата:', err);
                        alert(t('chat_opening_error', 'Ошибка при открытии чата: ') + err.message);
                      }
                    }}
                  >
                    {t('message')}
                  </button>
                </>
              )}
              {isOwnProfile && (
                <button 
                  className={styles.editProfileButton}
                  onClick={handleEditProfile}
                >
                  {t('edit_profile')}
                </button>
              )}
              {/* Кнопка настроек и выпадающее меню */}
              {isOwnProfile && (
                <div className={styles.settingsContainer} ref={settingsRef}>
                  <button 
                    className={styles.settingsButton}
                    onClick={handleSettingsClick}
                  >
                    <img src={settings} alt={t('settings')} className={styles.settingsIcon} />
                  </button>
                  {showSettingsDropdown && (
                    <div className={styles.settingsDropdown}>
                      <button onClick={handleLogout} className={styles.dropdownItem}>
                        {t('logout')}
                      </button>
                      <button onClick={handleChangeTheme} className={styles.dropdownItem}>
                        {t('theme')} ({currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1).replace(/-/g, ' ')})
                      </button>
                      {showThemeDropdown && (
                        <div className={styles.themeDropdown}>
                          {Object.entries(THEMES).map(([key, value]) => (
                            <button 
                              key={key} 
                              onClick={() => handleSetTheme(value)} 
                              className={styles.dropdownItem}
                            >
                              {value.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </button>
                          ))}
                        </div>
                      )}
                      <button onClick={handleChangePassword} className={styles.dropdownItem}>
                        {t('change_password')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{profile.postsCount || 0}</span> {t('posts')}
            </div>
            <button
              type="button"
              className={styles.stat}
              onClick={() => { console.log('Открываю модалку подписчиков'); openFollowModal('followers'); }}
              style={{cursor: 'pointer', background: 'none', border: 'none', padding: 0}}
            >
              <span className={styles.statValue}>{profile.followersCount || 0}</span> {t('followers')}
            </button>
            <button
              type="button"
              className={styles.stat}
              onClick={() => { console.log('Открываю модалку подписок'); openFollowModal('following'); }}
              style={{cursor: 'pointer', background: 'none', border: 'none', padding: 0}}
            >
              <span className={styles.statValue}>{profile.followingCount || 0}</span> {t('following')}
            </button>
          </div>

          <div className={styles.bioSection}>
            {profile.fullName && <div className={styles.fullName}>{profile.fullName}</div>}
            {profile.bio && <div className={styles.bio}>{profile.bio}</div>}
            {profile.website && (
              <a 
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                className={styles.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('website', 'Веб-сайт')}: {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${styles.active}`}
          onClick={() => {}}
        >
          <div className={styles.tabIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="M3 9h18M9 21V9"></path>
            </svg>
          </div>
          <span>{t('posts')}</span>
        </button>
      </div>

      <div className={styles.postsGrid}>
        {isOwnProfile && (!profile.posts || profile.posts.length === 0) ? (
          <div className={styles.noPostsContainer}>
            <div className={styles.noPostsIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <h2 className={styles.noPostsTitle}>{t('share_first_media')}</h2>
            <p className={styles.noPostsSubtitle}>{t('share_first_media_subtitle')}</p>
            <button 
              className={styles.shareFirstPhotoButton}
              onClick={() => navigate('/create-post')}
            >
              {t('share_first_media_button')}
            </button>
          </div>
        ) : (
          (profile.posts || []).filter(
            post => post && typeof post === 'object' && typeof post._id === 'string' && /^[a-f\d]{24}$/i.test(post._id)
          ).map(post => {
            const postImageSrc = (post.mediaType === 'image' || (!post.mediaType && post.imageUrl)) && post.imageUrl
              ? post.imageUrl.startsWith('http') ? post.imageUrl : `${API_URL}${post.imageUrl}`
              : DEFAULT_POST_IMAGE;
            
            const safeLikesCount = post.likes?.length || 0;
            
            // Assuming post.comments is an array of comments or post.commentsCount is a number
            const commentsLength = post.commentsCount !== undefined ? post.commentsCount : (post.comments?.length || 0);

            const isLiked = currentUser && post.likes && post.likes.some(like => {
              if (typeof like === 'string') return like === currentUser._id;
              if (like && like.user && typeof like.user === 'string') return like.user === currentUser._id;
              if (like && like.user && typeof like.user === 'object' && like.user._id) return like.user._id === currentUser._id;
              // Fallback if like structure is just the user ID directly in the array
              if (like && like._id && typeof like._id === 'string') return like._id === currentUser._id;
              return false;
            });

            return (
              <div key={post._id} className={styles.postItem} onClick={() => setSelectedPost(post)}>
                {(post.mediaType === 'image' || (!post.mediaType && post.imageUrl)) && post.imageUrl ? (
                  <>
                    <img 
                      src={postImageSrc} 
                      alt={post.content || t('post', 'Публикация')} 
                      className={styles.postImage} 
                      onError={(e) => { e.target.src = DEFAULT_POST_IMAGE; }}
                    />
                    <div className={styles.postOverlay}>
                      <div className={styles.postStats}>
                        <span className={isLiked ? styles.liked : ''}>
                          {/* Icon placeholder */}
                          🤍 {safeLikesCount}
                        </span>
                        <span>
                          {/* Icon placeholder */}
                          💬 {commentsLength}
                        </span>
                      </div>
                    </div>
                  </>
                ) : post.mediaType === 'video' && post.videoUrl ? (
                  <>
                    {post.videoUrl.startsWith('http') ? (
                      // External video: Use ReactPlayer with light mode and play icon overlay
                      <div className={styles.videoPreviewContainer}>
                        <ReactPlayer
                          url={post.videoUrl} // external URL
                          className={styles.videoPreviewPlayer}
                          width="100%"
                          height="100%"
                          light={true}
                          controls={false}
                          onError={(e) => console.error('ReactPlayer error in Profile (external):', e, post.videoUrl)}
                        />
                        <div className={styles.playIconOverlay}>
                          <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      // Local video: Use native <video> tag with play icon overlay
                      <div className={styles.videoPreviewContainer}>
                        <video
                          src={`${API_URL}${post.videoUrl}`} // local URL, needs API_URL prefix
                          className={styles.videoElementPreview} // Specific class for <video> tag
                          width="100%"
                          height="100%"
                          preload="metadata" // Hint for browser to load first frame as poster
                          muted
                          playsInline 
                          onError={(e) => console.error('HTML <video> error in Profile (local):', e, `${API_URL}${post.videoUrl}`)}
                        >
                          {t('video_not_supported', 'Your browser does not support the video tag.')}
                        </video>
                        <div className={styles.playIconOverlay}>
                          <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {/* Overlay for video posts */}
                    <div className={styles.postOverlay}>
                      <div className={styles.postStats}>
                        <span className={isLiked ? styles.liked : ''}>
                          🤍 {safeLikesCount}
                        </span>
                        <span>
                          💬 {commentsLength}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  // Fallback if no image or video, or if mediaType is not set and imageUrl is missing
                  <>
                    <img
                      src={DEFAULT_POST_IMAGE}
                      alt={t('post_media', 'Медиа публикации')}
                      className={styles.postImage} // Use same class for consistent styling
                      onError={(e) => { e.target.src = DEFAULT_POST_IMAGE; }} // Fallback for fallback
                    />
                    {/* Overlay for fallback posts */}
                    <div className={styles.postOverlay}>
                      <div className={styles.postStats}>
                        <span className={isLiked ? styles.liked : ''}>
                          🤍 {safeLikesCount}
                        </span>
                        <span>
                          💬 {commentsLength}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdate={(updatedPostData) => {
            setSelectedPost(prev => ({...prev, ...updatedPostData}));
            dispatch(fetchUserProfile(username));
          }}
          onEditRequest={handleEditRequest}
          onPostDeleted={handlePostDeletedInProfile}
        />
      )}

      {postToEdit && (
        <EditPostModal
          post={postToEdit}
          onClose={handleCloseEditModal}
          onPostUpdated={handlePostSuccessfullyUpdated}
        />
      )}

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
        />
      )}

      {updateError && (
        <div className={styles.updateError}>
          {updateError}
        </div>
      )}

      {isFollowModalOpen && (
        <FollowListModal
          isOpen={isFollowModalOpen}
          title={followModalTitle}
          users={followModalUsers}
          loading={currentFollowModalLoading}
          error={currentFollowModalError}
          onClose={closeFollowModal}
          onFollowToggle={handleFollowToggleInModal}
          currentUserId={currentUser?._id}
        />
      )}
    </div>
  );
};

export default Profile;