import React from 'react';
import { useSelector } from 'react-redux';
import styles from './Messages.module.css';
import { DEFAULT_AVATAR } from '../../config/constants';
import { Link } from 'react-router-dom';

const MessageBubble = ({ message }) => {
  const currentUser = useSelector(state => state.auth.user);
  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwn = message.senderId === currentUserId;
  const avatar = isOwn ? (currentUser.avatar || DEFAULT_AVATAR) : (message.sender?.avatar || DEFAULT_AVATAR);
  const username = isOwn ? (currentUser.fullName || currentUser.username) : (message.sender?.fullName || message.sender?.username);
  const usertag = isOwn ? currentUser.username : message.sender?.username;
  return (
    <div className={`${styles.messageBubble} ${isOwn ? styles.own : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <Link to={`/profile/${usertag}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src={avatar}
            alt={usertag}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }}
            onError={e => { e.target.src = DEFAULT_AVATAR; }}
          />
          <span style={{ fontWeight: 600, color: '#444', fontSize: 14 }}>{username}</span>
          <span style={{ color: '#888', fontSize: 13, marginLeft: 6 }}>@{usertag}</span>
        </Link>
      </div>
      <div className={styles.messageText}>{message.text}</div>
      <div className={styles.messageTime}>{new Date(message.createdAt).toLocaleTimeString()}</div>
    </div>
  );
};

export default MessageBubble; 