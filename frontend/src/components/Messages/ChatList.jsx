import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslations } from '../../hooks/useTranslations';
import styles from './Messages.module.css';
import { setSelectedChatId, deleteConversation } from '../../Redux/messagesSlice';
import { DEFAULT_AVATAR } from '../../config/constants';

const ChatList = ({ onNewChatClick }) => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.messages.chats);
  const selectedChatId = useSelector(state => state.messages.selectedChatId);
  const currentUser = useSelector(state => state.auth.user);
  const myId = currentUser?._id || currentUser?.id;
  const [menuOpenId, setMenuOpenId] = useState(null);
  const { t } = useTranslations();

  const handleDelete = async (chatId) => {
    if (window.confirm(t('delete_conversation_confirm'))) {
      await dispatch(deleteConversation(chatId));
      setMenuOpenId(null);
    }
  };

  return (
    <div className={styles.chatList}>
      {/* Header with New Chat Button */}
      <div className={styles.chatListHeader}>
        <h3 className={styles.chatListTitle}>{t('messages')}</h3>
        <button 
          onClick={onNewChatClick}
          className={styles.newChatButton}
          title={t('new_message')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>

      {/* Chat List */}
      {chats.length === 0 ? (
        <div className={styles.emptyChatList}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className={styles.emptyText}>{t('no_conversations')}</p>
          <button 
            onClick={onNewChatClick}
            className={styles.startChatButton}
          >
            {t('start_conversation')}
          </button>
        </div>
      ) : (
        chats.map(chat => {
          const other = chat.participants?.find(p => p._id !== myId) || chat.participants?.[0] || {};
          return (
            <div
              key={chat._id}
              className={`${styles.chatListItem} ${selectedChatId === chat._id ? styles.selected : ''}`}
              onClick={() => dispatch(setSelectedChatId(chat._id))}
              style={{ position: 'relative' }}
            >
              <img src={other.avatar || DEFAULT_AVATAR} alt={other.username} className={styles.avatar} />
              <div>
                <div className={styles.username}>{other.username || t('user')}</div>
                <div className={styles.lastMessage}>{chat.lastMessage}</div>
              </div>
              <button
                className={styles.menuButton}
                onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === chat._id ? null : chat._id); }}
                style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
              >
                ⋮
              </button>
              {menuOpenId === chat._id && (
                <div className={styles.menuDropdown} style={{ position: 'absolute', right: 8, top: 32, background: '#fff', border: '1px solid #eee', borderRadius: 6, zIndex: 10 }}>
                  <button
                    className={styles.menuItem}
                    onClick={e => { e.stopPropagation(); handleDelete(chat._id); }}
                    style={{ color: 'red', background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', width: '100%' }}
                  >
                    {t('delete')}
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatList; 