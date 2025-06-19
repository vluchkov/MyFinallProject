import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setAuthFromToken, checkAuth } from './Redux/authSlice';
import { THEMES } from './Redux/themeSlice';
import { fetchNotifications } from './Redux/notificationSlice';
import { closeCreatePostModal } from './Redux/createPostModalSlice';

import Login from './components/Login/Login';
import Register from './components/Registration/Registration';
import FeedComponent from './components/Feed/Feed';
import Sidebar from './components/Sidebar/Sidebar';
import Profile from './components/Profile/Profile';
import CreatePost from './components/CreatePost/CreatePost';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import ResetPassword from './components/ResetPassword/ResetPassword';
import UserSearch from './components/Search/UserSearch';
import Notifications from './components/notifications/Notifications';
import Explore from './components/Explore/Explore';
import ChangePassword from './components/ChangePassword/ChangePassword';
import MessagesPage from './components/Messages/MessagesPage';
import styles from './App.module.css';
import HeaderControls from './components/HeaderControls';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/feed'} replace />;
  }

  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  const currentTheme = useSelector(state => state.theme.currentTheme);
  
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const location = useLocation();
  const isCreatePostModalOpen = useSelector(state => state.createPostModal.isCreatePostModalOpen);

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, loading });
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    console.log('Modal state:', { isCreatePostModalOpen });
  }, [isCreatePostModalOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const toggleSearchPanel = () => {
    setIsSearchPanelOpen(!isSearchPanelOpen);
  };

  const closeSearchPanel = () => {
    setIsSearchPanelOpen(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  const appClassName = `${styles.app} ${currentTheme === THEMES.DARK ? styles.themeDark : styles.themeLight}`;

  console.log('App component RENDERED, isAuthenticated:', isAuthenticated, 'Current Path:', location.pathname);
  return (
    <div className={appClassName}>
      <HeaderControls />
      {isAuthenticated && <UserSearch isOpen={isSearchPanelOpen} onClose={closeSearchPanel} />}
      {isAuthenticated ? (
        <>
          <Sidebar onToggleSearch={toggleSearchPanel} onAnyNav={closeSearchPanel} />
          <div className={styles.mainContent}>
            <Routes>
              <Route path="/" element={<FeedComponent exploreMode={false} />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route 
                path="/settings/change-password" 
                element={
                  <PrivateRoute>
                    <ChangePassword />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          {isCreatePostModalOpen && <CreatePost onClose={() => dispatch(closeCreatePostModal())} />}
        </>
      ) : (
        console.log('App: Rendering for unauthenticated user'),
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
