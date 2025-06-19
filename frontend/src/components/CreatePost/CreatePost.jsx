import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import { useTranslations } from '../../hooks/useTranslations';
import styles from './CreatePost.module.css';
import ReactPlayer from 'react-player/lazy';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { fetchUserProfile } from '../../Redux/profileSlice';

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
const normalizeYoutubeLink = (link) => {
  if (/^(https?:)?\/\//i.test(link)) {
    return link;
  }
  return 'https://' + link;
};

function cleanYoutubeUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      // https://youtu.be/VIDEO_ID
      return `https://youtu.be/${u.pathname.replace('/', '')}`;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) {
        return `https://www.youtube.com/watch?v=${v}`;
      }
    }
    return url;
  } catch {
    return url;
  }
}

const CreatePost = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.auth.user);
  const { t } = useTranslations();
  const [step, setStep] = useState(1); // 1: выбор, 2: crop, 3: фильтр, 4: описание
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [filteredImage, setFilteredImage] = useState(null);
  const [videoLink, setVideoLink] = useState('');
  const [isValidYoutube, setIsValidYoutube] = useState(false);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image', 'video', 'youtube'
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [crop, setCrop] = useState();
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [appliedFilter, setAppliedFilter] = useState('normal');
  const imgRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [cropAspect, setCropAspect] = useState(1); // 1:1 по умолчанию
  const cropPresets = [
    { label: t('square', 'Квадрат'), value: 1 },
    { label: t('vertical_4_5', 'Вертикальный 4:5'), value: 4/5 },
    { label: t('horizontal_16_9', 'Горизонтальный 16:9'), value: 16/9 }
  ];
  const [originalImage, setOriginalImage] = useState(null);

  useEffect(() => {
    if (file) {
      setStep(2);
    }
  }, [file]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        setVideoLink('');
        setIsValidYoutube(false);
        setMediaType('image');
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(droppedFile);
      }
    }
  };

  // --- Первый шаг: выбор файла или ссылки ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) return; // Только изображения
      setFile(selectedFile);
      setVideoLink('');
      setIsValidYoutube(false);
      setMediaType('image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setOriginalImage(reader.result); // сохраняем оригинал
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  const handleVideoLinkChange = (e) => {
    let val = e.target.value.trim();
    setVideoLink(val);
    setFile(null);
    setPreview(null);
    setMediaType('youtube');
    setIsValidYoutube(YOUTUBE_REGEX.test(val));
  };
  const clearAll = () => {
    setFile(null);
    setImage(null);
    setProcessedImage(null);
    setVideoLink('');
    setIsValidYoutube(false);
    setPreview(null);
    setMediaType(null);
    setContent('');
    setStep(1);
    setError(null);
  };

  // --- Crop ---
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, cropAspect, width, height),
      width, height
    );
    setCrop(crop);
  };

  const handleAspectChange = (aspect) => {
    setCropAspect(aspect);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const crop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
        width, height
      );
      setCrop(crop);
    }
  };

  const handleCropComplete = () => {
    if (originalImage && crop?.width && crop?.height) {
      const image = new window.Image();
      image.src = originalImage;
      image.onload = () => {
        let sx = crop.x, sy = crop.y, sw = crop.width, sh = crop.height;
        if (crop.unit === '%') {
          sx = (crop.x / 100) * image.naturalWidth;
          sy = (crop.y / 100) * image.naturalHeight;
          sw = (crop.width / 100) * image.naturalWidth;
          sh = (crop.height / 100) * image.naturalHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
        const croppedDataUrl = canvas.toDataURL('image/jpeg');
        setPreview(croppedDataUrl);
        setFilteredImage(null);
        setCrop(undefined);
        setStep(3);
      };
    } else {
      setStep(3);
    }
  };

  // --- Фильтры ---
  const filters = [
    { name: 'normal', label: t('original', 'Оригинал') },
    { name: 'grayscale', label: t('black_white', 'Черно-белый') },
    { name: 'sepia', label: t('sepia', 'Сепия') },
    { name: 'invert', label: t('invert', 'Инверсия') },
    { name: 'brightness', label: t('brightness', 'Яркость') },
    { name: 'contrast', label: t('contrast', 'Контраст') },
    { name: 'blur', label: t('blur', 'Размытие') },
    { name: 'saturate', label: t('saturate', 'Насыщенность') },
    { name: 'retro', label: t('retro', 'Ретро') },
    { name: 'vignette', label: t('vignette', 'Виньетка') },
    { name: 'warm', label: t('warm', 'Теплый') },
    { name: 'cold', label: t('cold', 'Холодный') }
  ];
  const getFilterStyle = (filterName) => {
    switch (filterName) {
      case 'grayscale': return { filter: 'grayscale(1)' };
      case 'sepia': return { filter: 'sepia(0.8)' };
      case 'invert': return { filter: 'invert(1)' };
      case 'brightness': return { filter: 'brightness(1.3)' };
      case 'contrast': return { filter: 'contrast(1.5)' };
      case 'blur': return { filter: 'blur(2px)' };
      case 'saturate': return { filter: 'saturate(2)' };
      case 'retro': return { filter: 'sepia(0.5) contrast(1.2) brightness(0.9)' };
      case 'vignette': return { filter: 'brightness(0.9) drop-shadow(0 0 30px #0008)' };
      case 'warm': return { filter: 'sepia(0.2) saturate(1.5) brightness(1.1) hue-rotate(-10deg)' };
      case 'cold': return { filter: 'saturate(0.8) hue-rotate(30deg) brightness(1.1)' };
      default: return {};
    }
  };
  const handleFilterSelect = (filterName) => {
    setSelectedFilter(filterName);
    if (preview) {
      const img = new Image();
      img.src = preview;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.filter = getFilterStyle(filterName).filter;
        ctx.drawImage(img, 0, 0);
        setFilteredImage(canvas.toDataURL('image/jpeg'));
      };
    }
  };
  const handleApplyFilter = () => {
    if (selectedFilter === 'normal') {
      setFilteredImage(preview);
    }
    setAppliedFilter(selectedFilter);
    setStep(4);
  };

  // --- Публикация ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!file && !isValidYoutube) {
      setError('Пожалуйста, выберите изображение или вставьте ссылку на YouTube');
      return;
    }
    if (file && !content.trim()) {
      setError('Добавьте описание к публикации');
      return;
    }
    setLoading(true);
    try {
      let response;
      const token = localStorage.getItem('token');
      if (file) {
        const formData = new FormData();
        if (filteredImage) {
          const imgResp = await fetch(filteredImage);
          const blob = await imgResp.blob();
          formData.append('media', blob, file.name);
        } else {
          formData.append('media', file);
        }
        formData.append('content', content);
        response = await axios.post(`${API_URL}/api/posts`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else if (isValidYoutube) {
        if (!content.trim()) {
          setError('Добавьте описание к публикации');
          setLoading(false);
          return;
        }
        response = await axios.post(`${API_URL}/api/posts`, {
          content,
          videoLink: cleanYoutubeUrl(normalizeYoutubeLink(videoLink)),
          
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      if (response && response.data) {
        if (currentUser && currentUser.username) {
          navigate(`/profile/${currentUser.username}`);
        }
        clearAll();
        onClose && onClose();
      }
    } catch (err) {
      setError(err.message || 'Ошибка при публикации');
    } finally {
      setLoading(false);
    }
  };

  // --- UI Header ---
  const getHeader = () => {
    let title = '';
    let right = null;
    if (step === 1) {
      title = t('create_publication', 'Создание публикации');
      if (isValidYoutube) {
        right = <button className={styles.nextButtonHeader} type="button" onClick={() => setStep(4)}>{t('next', 'Далее')}</button>;
      }
    } else if (step === 2) {
      title = t('crop_image', 'Обрезка изображения');
      right = <button className={styles.nextButtonHeader} onClick={handleCropComplete} type="button">{t('next', 'Далее')}</button>;
    } else if (step === 3) {
      title = t('editing', 'Редактирование');
      right = <button className={styles.nextButtonHeader} onClick={handleApplyFilter} type="button">{t('next', 'Далее')}</button>;
    } else if (step === 4) {
      title = t('create_publication', 'Создание публикации');
      right = <button className={styles.nextButtonHeader} type="submit" form="createPostForm" disabled={loading}>{loading ? t('publishing', 'Публикация...') : t('publish', 'Опубликовать')}</button>;
    }
    return { title, right };
  };

  // --- UI Steps ---
  let contentNode = null;
  if (step === 1) {
    if (isValidYoutube) {
      contentNode = (
        <div className={styles.step1Container}>
          <div className={styles.youtubeBlock}>
            <input
              type="text"
              className={styles.youtubeInput}
              placeholder={t('paste_youtube_link', 'Вставьте ссылку на YouTube')}
              value={videoLink}
              onChange={handleVideoLinkChange}
              disabled={false}
            />
            <div className={styles.youtubePreview}>
              <ReactPlayer url={cleanYoutubeUrl(normalizeYoutubeLink(videoLink))} width="100%" height="220px" controls={true} />
            </div>
          </div>
        </div>
      );
    } else {
      contentNode = (
        <div className={styles.step1Container}>
          {!file && (
            <>
              <div
                className={`${styles.dragDropBlock} ${dragActive ? styles.dragActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={!!videoLink}
                />
                <label htmlFor="file-upload" className={styles.uploadLabel} style={{ opacity: videoLink ? 0.5 : 1 }}>
                  <div className={styles.uploadText}>{t('drag_photo_here', 'Перетащите фото сюда')}</div>
                  <div className={styles.uploadButton} style={{ pointerEvents: videoLink ? 'none' : 'auto' }}>{t('choose_from_computer', 'Выбрать с компьютера')}</div>
                </label>
              </div>
              <div className={styles.orBlock}>{t('or', 'или')}</div>
              <div className={styles.youtubeBlock}>
                <input
                  type="text"
                  className={styles.youtubeInput}
                  placeholder={t('paste_youtube_link', 'Вставьте ссылку на YouTube')}
                  value={videoLink}
                  onChange={handleVideoLinkChange}
                  disabled={!!file}
                />
                {videoLink && (
                  isValidYoutube ? (
                    <div className={styles.youtubePreview}><ReactPlayer url={cleanYoutubeUrl(normalizeYoutubeLink(videoLink))} width="100%" height="220px" controls={true} /></div>
                  ) : (
                    <div className={styles.youtubeError}>{t('invalid_youtube_link', 'Неверная ссылка на YouTube')}</div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      );
    }
  } else if (step === 2 && file && file.type.startsWith('image/')) {
    contentNode = (
      <div className={styles.cropContainer}>
        <div className={styles.cropAspectButtons}>
          {cropPresets.map(preset => (
            <button
              key={preset.value}
              type="button"
              className={cropAspect === preset.value ? styles.activeCropBtn : styles.cropBtn}
              onClick={() => handleAspectChange(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <ReactCrop
          crop={crop}
          onChange={setCrop}
          aspect={cropAspect}
          className={styles.cropArea}
        >
          <img
            ref={imgRef}
            src={preview}
            onLoad={onImageLoad}
            alt="Crop"
            className={styles.cropImage}
          />
        </ReactCrop>
      </div>
    );
  } else if (step === 3 && file && file.type.startsWith('image/')) {
    contentNode = (
      <div className={styles.filterStepLayout}>
        <div className={styles.filterPreviewLeft}>
          <img
            src={preview}
            alt="Preview"
            style={getFilterStyle(selectedFilter)}
            className={styles.filterImageLarge}
          />
        </div>
        <div className={styles.filterThumbnailsRight}>
          {filters.map((f) => (
            <div
              key={f.name}
              className={
                styles.filterThumbnail +
                (selectedFilter === f.name ? ' ' + styles.activeThumbnail : '')
              }
              onClick={() => handleFilterSelect(f.name)}
            >
              <img
                src={preview}
                alt={f.label}
                style={getFilterStyle(f.name)}
                className={styles.filterThumbnailImg}
              />
              <div className={styles.filterThumbLabel}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (step === 4) {
    contentNode = (
      <form id="createPostForm" onSubmit={handleSubmit} className={styles.finalForm}>
        <div className={styles.finalPreviewBlock}>
          {file && file.type.startsWith('image/') && filteredImage && (
            <img 
              src={filteredImage} 
              alt="Preview" 
              className={styles.finalPreviewImg}
              style={getFilterStyle(appliedFilter)}
            />
          )}
          {isValidYoutube && (
            <div className={styles.youtubePreview}>
              <ReactPlayer url={cleanYoutubeUrl(normalizeYoutubeLink(videoLink))} width="100%" height="220px" controls={true} />
            </div>
          )}
        </div>
        <textarea
          className={styles.captionInput}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t('add_caption', 'Добавьте подпись...')}
          maxLength={200}
        />
        {error && <div className={styles.error}>{error}</div>}
      </form>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          {step > 1 ? (
            <button className={styles.backButton} onClick={() => setStep(step - 1)} aria-label={t('back', 'Назад')}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          ) : <div style={{ width: 40 }} />}
          <div className={styles.headerTitle}>{getHeader().title}</div>
          <div>{getHeader().right}</div>
        </div>
        {contentNode}
      </div>
    </div>
  );
};

export default CreatePost; 
