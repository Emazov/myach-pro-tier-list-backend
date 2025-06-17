import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import prisma from './database/prisma';
import telegramService from './services/telegramService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const appUrl = process.env.APP_URL || `http://localhost:${port}`;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API маршруты
app.use('/api', routes);

// Обработка ошибок
app.use(errorHandler);

// Запуск сервера
const server = app.listen(port, () => {
	console.log(`Сервер запущен на порту ${port}`);

	// Инициализация Telegram бота
	try {
		// В режиме разработки используем polling, в продакшене webhook
		if (process.env.NODE_ENV === 'production') {
			telegramService.initWebhook(appUrl);
			console.log(
				`Telegram webhook настроен на ${appUrl}/api/telegram/webhook`,
			);
		} else {
			// Для локальной разработки можно использовать Long Polling, но нужно изменить инициализацию в telegramService
			console.log('Telegram бот запущен в режиме разработки');
		}
	} catch (error) {
		console.error('Ошибка при инициализации Telegram бота:', error);
	}
});

// Корректная обработка завершения работы
process.on('SIGINT', async () => {
	console.log('Закрытие подключений к базе данных...');
	await prisma.$disconnect();
	server.close(() => {
		console.log('Сервер остановлен');
		process.exit(0);
	});
});

process.on('SIGTERM', async () => {
	console.log('Закрытие подключений к базе данных...');
	await prisma.$disconnect();
	server.close(() => {
		console.log('Сервер остановлен');
		process.exit(0);
	});
});
