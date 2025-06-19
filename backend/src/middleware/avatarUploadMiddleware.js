import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройка хранилища для multer для АВАТАРОВ
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/avatars")); // <--- ИЗМЕНЕН ПУТЬ НА 'avatars'
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Можно добавить префикс для ясности, например 'avatar-'
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Фильтр для проверки типа файла (ТОЛЬКО ИЗОБРАЖЕНИЯ для аватаров)
const avatarFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    // <--- ОСТАВЛЯЕМ ТОЛЬКО ИЗОБРАЖЕНИЯ
    cb(null, true);
  } else {
    cb(
      new Error("Not an image! Please upload only images for avatars."),
      false
    );
  }
};

const uploadAvatar = multer({
  storage: avatarStorage, // <--- Используем новое хранилище
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (или другой лимит для аватаров)
  },
  fileFilter: avatarFileFilter, // <--- Используем новый фильтр
});

export default uploadAvatar; // <--- Экспортируем новую конфигурацию
