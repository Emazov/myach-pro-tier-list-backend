import { Router } from 'express';
import telegramRoutes from './telegramRoutes';
import releaseRoutes from './releaseRoutes';
import playerRoutes from './playerRoutes';
import categoryRoutes from './categoryRoutes';
import voteRoutes from './voteRoutes';

const router = Router();

// Тестовый маршрут API
router.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'API работает' });
});

// API маршруты
router.use('/telegram', telegramRoutes);
router.use('/releases', releaseRoutes);
router.use('/players', playerRoutes);
router.use('/categories', categoryRoutes);
router.use('/votes', voteRoutes);

export default router;
