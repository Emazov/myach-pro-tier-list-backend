import express from 'express';
import multer from 'multer';
import { fileController } from '../controllers/fileController';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Загрузка файла (только для администратора)
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Получение списка файлов (все файлы - только для администратора)
router.get('/', fileController.listFiles);

// Получение файла по ID
router.get('/id/:id', fileController.getFileById);

// Получение URL файла
router.get('/url/:key', fileController.getFileUrl);

// Получение аватара Telegram пользователя
router.get(
	'/telegram-user-avatar/:telegramUserId',
	fileController.getTelegramUserAvatar,
);

// Получение файла по ключу
router.get('/:key', fileController.getFile);

// Удаление файла (только для администратора)
router.delete('/:key', fileController.deleteFile);

export default router;
