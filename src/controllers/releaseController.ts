import { Request, Response } from 'express';
import { releaseService } from '../services/releaseService';
import { storageService } from '../services/storageService';

export interface ReleaseRequest extends Request {
	body: {
		name: string;
		logoFileId: number;
		telegramId: number;
	};
}

class ReleaseController {
	// Получение всех релизов
	async getAllReleases(req: Request, res: Response) {
		try {
			const releases = await releaseService.getAllReleases();
			res.status(200).json(releases);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение релиза по ID
	async getReleaseById(req: Request, res: Response) {
		try {
			const releaseId = parseInt(req.params.id);
			const release = await releaseService.getReleaseById(releaseId);

			if (!release) {
				return res.status(404).json({ error: 'Релиз не найден' });
			}

			res.status(200).json(release);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Создание нового релиза
	async createRelease(req: Request, res: Response) {
		try {
			const telegramId = req.body.telegramId;

			// Проверяем права администратора
			const isAdmin = await storageService.isAdmin(telegramId);
			if (!isAdmin) {
				return res.status(403).json({ error: 'Доступ запрещен' });
			}

			// Получаем данные из формы
			const { name, description } = req.body;
			const logoFile = req.file;

			const releaseData = {
				name,
				description,
				...(logoFile && {
					logo: {
						buffer: logoFile.buffer,
						originalname: logoFile.originalname,
						mimetype: logoFile.mimetype,
					},
				}),
			};

			const release = await releaseService.createRelease(releaseData);
			res.status(201).json(release);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Обновление релиза
	async updateRelease(req: Request, res: Response) {
		try {
			const telegramId = req.body.telegramId;

			// Проверяем права администратора
			const isAdmin = await storageService.isAdmin(telegramId);
			if (!isAdmin) {
				return res.status(403).json({ error: 'Доступ запрещен' });
			}

			const releaseId = parseInt(req.params.id);
			const { name, description, removeLogo } = req.body;
			const logoFile = req.file;

			const releaseData = {
				...(name !== undefined && { name }),
				...(description !== undefined && { description }),
				...(removeLogo === 'true' && { removeLogo: true }),
				...(logoFile && {
					logo: {
						buffer: logoFile.buffer,
						originalname: logoFile.originalname,
						mimetype: logoFile.mimetype,
					},
				}),
			};

			const release = await releaseService.updateRelease(
				releaseId,
				releaseData,
			);
			res.status(200).json(release);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Удаление релиза
	async deleteRelease(req: Request, res: Response) {
		try {
			const telegramId = req.body.telegramId;

			// Проверяем права администратора
			const isAdmin = await storageService.isAdmin(telegramId);
			if (!isAdmin) {
				return res.status(403).json({ error: 'Доступ запрещен' });
			}

			const releaseId = parseInt(req.params.id);

			await releaseService.deleteRelease(releaseId);
			res.status(200).json({ message: 'Релиз успешно удален' });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение игроков релиза
	async getReleasePlayers(req: Request, res: Response) {
		try {
			const releaseId = parseInt(req.params.id);

			const players = await releaseService.getReleasePlayers(releaseId);
			res.status(200).json(players);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}
}

export const releaseController = new ReleaseController();
