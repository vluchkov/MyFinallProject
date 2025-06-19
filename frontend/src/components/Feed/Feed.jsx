import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player/lazy';
import {
  followUser
} from '../../Redux/profileSlice';
import {
  fetchAllPosts,
  fetchFollowedPosts,
  likePost,
  addComment,
  addPostToFavorites,
  removePostFromFavorites,
  unlikePost
} from '../../Redux/postSlice';
import { useTranslations } from '../../hooks/useTranslations';
import { API_URL, DEFAULT_AVATAR, DEFAULT_POST_IMAGE } from '../../config/constants';
import styles from './Feed.module.css';
import PostModal from '../PostModal/PostModal';
import PostGridItem from '../PostGridItem/PostGridItem';
import UserLink from '../UserLink/UserLink';
import ShareToMessagesModal from './ShareToMessagesModal';

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

const PaperPlaneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
);

const CommentBubbleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="#222" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M34 36.5c-2.7 1.5-6.1 2.5-10 2.5C13.1 39 6 32.84 6 25.5S13.1 12 24 12s18 6.16 18 13.5c0 3.16-1.7 6.04-4.5 8.16V42l-6.5-5.5Z"/>
  </svg>
);

const DotsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
);

const VerifiedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0095f6" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.09 4.26L18 7.27l-3.41 3.32L15.18 15 12 12.73 8.82 15l.59-4.41L6 7.27l3.91-.99L12 2z"/><path d="M10.5 13.5l-2-2 1.41-1.41L10.5 10.67l3.59-3.59L15.5 8.5l-5 5z" fill="#fff"/></svg>
);

function pluralizeMark(count, t) {
  if (count % 10 === 1 && count % 100 !== 11) return t('like_singular', 'лайк');
  if ([2,3,4].includes(count % 10) && ![12,13,14].includes(count % 100)) return t('like_plural_2_4', 'лайка');
  return t('like_plural', 'лайков');
}

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

const Feed = ({ exploreMode = false }) => {
  const dispatch = useDispatch();
  const { t } = useTranslations();
  const { posts: allPosts, loading, error } = useSelector(state => state.posts);
  const currentUser = useSelector(state => state.auth.user);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postToEdit, setPostToEdit] = useState(null);
  const [newCommentTexts, setNewCommentTexts] = useState({});
  const [errorState, setErrorState] = useState('');
  const [sharePostId, setSharePostId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shareToMessagesOpen, setShareToMessagesOpen] = useState(false);
  const [videoStates, setVideoStates] = useState({});
  const videoRefs = useRef({});

  const validPosts = allPosts.filter(
    post => post && typeof post === 'object' && typeof post._id === 'string' && /^[a-f\d]{24}$/i.test(post._id)
  );

  useEffect(() => {
    if (exploreMode) {
      dispatch(fetchAllPosts());
    } else {
      dispatch(fetchFollowedPosts());
    }
  }, [dispatch, exploreMode]);

  useEffect(() => {
    const observers = {};
    validPosts.forEach(post => {
      if (post.mediaType === 'video') {
        if (!videoRefs.current[post._id]) return;
        observers[post._id] = new window.IntersectionObserver(
          ([entry]) => {
            setVideoStates(prev => ({
              ...prev,
              [post._id]: {
                ...prev[post._id],
                playing: entry.isIntersecting
              }
            }));
          },
          { threshold: 0.5 }
        );
        observers[post._id].observe(videoRefs.current[post._id]);
      }
    });
    return () => {
      Object.values(observers).forEach(observer => observer.disconnect());
    };
  }, [validPosts]);

  useEffect(() => {
    setVideoStates(prev => {
      let changed = false;
      const updated = { ...prev };
      validPosts.forEach(post => {
        if (post.mediaType === 'video' && !updated[post._id]) {
          updated[post._id] = { playing: false, muted: true };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [validPosts]);

  const handlePostUpdate = (updatedPost) => {
    dispatch(fetchFollowedPosts());
    if (selectedPost && selectedPost._id === updatedPost._id) {
      setSelectedPost(prev => ({ ...prev, ...updatedPost }));
    }
  };

  const handlePostDeleted = (postId) => {
    dispatch(fetchFollowedPosts());
    if (selectedPost && selectedPost._id === postId) {
      setSelectedPost(null);
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser) {
      return;
    }
    try {
      const post = allPosts.find(p => p._id === postId);
      if (post.likes.includes(currentUser._id)) {
        await dispatch(unlikePost(postId)).unwrap();
      } else {
        await dispatch(likePost(postId)).unwrap();
      }
    } catch (err) {
      setErrorState(t('cannot_like_post', 'Не удалось поставить лайк'));
    }
  };

  const handleEditRequest = (post) => {
    setSelectedPost(null);
    setPostToEdit(post);
  };

  const handleCommentInputChange = (postId, text) => {
    setNewCommentTexts(prev => ({
      ...prev,
      [postId]: text
    }));
  };

  const handleAddComment = async (postId) => {
    if (!currentUser) {
      return;
    }
    const commentContent = newCommentTexts[postId];
    if (!commentContent || commentContent.trim() === '') {
      return;
    }

    try {
      await dispatch(addComment({ postId, content: commentContent.trim() })).unwrap();
      setNewCommentTexts(prev => ({
        ...prev,
        [postId]: ''
      }));
      if (selectedPost && selectedPost._id === postId) {
      }
    } catch (err) {
      console.error(t('cannot_add_comment', 'Не удалось добавить комментарий'), err);
    }
  };

  const handleToggleFavorite = (postId, isCurrentlyFavorite) => {
    if (!currentUser) {
      return;
    }
    if (isCurrentlyFavorite) {
      dispatch(removePostFromFavorites(postId));
    } else {
      dispatch(addPostToFavorites(postId));
    }
  };

  const handleShare = (postId) => {
    setSharePostId(postId);
    setCopied(false);
  };

  const handleCopyLink = (postId) => {
    const url = window.location.origin + '/post/' + postId;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleMute = (postId) => {
    setVideoStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        muted: !prev[postId]?.muted
      }
    }));
  };

  const handleSetSelectedPost = (post) => {
    console.log('[Feed] Setting selected post:', post?._id, post?.mediaType);
    setSelectedPost(post);
  };

  const renderedPosts = useMemo(() => {
    let postsToRender = [...validPosts];

    if (exploreMode) {
      postsToRender = postsToRender.sort(() => Math.random() - 0.5);
      return (
        <div className={styles.exploreGrid}>
          {postsToRender.map(post => {
            if (!post || !post.author) {
              console.warn('Post or post author is undefined, skipping:', post);
              return null;
            }
            return (
              <PostGridItem
                key={post._id}
                post={post}
                onClick={handleSetSelectedPost}
              />
            );
          })}
        </div>
      );
    } else {
      postsToRender = postsToRender.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      return postsToRender.map(post => {
        if (!post || !post.author) {
          console.warn('Post or post author is undefined, skipping:', post);
          return null;
        }
        const currentUserId = currentUser?._id;
        const isLikedByCurrentUser = currentUserId && post.likes?.some(like => like === currentUserId || like?._id === currentUserId);
        const postTimeAgo = formatTimeAgo(post.createdAt, t);

        const authorAvatarSrc = post.author?.avatar
          ? (post.author.avatar.startsWith('http') ? post.author.avatar : `${API_URL}${post.author.avatar}`)
          : DEFAULT_AVATAR;

        const postMediaSrc = post.mediaType === 'video'
          ? cleanYoutubeUrl(post.videoUrl)
          : post.imageUrl
            ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${API_URL}${post.imageUrl}`)
            : undefined;

        const currentCommentText = newCommentTexts[post._id] || '';
        const isFavorite = post.isFavorite;

        return (
          <article key={post._id} className={styles.postCard}>
            <header className={styles.postHeader}>
              <div className={styles.headerLeft}>
                <UserLink username={post.author.username} className={styles.usernameLink}>
                  <img
                    src={authorAvatarSrc}
                    alt={post.author.username}
                    className={styles.authorAvatar}
                    onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                  />
                </UserLink>
                <div className={styles.headerUserBlock}>
                  <UserLink username={post.author.username} className={styles.usernameLink}>
                    <span className={styles.authorUsername}>{post.author.username}</span>
                    {post.author.isVerified && <VerifiedIcon />}
                  </UserLink>
                  <span className={styles.timeAgo}>{postTimeAgo}</span>
                </div>
              </div>
              <button className={styles.dotsButton}><DotsIcon /></button>
            </header>
            <div
              className={styles.postMediaContainer}
              ref={el => { if (post.mediaType === 'video') videoRefs.current[post._id] = el; }}
              onDoubleClick={() => handleLike(post._id)}
              onClick={() => handleSetSelectedPost(post)}
            >
              {post.mediaType === 'video' ? (
                <div className={styles.playerWrapper}>
                  <ReactPlayer
                    url={postMediaSrc}
                    controls={true}
                    width='100%'
                    height='100%'
                    className={styles.reactPlayer}
                    playing={!!videoStates[post._id]?.playing}
                    muted={videoStates[post._id]?.muted !== false}
                  />
                  <button
                    className={styles.muteButton}
                    onClick={e => { e.stopPropagation(); handleToggleMute(post._id); }}
                    aria-label={videoStates[post._id]?.muted === false ? t('unmute', 'Включить звук') : t('mute', 'Выключить звук')}
                  >
                    {videoStates[post._id]?.muted === false ? (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19 5v14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/></svg>
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                    )}
                  </button>
                </div>
              ) : (
                <img
                  src={postMediaSrc || DEFAULT_POST_IMAGE}
                  alt={t('post', 'Пост')}
                  className={styles.postImageContent}
                  onError={(e) => { e.target.src = DEFAULT_POST_IMAGE; }}
                />
              )}
            </div>
            <div className={styles.postActionsRow}>
              <div className={styles.actionsLeft}>
                <button
                  onClick={() => handleLike(post._id)}
                  className={`${styles.iconButton} ${isLikedByCurrentUser ? styles.liked : ''}`}
                  title={t('like')}
                >
                  {isLikedByCurrentUser ? '❤️' : '🤍'}
                </button>
                <button
                  onClick={() => handleSetSelectedPost(post)}
                  className={styles.iconButton}
                  title={t('comment')}
                >
                  <CommentBubbleIcon />
                </button>
                <button
                  onClick={() => handleShare(post._id)}
                  className={styles.iconButton}
                  title={t('share')}
                >
                  <PaperPlaneIcon />
                </button>
              </div>
              <button
                className={styles.iconButton}
                title={t('save_post')}
                style={{marginLeft: 'auto'}}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>
            <div className={styles.likesRow}>
              <span className={styles.likesCount}>{post.likes?.length || 0} {pluralizeMark(post.likes?.length || 0, t)}</span>
            </div>
            <div className={styles.postCaptionRow}>
              <img
                src={authorAvatarSrc}
                alt={post.author.username}
                className={styles.authorAvatar}
                style={{ width: 32, height: 32, marginRight: 8 }}
              />
              <UserLink username={post.author.username} className={styles.usernameLink}>
                <span className={styles.authorUsername}>{post.author.username}</span>
              </UserLink>
              <span className={styles.captionText}>{post.content}</span>
            </div>
            {post.comments?.length > 0 && (
              <button
                className={styles.viewCommentsButton}
                onClick={() => handleSetSelectedPost(post)}
              >
                {t('view_all_comments', 'Посмотреть все комментарии')} ({post.comments.length})
              </button>
            )}
            <div className={styles.addCommentRow}>
              <img
                src={currentUser?.avatar || DEFAULT_AVATAR}
                alt={currentUser?.username}
                className={styles.addCommentAvatar}
              />
              <input
                type="text"
                placeholder={t('add_comment_placeholder', 'Добавьте комментарий...')}
                value={currentCommentText}
                onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment(post._id);
                  }
                }}
                className={styles.addCommentInput}
              />
              <button
                onClick={() => handleAddComment(post._id)}
                disabled={!currentCommentText.trim()}
                className={styles.addCommentButton}
              >
                {t('post', 'Опубликовать')}
              </button>
            </div>
          </article>
        );
      });
    }
  }, [validPosts, currentUser, exploreMode, newCommentTexts, videoStates, t]);

  if (loading) {
    return <div className={styles.loading}>{t('loading')}</div>;
  }

  if (error) {
    return <div className={styles.error}>{t('error')}: {error}</div>;
  }

  if (!validPosts || validPosts.length === 0) {
    return (
      <div className={styles.noPosts}>
        {exploreMode ? t('no_posts_to_explore', 'Пока нет постов для исследования') : t('no_posts_yet')}
      </div>
    );
  }

  return (
    <div className={styles.feed}>
      {renderedPosts}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onEditRequest={handleEditRequest}
          onDeleteSuccess={handlePostDeleted}
          isOwnProfile={currentUser && selectedPost.author._id === currentUser._id}
        />
      )}
      {postToEdit && (
        <PostModal
          post={postToEdit}
          onClose={() => setPostToEdit(null)}
          currentUser={currentUser}
          onPostUpdate={handlePostUpdate}
          onPostDeleted={handlePostDeleted}
          onEditRequest={handleEditRequest}
          isEditingDefault={true}
          isFavorite={postToEdit.isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
      {sharePostId && !shareToMessagesOpen && (
        <div className={styles.shareModalOverlay} onClick={() => setSharePostId(null)}>
          <div className={styles.shareModal} onClick={e => e.stopPropagation()}>
            <h3>{t('share_post', 'Поделиться постом')}</h3>
            <input
              type="text"
              value={window.location.origin + '/post/' + sharePostId}
              readOnly
              className={styles.shareInput}
              onFocus={e => e.target.select()}
            />
            <button onClick={() => handleCopyLink(sharePostId)} className={styles.copyButton}>
              {copied ? t('copied', 'Скопировано!') : t('copy_link', 'Скопировать ссылку')}
            </button>
            <button onClick={() => setShareToMessagesOpen(true)} className={styles.copyButton}>
              {t('send_to_messages', 'Отправить в сообщения')}
            </button>
            <button onClick={() => setSharePostId(null)} className={styles.closeShareModal}>{t('close')}</button>
          </div>
        </div>
      )}
      {shareToMessagesOpen && sharePostId && (
        <ShareToMessagesModal
          postId={sharePostId}
          postUrl={window.location.origin + '/post/' + sharePostId}
          onClose={() => { setShareToMessagesOpen(false); setSharePostId(null); }}
        />
      )}
    </div>
  );
};

export default Feed; 