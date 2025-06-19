import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats, sendMessage, startConversation } from '../../Redux/messagesSlice';
import UserSearch from '../Search/UserSearch';
import styles from './Feed.module.css';
import { useTranslations } from '../../hooks/useTranslations';

const ShareToMessagesModal = ({ postId, onClose, postUrl }) => {
  const dispatch = useDispatch();
  const { t } = useTranslations();
  const chats = useSelector(state => state.messages.chats);
  const currentUser = useSelector(state => state.auth.user);
  const [selectedChats, setSelectedChats] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const handleChatToggle = (chatId) => {
    setSelectedChats(prev =>
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
  };

  const handleUserSelect = (user) => {
    if (!user || !user._id) return;
    setSelectedUsers(prev =>
      prev.find(u => u._id === user._id) ? prev : [...prev, user]
    );
    setIsUserSearchOpen(false);
  };

  const handleUserRemove = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleSend = async () => {
    setSending(true);
    try {
      // Отправляем в выбранные чаты
      for (const chatId of selectedChats) {
        await dispatch(sendMessage({ chatId, text: postUrl })).unwrap();
      }
      // Для выбранных пользователей (без чата) — создаём чат и отправляем
      for (const user of selectedUsers) {
        const result = await dispatch(startConversation(user._id));
        const chat = result.payload;
        if (chat && chat._id) {
          await dispatch(sendMessage({ chatId: chat._id, text: postUrl })).unwrap();
        }
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      alert(t('send_error', 'Ошибка при отправке') + ': ' + (e.message || e));
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = () => {
    setConfirmOpen(true);
  };
  const handleCancelConfirm = () => {
    setConfirmOpen(false);
  };
  const handleConfirmSend = () => {
    setConfirmOpen(false);
    handleSend();
  };

  return (
    <div className={styles.shareModalOverlay} onClick={onClose}>
      <div className={styles.shareModal} onClick={e => e.stopPropagation()}>
        <h3>{t('send_post_to_messages', 'Отправить пост в сообщения')}</h3>
        <div className={styles.shareChatsList}>
          <div className={styles.shareChatsHeader}>{t('your_chats', 'Ваши чаты')}:</div>
          <div className={styles.shareChatsScroll}>
            {chats.map(chat => {
              const other = chat.participants?.find(p => p._id !== currentUser._id) || chat.participants?.[0] || {};
              return (
                <label key={chat._id} className={styles.shareChatItem}>
                  <input
                    type="checkbox"
                    checked={selectedChats.includes(chat._id)}
                    onChange={() => handleChatToggle(chat._id)}
                  />
                  <img src={other.avatar} alt={other.username} className={styles.shareChatAvatar} />
                  <span>{other.username || t('user', 'Пользователь')}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className={styles.shareUsersSection}>
          <div className={styles.shareChatsHeader}>{t('or_find_user', 'Или найдите пользователя')}:</div>
          <button className={styles.copyButton} onClick={() => setIsUserSearchOpen(true)}>
            {t('search_user', 'Поиск пользователя')}
          </button>
          {selectedUsers.length > 0 && (
            <div className={styles.selectedUsersList}>
              {selectedUsers.map(user => (
                <span key={user._id} className={styles.selectedUser}>
                  {user.username}
                  <button onClick={() => handleUserRemove(user._id)} style={{marginLeft: 4, color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer'}}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          className={styles.copyButton}
          onClick={handleConfirm}
          disabled={sending || (selectedChats.length === 0 && selectedUsers.length === 0)}
        >
          {sending ? t('sending', 'Отправка...') : t('send', 'Отправить')}
        </button>
        {success && <div style={{color: '#1db954', fontWeight: 600}}>{t('sent_successfully', 'Успешно отправлено!')}</div>}
        <button onClick={onClose} className={styles.closeShareModal}>{t('close')}</button>
        {isUserSearchOpen && (
          <UserSearch isOpen={isUserSearchOpen} onClose={() => setIsUserSearchOpen(false)} onUserSelect={handleUserSelect} />
        )}
        {confirmOpen && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <div style={{marginBottom: 16}}>{t('confirm_send_post_link', 'Вы уверены, что хотите отправить ссылку на пост выбранным пользователям?')}</div>
              <button className={styles.copyButton} onClick={handleConfirmSend}>{t('yes_send', 'Да, отправить')}</button>
              <button className={styles.closeShareModal} onClick={handleCancelConfirm}>{t('cancel')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareToMessagesModal; 