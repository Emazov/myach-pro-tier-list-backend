import { Request, Response } from 'express';
import { releaseService } from '../services/releaseService';
import { fileService } from '../services/fileService';

export interface ReleaseRequest extends Request {
	body: {
		name?: string;
		description?: string;
		logoFileId?: number;
		telegramId?: string | number;
	};
}

export const releaseController = {
	// Получение всех релизов
	async getAllReleases(req: Request, res: Response): Promise<void> {
		try {
			const releases = await releaseService.getAllReleases();
			res.status(200).json(releases);
		} catch (error: any) {
			console.error('Ошибка при получении релизов:', error);
			res.status(500).json({ error: 'Не удалось получить релизы' });
		}
	},

	// Получение релиза по ID
	async getReleaseById(req: Request, res: Response): Promise<void> {
		try {
			const id = parseInt(req.params.id);

			if (isNaN(id)) {
				res.status(400).json({ error: 'ID должен быть числом' });
				return;
			}

			const release = await releaseService.getReleaseById(id);

			if (!release) {
				res.status(404).json({ error: 'Релиз не найден' });
				return;
			}

			res.status(200).json(release);
		} catch (error: any) {
			console.error('Ошибка при получении релиза:', error);
			res.status(500).json({ error: 'Не удалось получить релиз' });
		}
	},

	// Создание нового релиза (только для администратора)
	async createRelease(req: ReleaseRequest, res: Response): Promise<void> {
		try {
			const { name, description, logoFileId, telegramId } = req.body;

			if (!telegramId) {
				res
					.status(403)
					.json({ error: 'Требуется идентификатор пользователя Telegram' });
				return;
			}

			// Проверка прав администратора
			try {
				const isAdmin = await fileService.isAdmin(telegramId);
				if (!isAdmin) {
					res
						.status(403)
						.json({ error: 'Недостаточно прав для создания релизов' });
					return;
				}
			} catch (error) {
				res.status(403).json({ error: 'Ошибка при проверке прав доступа' });
				return;
			}

			// Проверяем наличие обязательных полей
			if (!name) {
				res.status(400).json({ error: 'Название релиза обязательно' });
				return;
			}

			const release = await releaseService.createRelease({
				name,
				description,
				logoFileId: logoFileId ? parseInt(logoFileId.toString()) : undefined,
			});

			res.status(201).json(release);
		} catch (error: any) {
			console.error('Ошибка при создании релиза:', error);

			if (error.message?.includes('не найден')) {
				res.status(404).json({ error: error.message });
				return;
			}

			res.status(500).json({ error: 'Не удалось создать релиз' });
		}
	},

	// Обновление релиза (только для администратора)
	async updateRelease(req: ReleaseRequest, res: Response): Promise<void> {
		try {
			const id = parseInt(req.params.id);
			const { name, description, logoFileId, telegramId } = req.body;

			if (isNaN(id)) {
				res.status(400).json({ error: 'ID должен быть числом' });
				return;
			}

			if (!telegramId) {
				res
					.status(403)
					.json({ error: 'Требуется идентификатор пользователя Telegram' });
				return;
			}

			// Проверка прав администратора
			try {
				const isAdmin = await fileService.isAdmin(telegramId);
				if (!isAdmin) {
					res
						.status(403)
						.json({ error: 'Недостаточно прав для обновления релизов' });
					return;
				}
			} catch (error) {
				res.status(403).json({ error: 'Ошибка при проверке прав доступа' });
				return;
			}

			const release = await releaseService.updateRelease(id, {
				name,
				description,
				logoFileId: logoFileId ? parseInt(logoFileId.toString()) : undefined,
			});

			res.status(200).json(release);
		} catch (error: any) {
			console.error('Ошибка при обновлении релиза:', error);

			if (error.message?.includes('не найден')) {
				res.status(404).json({ error: error.message });
				return;
			}

			res.status(500).json({ error: 'Не удалось обновить релиз' });
		}
	},

	// Удаление релиза (только для администратора)
	async deleteRelease(req: Request, res: Response): Promise<void> {
		try {
			const id = parseInt(req.params.id);
			const telegramId = req.query.telegramId;

			if (isNaN(id)) {
				res.status(400).json({ error: 'ID должен быть числом' });
				return;
			}

			if (!telegramId || Array.isArray(telegramId)) {
				res
					.status(403)
					.json({ error: 'Требуется идентификатор пользователя Telegram' });
				return;
			}

			// Проверка прав администратора
			try {
				const isAdmin = await fileService.isAdmin(telegramId.toString());
				if (!isAdmin) {
					res
						.status(403)
						.json({ error: 'Недостаточно прав для удаления релизов' });
					return;
				}
			} catch (error) {
				res.status(403).json({ error: 'Ошибка при проверке прав доступа' });
				return;
			}

			await releaseService.deleteRelease(id);

			res.status(204).end();
		} catch (error: any) {
			console.error('Ошибка при удалении релиза:', error);

			if (error.message?.includes('не найден')) {
				res.status(404).json({ error: error.message });
				return;
			}

			res.status(500).json({ error: 'Не удалось удалить релиз' });
		}
	},

	// Получение всех игроков релиза
	async getReleasePlayers(req: Request, res: Response): Promise<void> {
		try {
			const releaseId = parseInt(req.params.id);

			if (isNaN(releaseId)) {
				res.status(400).json({ error: 'ID релиза должен быть числом' });
				return;
			}

			const players = await releaseService.getReleasePlayers(releaseId);

			res.status(200).json(players);
		} catch (error: any) {
			console.error('Ошибка при получении игроков релиза:', error);

			if (error.message?.includes('не найден')) {
				res.status(404).json({ error: error.message });
				return;
			}

			res.status(500).json({ error: 'Не удалось получить игроков релиза' });
		}
	},
};
