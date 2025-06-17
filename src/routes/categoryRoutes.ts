import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';

const router = Router();

// Получение всех категорий
router.get('/', categoryController.getAllCategories);

// Получение статистики по категориям (только для админа)
router.get('/stats', categoryController.getCategoriesStatistics);

// Получение итоговых результатов голосования (доступно всем)
router.get('/results', categoryController.getVotingResults);

// Получение категории по ID
router.get('/:id', categoryController.getCategoryById);

export default router;
