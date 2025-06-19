import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../config/constants';

export const fetchChats = createAsyncThunk('messages/fetchChats', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Ошибка загрузки чатов');
    return await res.json();
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

export const fetchMessages = createAsyncThunk('messages/fetchMessages', async (chatId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/messages/conversations/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Ошибка загрузки сообщений');
    return await res.json();
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

export const sendMessage = createAsyncThunk('messages/sendMessage', async ({ chatId, text }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/messages/conversations/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Ошибка отправки сообщения');
    return await res.json();
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

export const startConversation = createAsyncThunk(
  'messages/startConversation',
  async (participantId, { getState, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const state = getState();
      const user = state.auth.user;
      const myId = user?._id || user?.id;
      if (!myId) throw new Error('Не найден id текущего пользователя');
      const res = await fetch(`${API_URL}/api/messages/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantIds: [myId, participantId] }),
      });
      if (!res.ok) throw new Error('Ошибка создания чата');
      return await res.json();
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const deleteConversation = createAsyncThunk('messages/deleteConversation', async (chatId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/messages/conversations/${chatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Ошибка удаления беседы');
    return { chatId };
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

export const markMessagesAsRead = createAsyncThunk('messages/markMessagesAsRead', async (chatId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/messages/conversations/${chatId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Ошибка при отметке сообщений как прочитанных');
    return await res.json();
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

const messagesSlice = createSlice({
  name: 'messages',
  initialState: {
    chats: [],
    messages: {}, // { [chatId]: [messages] }
    loadingChats: false,
    loadingMessages: false,
    sending: false,
    error: null,
    selectedChatId: null,
    unreadCount: 0,
    myId: null,
  },
  reducers: {
    setSelectedChatId(state, action) {
      state.selectedChatId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loadingChats = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loadingChats = false;
        state.chats = action.payload;
        state.unreadCount = action.payload.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loadingChats = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        const chatId = action.meta.arg;
        state.messages[chatId] = action.payload;
        const myId = state.myId || (state.chats[0]?.participants?.find?.(p => p._id) ? state.chats[0].participants.find(p => p._id !== undefined)._id : null);
        let unread = 0;
        Object.values(state.messages).forEach(msgArr => {
          msgArr.forEach(msg => {
            if (msg.read === false && msg.senderId !== myId) unread++;
          });
        });
        state.unreadCount = unread;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        const chatId = action.meta.arg.chatId;
        if (!state.messages[chatId]) state.messages[chatId] = [];
        state.messages[chatId].push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        const chat = action.payload;
        if (chat && chat._id) {
          state.selectedChatId = chat._id;
          if (!state.chats.find(c => c._id === chat._id)) {
            state.chats.push(chat);
          }
        }
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        const chatId = action.payload.chatId;
        state.chats = state.chats.filter(chat => chat._id !== chatId);
        if (state.selectedChatId === chatId) {
          state.selectedChatId = null;
        }
        delete state.messages[chatId];
      });
  },
});

export const { setSelectedChatId } = messagesSlice.actions;

export const getUnreadMessagesCount = (state) => state.messages.unreadCount;

export default messagesSlice.reducer; 