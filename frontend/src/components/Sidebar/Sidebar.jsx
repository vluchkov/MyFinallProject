import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/authSlice';
import { useTranslations } from '../../hooks/useTranslations';
import styles from './Sidebar.module.css';
import ICHGRAM2 from "../../assets/ICHGRA2.png";
import { getUnreadNotificationsCount } from '../../Redux/notificationSlice';
import { getUnreadMessagesCount } from '../../Redux/messagesSlice';
import { openCreatePostModal } from '../../Redux/createPostModalSlice';

// Импорт PNG иконок
import homeIcon from "../../../png/home.png"
import searchIcon from '../../../png/search.png';
import likeIcon from '../../../png/like.png'; // Для уведомлений (сердце)
import expIcon from '../../../png/exp.png'; // Заглушка для Избранного (нет прямой иконки закладки)
import createIcon from '../../../png/create.png';
import profileIcon from '../../../png/profile.png';
import messagesIcon from '../../../png/send.png';


const Sidebar = ({ onToggleSearch, onAnyNav }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(state => state.auth.user);
  const unreadNotificationsCount = useSelector(getUnreadNotificationsCount);
  const unreadMessagesCount = useSelector(getUnreadMessagesCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslations();
  

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsMenuOpen(false);
  };

  const handleActivity = () => {
    navigate('/activity');
    setIsMenuOpen(false);
  };

  const handleSwitchAppearance = () => {
    navigate('/settings');
    setIsMenuOpen(false);
  };

  const handleReportProblem = () => {
    setIsReportModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleSaved = () => {
    navigate('/favorites');
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    if (path.startsWith('/profile/') && location.pathname.startsWith('/profile/')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Link to="/" className={styles.logo} onClick={onAnyNav}>
          <img src={ICHGRAM2} alt="Инстаграм" className={styles.instagramLogo} />
        </Link>
      </div>

      <nav className={styles.sidebarNav}>
        <Link to="/" className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`} onClick={onAnyNav}>
          <div className={styles.navIcon}>
            <img src={homeIcon} alt={t('home')} />
          </div>
          <span className={styles.navTitle}>{t('home')}</span>
        </Link>

        <div 
          className={`${styles.navItem} ${styles.searchButton}`}
          onClick={onToggleSearch}
        >
          <div className={styles.navIcon}>
            <img src={searchIcon} alt={t('search')} />
          </div>
          <span className={styles.navTitle}>{t('search')}</span>
        </div>

        <Link to="/explore" className={`${styles.navItem} ${isActive('/explore') ? styles.active : ''}`} onClick={onAnyNav}>
          <div className={styles.navIcon}>
            <img src={expIcon} alt={t('explore')} />
          </div>
          <span className={styles.navTitle}>{t('explore')}</span>
        </Link>

        <Link to="/messages" className={`${styles.navItem} ${isActive('/messages') ? styles.active : ''}`} onClick={onAnyNav}>
          <div className={styles.navIconContainer}>
            <div className={styles.navIcon}>
              <img src={messagesIcon} alt={t('messages')} />
            </div>
            {unreadMessagesCount > 0 && (
              <span className={styles.notificationBadge}>{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
            )}
          </div>
          <span className={styles.navTitle}>{t('messages')}</span>
        </Link>

        <Link to="/notifications" className={`${styles.navItem} ${isActive('/notifications') ? styles.active : ''}`} onClick={onAnyNav}>
          <div className={styles.navIconContainer}>
            <div className={styles.navIcon}>
              <img src={likeIcon} alt={t('notifications')} />
            </div>
            {unreadNotificationsCount > 0 && (
              <span className={styles.notificationBadge}>{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</span>
            )}
          </div>
          <span className={styles.navTitle}>{t('notifications')}</span>
        </Link>

        <div
          className={`${styles.navItem}`}
          onClick={() => dispatch(openCreatePostModal())}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.navIcon}>
            <img src={createIcon} alt={t('create_post')} />
          </div>
          <span className={styles.navTitle}>{t('create_post')}</span>
        </div>

        {user && (
          <Link to={`/profile/${user.username}`} className={`${styles.navItem} ${isActive(`/profile/${user.username}`) ? styles.active : ''}`} onClick={onAnyNav}>
            <div className={styles.navIcon}>
              <img src={profileIcon} alt={t('profile')} />
            </div>
            <span className={styles.navTitle}>{t('profile')}</span>
          </Link>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;