import { Request, Response } from 'express';
import { playerService } from '../services/playerService';
import { fileService } from '../services/fileService';

export interface PlayerRequest extends Request {
	body: {
		name?: string;
		position?: string;
		number?: number | string;
		description?: string;
		photoFileId?: number | string;
		releaseId?: number | string;
		telegramId?: string | number;
	};
}

export const playerController = {
	// Получение всех игроков
	async getAllPlayers(req: Request, res: Response): Promise<void> {
		try {
			const players = await playerService.getAllPlayers();
			res.status(200).json(players);
		} catch (error: any) {
			console.error('Ошибка при получении игроков:', error);
			res.status(500).json({ error: 'Не удалось получить игроков' });
		}
	},

	// Получение игрока по ID
	async getPlayerById(req: Request, res: Response): Promise<void> {
		try {
			const id = parseInt(req.params.id);

			if (isNaN(id)) {
				res.status(400).json({ error: 'ID должен быть числом' });
				return;
			}

			const player = await playerService.getPlayerById(id);

			if (!player) {
				res.status(404).json({ error: 'Игрок не найден' });
				return;
			}

			res.status(200).json(player);
		} catch (error: any) {
			console.error('Ошибка при получении игрока:', error);
			res.status(500).json({ error: 'Не удалось получить игрока' });
		}
	},

	// Создание нового игрока (только для администратора)
	async createPlayer(req: PlayerRequest, res: Response): Promise<void> {
		try {
			const {
				name,
				position,
				number,
				description,
				photoFileId,
				releaseId,
				telegramId,
			} = req.body;

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
						.json({ error: 'Недостаточно прав для создания игроков' });
					return;
				}
			} catch (error) {
				res.status(403).json({ error: 'Ошибка при проверке прав доступа' });
				return;
			}

			// Проверяем наличие обязательных полей
			if (!name) {
				res.status(400).json({ error: 'Имя игрока обязательно' });
				return;
			}

			if (!releaseId) {
				res.status(400).json({ error: 'ID релиза обязателен' });
				return;
			}

			const player = await playerService.createPlayer({
				name,
				position,
				number: number !== undefined ? parseInt(number.toString()) : undefined,
				description,
				photoFileId: photoFileId ? parseInt(photoFileId.toString()) : undefined,
				releaseId: parseInt(releaseId.toString()),
			});

			res.status(201).json(player);
		} catch (error: any) {
			console.error('Ошибка при создании игрока:', error);

			if (
				error.message?.includes('не найден') ||
				error.message?.includes('максимальное количество игроков')
			) {
				res.status(400).json({ error: error.message });
				return;
			}

			res.status(500).json({ error: 'Не удалось создать игрока' });
		}
	},

	// Обновление игрока (только для администратора)
	async updatePlayer(req: PlayerRequest, res: Response): Promise<void> {
		try {
			const id = parseInt(req.params.id);
			const { name, position, number, description, photoFileId, telegramId } =
				req.body;

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
						.json({ error: 'Недостаточно прав для обновления игроков' });
					return;
				}
			} catch (error) {
				res.status(403).json({ error: 'Ошибка при проверке прав доступа' });
				return;
			}

			const player = await playerService.updatePlayer(id, {
				name,
				position,
				number: number !== undefined ? parseInt(number.toString()) : undefined,
				description,
				photoFileId: photoFileId ? parseInt(photoFileId.toString()) : undefined,
			});

			res.status(200).json(player);
		} catch (error: any) {
			console.error('Ошибка при обновлении игрока:', error);

			if (error.message?.includes('не найден')) {
				res.status(404).json({ error: error.message });
				return;
			}

			res.status(500).json({ error: 'Не удалось обновить игрока' });
		}
	},

	// Удаление игрока (только для администратора)
	async deletePlayer(req: Request, res: Response): Promise<void> {
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
						.json({ error: 'Недостаточно прав для удаления игроков' });
					return;
				}
			} catch (error) {
				res.status(403).json({ error: 'Ошибка при проверке прав доступа' });
				return;
			}

			await playerService.deletePlayer(id);

			res.status(204).end();
		} catch (error: any) {
			console.error('Ошибка при удалении игрока:', error);

			if (error.message?.includes('не найден')) {
				res.status(404).json({ error: error.message });
				return;
			}

			res.status(500).json({ error: 'Не удалось удалить игрока' });
		}
	},
};
