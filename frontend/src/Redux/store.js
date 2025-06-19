import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import forgotPasswordReducer from "./forgotPasswordSlice";
import resetPasswordReducer from "./resetPasswordSlice";
import profileReducer from "./profileSlice";
import postReducer from "./postSlice";
import notificationReducer from "./notificationSlice";
import themeReducer from "./themeSlice";
import changePasswordReducer from "./changePasswordSlice";
import createPostModalReducer from "./createPostModalSlice";
import messagesReducer from './messagesSlice';
import languageReducer from './languageSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    forgotPassword: forgotPasswordReducer,
    resetPassword: resetPasswordReducer,
    profile: profileReducer,
    posts: postReducer,
    notifications: notificationReducer,
    theme: themeReducer,
    changePassword: changePasswordReducer,
    createPostModal: createPostModalReducer,
    messages: messagesReducer,
    language: languageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
