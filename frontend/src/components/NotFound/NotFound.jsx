import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import styles from './NotFound.module.css';

const NotFound = () => {
  const { t } = useTranslations();
  
  return (
    <div className={styles.notFoundContainer}>
      <h1>404</h1>
      <h2>{t('page_not_found', 'Страница не найдена')}</h2>
      <p>{t('page_not_found_message', 'Извините, страница не найдена или была удалена.')}</p>
      <Link to="/" className={styles.homeLink}>
        {t('back_to_home', 'Вернуться на главную')}
      </Link>
    </div>
  );
};

export default NotFound; 