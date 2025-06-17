import { Request, Response } from 'express';
import telegramService from '../services/telegramService';

export const webhook = async (req: Request, res: Response): Promise<void> => {
	try {
		// Получаем update от Telegram
		const update = req.body;

		if (!update) {
			res.status(400).json({ success: false, message: 'Некорректный запрос' });
			return;
		}

		// Обрабатываем полученный update
		await telegramService.processUpdate(update);

		// Возвращаем успешный ответ Telegram серверу
		res.status(200).json({ success: true });
	} catch (error) {
		console.error('Ошибка при обработке webhook:', error);
		res.status(500).json({
			success: false,
			message: 'Внутренняя ошибка сервера при обработке webhook',
		});
	}
};
