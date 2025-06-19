import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updatePost } from '../../Redux/postSlice';
import styles from './EditPostModal.module.css';

const EditPostModal = ({ post, onClose }) => {
  const [caption, setCaption] = useState(post.caption || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(updatePost({ id: post.id, caption })).unwrap();
      onClose();
    } catch (err) {
      setError('Не удалось отредактировать публикацию');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Редактировать публикацию</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Напишите подпись..."
              className={styles.captionInput}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal; 