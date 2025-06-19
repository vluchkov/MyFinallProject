import React from 'react';
import ReactPlayer from 'react-player/lazy';
import styles from './PostGridItem.module.css';
import { API_URL, DEFAULT_POST_IMAGE } from '../../config/constants';

const PostGridItem = ({ post, onClick }) => {
  if (!post) return null;

  const postMediaSrc = post.imageUrl
    ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${API_URL}${post.imageUrl}`)
    : (post.videoUrl && !post.videoUrl.startsWith('http') ? `${API_URL}${post.videoUrl}` : post.videoUrl);

  const handleVideoClick = (e) => {
    console.log('[PostGridItem] Video clicked:', post._id, post.mediaType);
    e.preventDefault();
    e.stopPropagation();
    onClick(post);
  };

  const handleContainerClick = () => {
    console.log('[PostGridItem] Container clicked:', post._id, post.mediaType);
    onClick(post);
  };

  return (
    <div className={styles.postGridItem} onClick={handleContainerClick}>
      {post.mediaType === 'video' ? (
        <div className={styles.videoThumbnailContainer} onClick={handleVideoClick}>
          <ReactPlayer
            url={postMediaSrc}
            light={true} // Shows thumbnail until play
            playIcon={<span className={styles.playIcon}>▶</span>}
            width='100%'
            height='100%'
            className={styles.videoPlayer}
            onClick={handleVideoClick}
            config={{
              file: {
                attributes: {
                  onClick: handleVideoClick
                }
              }
            }}
          />
        </div>
      ) : (
        <img
          src={postMediaSrc || DEFAULT_POST_IMAGE}
          alt="Post"
          className={styles.postImage}
          onError={(e) => { e.target.src = DEFAULT_POST_IMAGE; }}
        />
      )}
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          <div className={styles.overlayStat}>
            <span className={styles.heartIcon}>❤️</span>
            <span>{post.likes ? post.likes.length : 0}</span>
          </div>
          <div className={styles.overlayStat}>
            <span className={styles.commentIcon}>💬</span>
            <span>{post.comments ? post.comments.length : 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostGridItem; 