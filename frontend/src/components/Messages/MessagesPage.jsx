import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NewChatModal from './NewChatModal';
import styles from './Messages.module.css';
import { fetchChats, fetchMessages } from '../../Redux/messagesSlice';

const MessagesPage = () => {
  const dispatch = useDispatch();
  const selectedChatId = useSelector(state => state.messages.selectedChatId);
  const chats = useSelector(state => state.messages.chats);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  useEffect(() => {
    if (selectedChatId) {
      dispatch(fetchMessages(selectedChatId));
    }
  }, [dispatch, selectedChatId]);

  const handleNewChatClick = () => {
    setIsNewChatModalOpen(true);
  };

  const handleCloseNewChatModal = () => {
    setIsNewChatModalOpen(false);
  };

  return (
    <div className={styles.messagesWrapper}>
      <ChatList onNewChatClick={handleNewChatClick} />
      <ChatWindow />
      <NewChatModal 
        isOpen={isNewChatModalOpen} 
        onClose={handleCloseNewChatModal} 
      />
    </div>
  );
};

export default MessagesPage; 