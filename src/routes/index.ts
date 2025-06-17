import { Router } from 'express';
import userRoutes from './userRoutes';
import telegramRoutes from './telegramRoutes';

const router = Router();

// Тестовый маршрут API
router.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'API работает' });
});

// Маршруты пользователя
router.use('/users', userRoutes);

// Маршруты Telegram
router.use('/telegram', telegramRoutes);

export default router;
