import { Request, Response } from 'express';
import { fileService } from '../services/fileService';

export interface FileUploadRequest extends Request {
	body: {
		userId?: number | string;
		telegramUserId?: number | string;
		isAvatar?: boolean | string;
	};
}

export const fileController = {
	// Загрузка файла
	async uploadFile(req: FileUploadRequest, res: Response): Promise<void> {
		try {
			if (!req.file) {
				res.status(400).json({ error: 'Файл не предоставлен' });
				return;
			}

			const { originalname, mimetype, buffer } = req.file;
			const { userId, telegramUserId, isAvatar } = req.body;

			const uploadedFile = await fileService.uploadFile(
				buffer,
				originalname,
				mimetype,
				{
					userId: userId ? parseInt(userId.toString()) : undefined,
					telegramUserId: telegramUserId
						? parseInt(telegramUserId.toString())
						: undefined,
					isAvatar: isAvatar === true || isAvatar === 'true',
				},
			);

			res.status(201).json(uploadedFile);
		} catch (error) {
			console.error('Ошибка при загрузке файла:', error);
			res.status(500).json({ error: 'Не удалось загрузить файл' });
		}
	},

	// Получение файла по ключу
	async getFile(req: Request, res: Response): Promise<void> {
		try {
			const { key } = req.params;

			if (!key) {
				res.status(400).json({ error: 'Ключ файла не предоставлен' });
				return;
			}

			const { stream, contentType } = await fileService.getFile(key);

			res.setHeader('Content-Type', contentType);
			stream.pipe(res);
		} catch (error) {
			console.error('Ошибка при получении файла:', error);
			res.status(404).json({ error: 'Файл не найден' });
		}
	},

	// Получение URL файла
	async getFileUrl(req: Request, res: Response): Promise<void> {
		try {
			const { key } = req.params;

			if (!key) {
				res.status(400).json({ error: 'Ключ файла не предоставлен' });
				return;
			}

			const url = await fileService.getFileUrl(key);

			res.status(200).json({ url });
		} catch (error) {
			console.error('Ошибка при получении URL файла:', error);
			res.status(404).json({ error: 'Файл не найден' });
		}
	},

	// Удаление файла
	async deleteFile(req: Request, res: Response): Promise<void> {
		try {
			const { key } = req.params;

			if (!key) {
				res.status(400).json({ error: 'Ключ файла не предоставлен' });
				return;
			}

			await fileService.deleteFile(key);

			res.status(200).json({ message: 'Файл успешно удален' });
		} catch (error) {
			console.error('Ошибка при удалении файла:', error);
			res.status(500).json({ error: 'Не удалось удалить файл' });
		}
	},

	// Получение списка файлов
	async listFiles(req: Request, res: Response): Promise<void> {
		try {
			const { prefix, userId, telegramUserId } = req.query;

			const files = await fileService.listFiles(
				prefix as string | undefined,
				userId ? parseInt(userId as string) : undefined,
				telegramUserId ? parseInt(telegramUserId as string) : undefined,
			);

			res.status(200).json(files);
		} catch (error) {
			console.error('Ошибка при получении списка файлов:', error);
			res.status(500).json({ error: 'Не удалось получить список файлов' });
		}
	},

	// Получение аватара пользователя
	async getUserAvatar(req: Request, res: Response): Promise<void> {
		try {
			const { userId } = req.params;

			if (!userId) {
				res.status(400).json({ error: 'ID пользователя не предоставлен' });
				return;
			}

			const avatar = await fileService.getUserAvatar(parseInt(userId));

			if (!avatar) {
				res.status(404).json({ error: 'Аватар не найден' });
				return;
			}

			res.status(200).json(avatar);
		} catch (error) {
			console.error('Ошибка при получении аватара пользователя:', error);
			res
				.status(500)
				.json({ error: 'Не удалось получить аватар пользователя' });
		}
	},

	// Получение аватара Telegram пользователя
	async getTelegramUserAvatar(req: Request, res: Response): Promise<void> {
		try {
			const { telegramUserId } = req.params;

			if (!telegramUserId) {
				res
					.status(400)
					.json({ error: 'ID Telegram пользователя не предоставлен' });
				return;
			}

			const avatar = await fileService.getTelegramUserAvatar(
				parseInt(telegramUserId),
			);

			if (!avatar) {
				res.status(404).json({ error: 'Аватар не найден' });
				return;
			}

			res.status(200).json(avatar);
		} catch (error) {
			console.error(
				'Ошибка при получении аватара Telegram пользователя:',
				error,
			);
			res
				.status(500)
				.json({ error: 'Не удалось получить аватар Telegram пользователя' });
		}
	},
};
