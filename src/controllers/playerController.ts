import { Request, Response } from 'express';
import { playerService } from '../services/playerService';
import { storageService } from '../services/storageService';

export interface PlayerRequest extends Request {
	body: {
		name: string;
		photoFileId: number;
		releaseId: number;
		telegramId: number;
	};
}

class PlayerController {
	// Получение всех игроков
	async getAllPlayers(req: Request, res: Response) {
		try {
			const players = await playerService.getAllPlayers();
			res.status(200).json(players);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение игрока по ID
	async getPlayerById(req: Request, res: Response) {
		try {
			const playerId = parseInt(req.params.id);

			const player = await playerService.getPlayerById(playerId);

			if (!player) {
				return res.status(404).json({ error: 'Игрок не найден' });
			}

			res.status(200).json(player);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Создание нового игрока
	async createPlayer(req: Request, res: Response) {
		try {
			const telegramId = req.body.telegramId;

			// Проверяем права администратора
			const isAdmin = await storageService.isAdmin(telegramId);
			if (!isAdmin) {
				return res.status(403).json({ error: 'Доступ запрещен' });
			}

			// Получаем данные из формы
			const { name, releaseId } = req.body;
			const photoFile = req.file;

			// Проверяем обязательные поля
			if (!name || !releaseId) {
				return res.status(400).json({
					error: 'Не указаны обязательные поля: name, releaseId',
				});
			}

			const playerData = {
				name,
				releaseId: parseInt(releaseId),
				...(photoFile && {
					photo: {
						buffer: photoFile.buffer,
						originalname: photoFile.originalname,
						mimetype: photoFile.mimetype,
					},
				}),
			};

			const player = await playerService.createPlayer(playerData);
			res.status(201).json(player);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Обновление игрока
	async updatePlayer(req: Request, res: Response) {
		try {
			const telegramId = req.body.telegramId;

			// Проверяем права администратора
			const isAdmin = await storageService.isAdmin(telegramId);
			if (!isAdmin) {
				return res.status(403).json({ error: 'Доступ запрещен' });
			}

			const playerId = parseInt(req.params.id);
			const { name, removePhoto } = req.body;
			const photoFile = req.file;

			const playerData = {
				...(name !== undefined && { name }),
				...(removePhoto === 'true' && { removePhoto: true }),
				...(photoFile && {
					photo: {
						buffer: photoFile.buffer,
						originalname: photoFile.originalname,
						mimetype: photoFile.mimetype,
					},
				}),
			};

			const player = await playerService.updatePlayer(playerId, playerData);
			res.status(200).json(player);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Удаление игрока
	async deletePlayer(req: Request, res: Response) {
		try {
			const telegramId = req.body.telegramId;

			// Проверяем права администратора
			const isAdmin = await storageService.isAdmin(telegramId);
			if (!isAdmin) {
				return res.status(403).json({ error: 'Доступ запрещен' });
			}

			const playerId = parseInt(req.params.id);

			await playerService.deletePlayer(playerId);
			res.status(200).json({ message: 'Игрок успешно удален' });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}
}

export const playerController = new PlayerController();
