import React, { useState } from 'react';
import styles from './Messages.module.css';

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form className={styles.messageInputForm} onSubmit={handleSubmit}>
      <input
        className={styles.messageInput}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Напишите сообщение..."
      />
      <button type="submit" className={styles.sendButton}>Отправить</button>
    </form>
  );
};

export default MessageInput; 