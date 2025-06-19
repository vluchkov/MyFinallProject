import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import NewChatModal from './NewChatModal';
import styles from './Messages.module.css';
import { sendMessage, fetchMessages, startConversation, fetchChats, markMessagesAsRead } from '../../Redux/messagesSlice';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../../config/constants';
import { useTranslations } from '../../hooks/useTranslations';

const ChatWindow = () => {
  const dispatch = useDispatch();
  const { t } = useTranslations();
  const selectedChatId = useSelector(state => state.messages.selectedChatId);
  const messages = useSelector(state => state.messages.messages[selectedChatId] || []);
  const loading = useSelector(state => state.messages.loadingMessages);
  const messagesEndRef = useRef(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const chats = useSelector(state => state.messages.chats);
  const currentUser = useSelector(state => state.auth.user);
  const myId = currentUser?._id || currentUser?.id;

  let otherUser = null;
  if (selectedChatId && chats.length > 0) {
    const chat = chats.find(c => c._id === selectedChatId);
    if (chat && chat.participants) {
      otherUser = chat.participants.find(p => p._id !== myId) || chat.participants[0];
    }
  }
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedChatId) {
      dispatch(fetchMessages(selectedChatId)).then(() => {
        // После загрузки сообщений обновляем список чатов (и счетчик)
        dispatch(fetchChats());
        // Отмечаем сообщения как прочитанные
        dispatch(markMessagesAsRead(selectedChatId));
      });
    }
  }, [dispatch, selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    if (selectedChatId && text.trim()) {
      dispatch(sendMessage({ chatId: selectedChatId, text }));
    }
  };

  const handleNewChatClick = () => {
    setIsNewChatModalOpen(true);
  };

  const handleCloseNewChatModal = () => {
    setIsNewChatModalOpen(false);
  };

  if (!selectedChatId) {
    return (
      <div className={styles.chatWindowEmpty}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{marginBottom: 24}}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" stroke="#bbb" strokeWidth="4" fill="none" />
              <path d="M40 25C32.268 25 26 31.268 26 39C26 46.732 32.268 53 40 53C47.732 53 54 46.732 54 39C54 31.268 47.732 25 40 25ZM40 49C34.477 49 30 44.523 30 39C30 33.477 34.477 29 40 29C45.523 29 50 33.477 50 39C50 44.523 45.523 49 40 49Z" fill="#bbb"/>
              <circle cx="40" cy="39" r="6" fill="#bbb"/>
            </svg>
          </div>
          <h2 style={{fontWeight: 600, fontSize: 22, marginBottom: 8}}>{t('empty_chat_title')}</h2>
          <div style={{color: '#888', marginBottom: 24, textAlign: 'center', maxWidth: 320}}>
            {t('empty_chat_subtitle')}
          </div>
          <button 
            style={{
              background: '#7b61ff', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              padding: '12px 24px', 
              fontWeight: 600, 
              fontSize: 16, 
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#5a43c2'}
            onMouseOut={(e) => e.target.style.background = '#7b61ff'}
            onClick={handleNewChatClick}
          >
            {t('empty_chat_button')}
          </button>
        </div>
        <NewChatModal 
          isOpen={isNewChatModalOpen} 
          onClose={handleCloseNewChatModal} 
        />
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      {otherUser && (
        <div className={styles.chatHeader}>
          <img
            src={otherUser.avatar || DEFAULT_AVATAR}
            alt={otherUser.username}
            className={styles.chatHeaderAvatar}
            onError={e => { e.target.src = DEFAULT_AVATAR; }}
          />
          <div className={styles.chatHeaderInfo}>
            <div className={styles.chatHeaderName}>{otherUser.fullName || otherUser.username}</div>
            <div className={styles.chatHeaderUsername}>@{otherUser.username}</div>
            <button className={styles.chatHeaderProfileBtn} onClick={() => navigate(`/profile/${otherUser.username}`)}>
              Посмотреть профиль
            </button>
          </div>
          <button 
            onClick={handleNewChatClick}
            className={styles.newChatButton}
            title={t('new_message')}
            style={{ marginLeft: 'auto' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>
      )}
      <div className={styles.messagesList}>
        {loading ? <div>{t('loading')}</div> : messages.map(msg => (
          <MessageBubble key={msg._id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSend={handleSend} />
      <NewChatModal 
        isOpen={isNewChatModalOpen} 
        onClose={handleCloseNewChatModal} 
      />
    </div>
  );
};

export default ChatWindow; 