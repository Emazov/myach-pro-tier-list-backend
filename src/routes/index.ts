import { Router } from 'express';
import telegramRoutes from './telegramRoutes';
import fileRoutes from './fileRoutes';
import releaseRoutes from './releaseRoutes';
import playerRoutes from './playerRoutes';

const router = Router();

// Тестовый маршрут API
router.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'API работает' });
});

// Маршруты Telegram
router.use('/telegram', telegramRoutes);

// Маршруты для файлов
router.use('/files', fileRoutes);

// Маршруты для релизов (выпусков)
router.use('/releases', releaseRoutes);

// Маршруты для игроков
router.use('/players', playerRoutes);

export default router;
