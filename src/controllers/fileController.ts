import { Request, Response } from 'express';
import { fileService } from '../services/fileService';

export interface FileUploadRequest extends Request {
	body: {
		telegramUserId?: number | string;
		description?: string;
		telegramId?: string | number;
	};
}

export const fileController = {
	// Загрузка файла (только для администратора)
	async uploadFile(req: FileUploadRequest, res: Response): Promise<void> {
		try {
			if (!req.file) {
				res.status(400).json({ error: 'Файл не предоставлен' });
				return;
			}

			const { originalname, mimetype, buffer } = req.file;
			const { telegramUserId, description, telegramId } = req.body;

			if (!telegramId) {
				res
					.status(403)
					.json({ error: 'Требуется идентификатор пользователя Telegram' });
				return;
			}

			try {
				const uploadedFile = await fileService.uploadFile(
					buffer,
					originalname,
					mimetype,
					{
						telegramUserId: telegramUserId
							? parseInt(telegramUserId.toString())
							: undefined,
						description: description?.toString(),
					},
					telegramId,
				);

				res.status(201).json(uploadedFile);
			} catch (error: any) {
				if (error.message === 'Недостаточно прав для загрузки файлов') {
					res.status(403).json({ error: error.message });
				} else {
					throw error;
				}
			}
		} catch (error) {
			console.error('Ошибка при загрузке файла:', error);
			res.status(500).json({ error: 'Не удалось загрузить файл' });
		}
	},

	// Получение одиночного файла по ID
	async getFileById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			if (!id) {
				res.status(400).json({ error: 'ID файла не предоставлен' });
				return;
			}

			const file = await fileService.getFileById(parseInt(id));

			if (!file) {
				res.status(404).json({ error: 'Файл не найден' });
				return;
			}

			res.status(200).json(file);
		} catch (error) {
			console.error('Ошибка при получении файла:', error);
			res.status(500).json({ error: 'Не удалось получить файл' });
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

	// Удаление файла (только для администратора)
	async deleteFile(req: Request, res: Response): Promise<void> {
		try {
			const { key } = req.params;
			const { telegramId } = req.query;

			if (!key) {
				res.status(400).json({ error: 'Ключ файла не предоставлен' });
				return;
			}

			if (!telegramId || Array.isArray(telegramId)) {
				res
					.status(403)
					.json({ error: 'Требуется идентификатор пользователя Telegram' });
				return;
			}

			try {
				await fileService.deleteFile(key, telegramId.toString());
				res.status(200).json({ message: 'Файл успешно удален' });
			} catch (error: any) {
				if (error.message === 'Недостаточно прав для удаления файлов') {
					res.status(403).json({ error: error.message });
				} else {
					throw error;
				}
			}
		} catch (error) {
			console.error('Ошибка при удалении файла:', error);
			res.status(500).json({ error: 'Не удалось удалить файл' });
		}
	},

	// Получение списка файлов (все файлы - только для администратора)
	async listFiles(req: Request, res: Response): Promise<void> {
		try {
			const { prefix, telegramUserId, telegramId } = req.query;

			try {
				const files = await fileService.listFiles(
					prefix as string | undefined,
					telegramUserId ? parseInt(telegramUserId as string) : undefined,
					telegramId ? telegramId.toString() : undefined,
				);

				res.status(200).json(files);
			} catch (error: any) {
				if (error.message === 'Недостаточно прав для просмотра всех файлов') {
					res.status(403).json({ error: error.message });
				} else {
					throw error;
				}
			}
		} catch (error) {
			console.error('Ошибка при получении списка файлов:', error);
			res.status(500).json({ error: 'Не удалось получить список файлов' });
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
