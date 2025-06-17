import { Router } from 'express';
import userRoutes from './userRoutes';

const router = Router();

// Тестовый маршрут API
router.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'API работает' });
});

// Маршруты пользователя
router.use('/users', userRoutes);

export default router;
