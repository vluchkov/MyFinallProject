import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslations } from '../../hooks/useTranslations';
import { sendMessage, fetchMessages } from '../../Redux/messageSlice';
import styles from './Messages.module.css';

const Messages = ({ recipientId }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslations();
  const messages = useSelector(state => state.messages.messages);
  const currentUser = useSelector(state => state.auth.user);

  useEffect(() => {
    if (recipientId) {
      dispatch(fetchMessages(recipientId));
    }
  }, [dispatch, recipientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError(t('message_cannot_be_empty'));
      return;
    }

    setLoading(true);
    try {
      await dispatch(sendMessage({ recipientId, content: message })).unwrap();
      setMessage('');
      setError('');
    } catch (err) {
      setError(t('cannot_send_message'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.messagesContainer}>
      <div className={styles.messagesList}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${
              msg.senderId === currentUser.id ? styles.sent : styles.received
            }`}
          >
            <div className={styles.messageContent}>{msg.content}</div>
            <div className={styles.messageTime}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className={styles.messageForm}>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('type_message')}
            className={styles.messageInput}
          />
          <button type="submit" disabled={loading} className={styles.sendButton}>
            {loading ? t('sending') : t('send')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Messages; 