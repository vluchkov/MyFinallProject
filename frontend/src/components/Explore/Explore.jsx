import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslations } from '../../hooks/useTranslations';
import styles from './Explore.module.css';
import ExploreFeed from './ExploreFeed';

const Explore = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = useSelector(state => state.auth.user);
  const { t } = useTranslations();

  useEffect(() => {
    setLoading(false);
  }, [currentUser]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          {t('loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      <ExploreFeed />
    </div>
  );
});

Explore.displayName = 'Explore';

export default Explore;
