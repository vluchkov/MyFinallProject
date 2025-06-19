import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ message }) => {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message || 'Загрузка...'}</p>
    </div>
  );
};

export default LoadingSpinner; 