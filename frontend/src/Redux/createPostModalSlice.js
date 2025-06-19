import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isCreatePostModalOpen: false
};

const createPostModalSlice = createSlice({
  name: 'createPostModal',
  initialState,
  reducers: {
    openCreatePostModal: (state) => {
      state.isCreatePostModalOpen = true;
    },
    closeCreatePostModal: (state) => {
      state.isCreatePostModalOpen = false;
    }
  }
});

export const { openCreatePostModal, closeCreatePostModal } = createPostModalSlice.actions;
export default createPostModalSlice.reducer; 