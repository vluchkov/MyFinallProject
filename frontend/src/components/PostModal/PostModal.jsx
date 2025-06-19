import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactPlayer from 'react-player/lazy';
import { likePost, deletePost, addComment } from '../../Redux/postSlice';
import { followUser } from '../../Redux/profileSlice';
import axios from 'axios';
import { API_URL, DEFAULT_AVATAR, DEFAULT_POST_IMAGE } from '../../config/constants';
import styles from './PostModal.module.css';
import { useTranslations } from '../../hooks/useTranslations';

import UserLink from '../UserLink/UserLink';

const formatTimeAgo = (dateString, t) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44);
  const years = Math.round(days / 365.25);

  if (seconds < 5) return t('now', 'сейчас');
  if (seconds < 60) return `${seconds}${t('seconds_short', 'с')}`;
  if (minutes < 60) return `${minutes}${t('minutes_short', 'м')}`;
  if (hours < 24) return `${hours}${t('hours_short', 'ч')}`;
  if (days === 1) return t('yesterday', 'вчера');
  if (days < 7) return `${days}${t('days_short', 'д')}`;
  if (weeks < 5) return `${weeks}${t('weeks_short', 'н')}`;
  if (months < 12) return new Intl.DateTimeFormat('ru', { month: 'short', day: 'numeric' }).format(date);
  return new Intl.DateTimeFormat('ru', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

function cleanYoutubeUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return `https://youtu.be/${u.pathname.replace('/', '')}`;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) {
        return `https://www.youtube.com/watch?v=${v}`;
      }
    }
    return url;
  } catch {
    return url;
  }
}

const PostModal = ({ post: initialPost, onClose, onUpdate, onEditRequest, onPostDeleted }) => {
  const [post, setPost] = useState(initialPost);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  
  const dispatch = useDispatch();
  const { t } = useTranslations();
  const currentUser = useSelector(state => state.auth.user);
  const globalPostState = useSelector(state => 
    state.posts.posts.find(p => p._id === initialPost?._id)
  );
  const { likeLoading, loading: postActionLoading, error: postActionError } = useSelector(state => state.posts);
  
  useEffect(() => {
    const currentPostData = globalPostState || initialPost;
    setPost(currentPostData);
    // Загружаем профиль автора для получения isFollowing
    const fetchAuthorProfile = async () => {
      if (currentPostData?.author?.username) {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API_URL}/api/users/profile/${currentPostData.author.username}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAuthorProfile(res.data);
        } catch (err) {
          setAuthorProfile(null);
        }
      }
    };
    fetchAuthorProfile();
  }, [initialPost, globalPostState]);

  if (!post) return null;

  // Log post data and media properties for debugging video in PostModal
  console.log('[PostModal] Received post:', JSON.parse(JSON.stringify(post)));
  console.log('[PostModal] post.mediaType:', post.mediaType);
  console.log('[PostModal] post.videoUrl:', post.videoUrl);
  let videoSrcForNativePlayer = null;
  if (post.mediaType === 'video' && post.videoUrl) {
    try {
      // Handle both HTTP and local URLs
      videoSrcForNativePlayer = post.videoUrl.startsWith('http') 
        ? post.videoUrl 
        : new URL(post.videoUrl, API_URL).href;
      console.log('[PostModal] Calculated videoSrc for native player:', videoSrcForNativePlayer);
    } catch (e) {
      console.error('[PostModal] Error constructing URL for video:', e);
      console.error('[PostModal] post.videoUrl was:', post.videoUrl);
      console.error('[PostModal] API_URL was:', API_URL);
    }
  }

  const isLikedByCurrentUser = post.likes?.some(like => {
    if (!currentUser || !like) return false;
    // Case 1: like is a string ID
    if (typeof like === 'string') return like === currentUser._id;
    // Case 2: like is an object with _id (like is the user object itself)
    if (like._id && typeof like._id === 'string') return like._id === currentUser._id;
    // Case 3: like is an object with a user property, which is a string ID
    if (like.user && typeof like.user === 'string') return like.user === currentUser._id;
    // Case 4: like is an object with a user property, which is an object with _id
    if (like.user && typeof like.user === 'object' && like.user._id) return like.user._id === currentUser._id;
    return false;
  });

  const handleLike = async () => {
    if (likeLoading || !post?._id) return;
    try {
      const updatedPostData = await dispatch(likePost(post._id)).unwrap();
      setPost(updatedPostData); 
      if (onUpdate) {
        onUpdate(updatedPostData);
      }
    } catch (error) {
      console.error('Ошибка при лайке:', error);
    }
  };

  const handleEdit = () => {
    if (onEditRequest) {
      onEditRequest(post);
    }
    setShowOptionsMenu(false);
  };

  const handleAttemptDelete = () => {
    if (window.confirm(t('confirm_delete_post', 'Вы уверены, что хотите удалить публикацию?'))) {
      handleConfirmDelete();
    }
  };

  const handleConfirmDelete = async () => {
    if (!post || !post._id || postActionLoading) return;
    try {
      await dispatch(deletePost(post._id)).unwrap();
      setShowOptionsMenu(false);
      if (onPostDeleted) {
        onPostDeleted(post._id);
      }
      onClose();
    } catch (error) {
      console.error(t('delete_post_error', 'Ошибка при удалении публикации'), error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setError(t('comment_empty_error', 'Комментарий не может быть пустым'));
      return;
    }

    setLoading(true);
    try {
      await dispatch(addComment({ postId: post._id, content: newComment })).unwrap();
      setNewComment('');
      setError('');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(t('add_comment_error', 'Ошибка при добавлении комментария'), error);
    }
  };

  const renderComments = () => {
    if (!post.comments || post.comments.length === 0) {
      return <p className={styles.noComments}>{t('no_comments_yet', 'Комментариев пока нет')}</p>;
    }
    return post.comments.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((comment, index) => {
      const key = comment && comment._id ? comment._id : `comment-${index}`;
      if (!(comment && comment._id)) {
        console.warn(t('comment_without_id', 'Комментарий без id'), comment);
      }
      return (
      <div key={key} className={styles.commentItem}>
        <UserLink username={comment?.author?.username}>
          <img
            src={comment?.author?.avatar ? (comment.author.avatar.startsWith('http') ? comment.author.avatar : `${API_URL}${comment.author.avatar}`) : DEFAULT_AVATAR}
            alt={comment?.author?.username || t('user', 'Пользователь')}
            className={styles.commentAuthorAvatar}
          />
        </UserLink>
        <div className={styles.commentContent}>
          <UserLink username={comment?.author?.username}>
            <span className={styles.commentAuthorUsername}>{comment?.author?.username || t('anonymous', 'Аноним')}</span>
          </UserLink>
          <span className={styles.commentText}>{comment?.content}</span>
        </div>
      </div>
    )});
  };

  function getLikeWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return t('like_singular', 'лайк');
    if ([2,3,4].includes(count % 10) && ![12,13,14].includes(count % 100)) return t('like_plural_2_4', 'лайка');
    return t('like_plural', 'лайков');
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalGrid}>
          <div className={styles.mediaSection}>
            {(post.mediaType === 'image' || !post.mediaType) && post.imageUrl && (
              <img 
                src={post.imageUrl.startsWith('http') ? post.imageUrl : new URL(post.imageUrl, API_URL).href}
                alt={post.content || 'post_image'}
                className={styles.postMedia}
                onError={(e) => {
                  console.error('Ошибка загрузки изображения', e.target.src);
                  e.target.src = DEFAULT_POST_IMAGE;
                }}
              />
            )}
            {post.mediaType === 'video' && post.videoUrl && (
              <div className={styles.videoPlayerContainer}>
                {post.videoUrl.startsWith('http') ? (
                  <ReactPlayer
                    url={cleanYoutubeUrl(post.videoUrl)}
                    className={styles.reactPlayer}
                    width='100%'
                    height='100%'
                    controls={true}
                    playing={false}
                    onError={(e) => {
                      console.error('[PostModal] ReactPlayer error:', e);
                      console.error('[PostModal] Video URL was:', post.videoUrl);
                    }}
                  />
                ) : (
                  <video 
                    key={videoSrcForNativePlayer}
                    src={videoSrcForNativePlayer}
                    controls 
                    className={styles.postMedia}
                    onError={(e) => {
                      console.error('[PostModal] Native video player error:', e);
                      console.error('[PostModal] Video src was:', videoSrcForNativePlayer);
                    }}
                  />
                )}
              </div>
            )}
            {!post.imageUrl && !post.videoUrl && (
                <img 
                    src={DEFAULT_POST_IMAGE} 
                    alt={t('image', 'Изображение')}
                    className={styles.postMedia}
                />
            )}
          </div>
          <div className={styles.detailsSection}>
            <div className={styles.header}>
              <UserLink username={post.author?.username}>
                <img
                  src={post.author?.avatar ? (post.author.avatar.startsWith('http') ? post.author.avatar : `${API_URL}${post.author.avatar}`) : DEFAULT_AVATAR}
                  alt={post.author?.username}
                  className={styles.authorAvatar}
                  onError={(e) => {
                    console.error(t('avatar_load_error', 'Ошибка загрузки аватара'), post.author?.avatar);
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
              </UserLink>
              <UserLink username={post.author?.username}>
                <span className={styles.authorUsername}>{post.author?.username}</span>
              </UserLink>
              {/* Кнопка Подписаться */}
              {currentUser && post.author?._id !== currentUser._id && authorProfile && authorProfile.isFollowing === false && (
                <button
                  className={styles.followButton}
                  style={{ marginLeft: 12 }}
                  onClick={async () => {
                    try {
                      await dispatch(followUser(post.author._id)).unwrap();
                      // После подписки обновляем профиль автора
                      const token = localStorage.getItem('token');
                      const res = await axios.get(`${API_URL}/api/users/profile/${post.author.username}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setAuthorProfile(res.data);
                    } catch (err) {
                      console.error(t('follow_error', 'Ошибка при подписке:'), err);
                    }
                  }}
                >
                  {t('follow')}
                </button>
              )}
              <div className={styles.headerControls}>
                {currentUser && currentUser._id === post.author?._id && (
                  <div className={styles.optionsMenuContainer}>
                    <button 
                      onClick={() => setShowOptionsMenu(prev => !prev)} 
                      className={styles.optionsButton}
                      aria-label={t('post_options', 'Опции публикации')}
                      disabled={postActionLoading}
                    >
                      ⋮
                    </button>
                    {showOptionsMenu && (
                      <div className={styles.optionsDropdown}>
                        <button onClick={handleAttemptDelete} className={`${styles.optionItem} ${styles.deleteItem}`} disabled={postActionLoading}>
                          {t('delete')}
                        </button>
                        <button onClick={handleEdit} className={styles.optionItem} disabled={postActionLoading}>
                          {t('edit')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button className={styles.closeButton} onClick={onClose} disabled={postActionLoading}>×</button>
              </div>
            </div>
            
            <div className={styles.contentAndComments}>
              <div className={styles.contentScrollable}>
                {post.content && (
                    <div className={styles.captionContainer}>
                        <UserLink username={post.author?.username}>
                          <img
                            src={post.author?.avatar ? (post.author.avatar.startsWith('http') ? post.author.avatar : `${API_URL}${post.author.avatar}`) : DEFAULT_AVATAR}
                            alt={post.author?.username}
                            className={styles.commentAuthorAvatar}
                          />
                        </UserLink>
                        <p className={styles.caption}>
                        <UserLink username={post.author?.username}>
                          <span className={styles.commentAuthorUsername}>{post.author?.username}</span>
                        </UserLink>
                        {' '}{post.content}
                        </p>
                    </div>
                )}
                <div className={styles.commentsSection}>
                  {renderComments()} 
                </div>
              </div> 

              <div className={styles.actionsAndFormContainer}>
                <div className={styles.actions}>
                  <button 
                    className={`${styles.likeButton} ${isLikedByCurrentUser ? styles.liked : ''}`}
                    onClick={handleLike}
                    disabled={likeLoading || postActionLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isLikedByCurrentUser ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.stats}>
                  <span>
                    {post.likes?.length || 0} {getLikeWord(post.likes?.length || 0)}
                  </span>
                </div>
                {post.createdAt && (
                  <div className={styles.postTimestamp}>
                    {formatTimeAgo(post.createdAt, t)}
                  </div>
                )}
                {postActionError && <p className={styles.errorTextModal}>{typeof postActionError === 'string' ? postActionError : JSON.stringify(postActionError)}</p>}
                
                <form onSubmit={handleAddComment} className={styles.commentForm}>
                  <input 
                    type="text" 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder={t('add_comment_placeholder', 'Добавить комментарий...')} 
                    className={styles.commentInput}
                    disabled={postActionLoading}
                  />
                  <button type="submit" className={styles.commentSubmitButton} disabled={!newComment.trim() || postActionLoading}>
                    {postActionLoading ? '...' : t('send', 'Отправить')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;