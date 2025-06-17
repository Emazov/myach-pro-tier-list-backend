import express from 'express';
import multer from 'multer';
import { fileController } from '../controllers/fileController';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Загрузка файла
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Получение списка файлов
router.get('/', fileController.listFiles);

// Получение URL файла
router.get('/url/:key', fileController.getFileUrl);

// Получение аватара пользователя
router.get('/user-avatar/:userId', fileController.getUserAvatar);

// Получение аватара Telegram пользователя
router.get(
	'/telegram-user-avatar/:telegramUserId',
	fileController.getTelegramUserAvatar,
);

// Получение файла по ключу
router.get('/:key', fileController.getFile);

// Удаление файла
router.delete('/:key', fileController.deleteFile);

export default router;
