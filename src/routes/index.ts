import { Router } from 'express';
import telegramRoutes from './telegramRoutes';
import fileRoutes from './fileRoutes';

const router = Router();

// Тестовый маршрут API
router.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'API работает' });
});

// Маршруты Telegram
router.use('/telegram', telegramRoutes);

// Маршруты для файлов
router.use('/files', fileRoutes);

export default router;
