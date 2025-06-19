import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styles from './EditProfileModal.module.css';
import { DEFAULT_AVATAR } from '../../config/constants';
import { useTranslations } from '../../hooks/useTranslations';

const EditProfileModal = ({ profile, onClose, onSave }) => {
  const { t } = useTranslations();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
    website: '',
    email: '',
    phone: '',
    avatar: null
  });
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        website: profile.website || '',
        email: profile.email || '',
        phone: profile.phone || '',
        avatar: null
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          avatar: t('file_size_limit_exceeded', 'Превышен лимит размера файла')
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, avatar: file }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) {
      newErrors.username = t('username_required', 'Имя пользователя обязательно');
    }
    if (!formData.email) {
      newErrors.email = t('email_required', 'Email обязателен');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('invalid_email', 'Неверный формат email');
    }
    if (formData.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.website)) {
      newErrors.website = t('invalid_url_format', 'Неверный формат URL');
    }
    if (formData.phone && !/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = t('invalid_phone_format', 'Неверный формат телефона');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{t('edit_profile', 'Редактировать профиль')}</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.avatarSection}>
            <img
              src={previewAvatar || profile?.avatar || DEFAULT_AVATAR}
              alt={t('avatar_preview', 'Предпросмотр аватара')}
              className={styles.avatarPreview}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              id="avatar-input"
              className={styles.avatarInput}
            />
            <label htmlFor="avatar-input" className={styles.avatarLabel}>
              {t('change_profile_photo', 'Изменить фото профиля')}
            </label>
            {errors.avatar && <div className={styles.errorMessage}>{errors.avatar}</div>}
          </div>

          <div className={styles.inputGroup}>
            <label>{t('fullName', 'Полное имя')}</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder={t('fullName', 'Полное имя')}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('username', 'Имя пользователя')}</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t('username', 'Имя пользователя')}
              className={`${styles.input} ${errors.username ? styles.error : ''}`}
              required
            />
            {errors.username && <div className={styles.errorMessage}>{errors.username}</div>}
          </div>

          <div className={styles.inputGroup}>
            <label>{t('bio', 'О себе')}</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder={t('bio', 'О себе')}
              className={styles.textarea}
              rows="3"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('website', 'Веб-сайт')}</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder={t('website', 'Веб-сайт')}
              className={`${styles.input} ${errors.website ? styles.error : ''}`}
            />
            {errors.website && <div className={styles.errorMessage}>{errors.website}</div>}
          </div>

          <div className={styles.inputGroup}>
            <label>{t('email', 'Email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('email', 'Email')}
              className={`${styles.input} ${errors.email ? styles.error : ''}`}
              required
            />
            {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
          </div>

          <div className={styles.inputGroup}>
            <label>{t('phone', 'Телефон')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('phone', 'Телефон')}
              className={`${styles.input} ${errors.phone ? styles.error : ''}`}
            />
            {errors.phone && <div className={styles.errorMessage}>{errors.phone}</div>}
          </div>

          {errors.submit && <div className={styles.errorMessage}>{errors.submit}</div>}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              {t('cancel', 'Отмена')}
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? t('saving', 'Сохранение...') : t('save', 'Сохранить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal; 