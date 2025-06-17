import { Request, Response } from 'express';
import { categoryService } from '../services/categoryService';
import { storageService } from '../services/storageService';

class CategoryController {
	// Получение всех категорий
	async getAllCategories(req: Request, res: Response) {
		try {
			const categories = await categoryService.getAllCategories();
			res.status(200).json(categories);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение категории по ID
	async getCategoryById(req: Request, res: Response) {
		try {
			const categoryId = parseInt(req.params.id);
			const category = await categoryService.getCategoryById(categoryId);

			if (!category) {
				return res.status(404).json({ error: 'Категория не найдена' });
			}

			res.status(200).json(category);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение статистики по категориям (только для админа)
	async getCategoriesStatistics(req: Request, res: Response) {
		try {
			const telegramId = req.query.telegramId;

			if (!telegramId || Array.isArray(telegramId)) {
				return res.status(400).json({
					error: 'Не указан обязательный параметр: telegramId',
				});
			}

			// Проверка прав администратора
			const isAdmin = await storageService.isAdmin(telegramId.toString());
			if (!isAdmin) {
				return res.status(403).json({
					error:
						'Доступ запрещен. Только администратор может просматривать общую статистику.',
				});
			}

			const stats = await categoryService.getCategoriesStatistics();
			res.status(200).json(stats);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение итоговых результатов голосования (доступно всем)
	async getVotingResults(req: Request, res: Response) {
		try {
			const results = await categoryService.getVotingResults();
			res.status(200).json(results);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}
}

export const categoryController = new CategoryController();
