import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import prisma from './database/prisma';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
});

// Корректная обработка завершения работы
process.on('SIGINT', async () => {
	console.log(
		'Получен сигнал завершения. Закрытие подключений к базе данных...',
	);
	await prisma.$disconnect();
	server.close(() => {
		console.log('Сервер остановлен');
		process.exit(0);
	});
});

process.on('SIGTERM', async () => {
	console.log(
		'Получен сигнал завершения. Закрытие подключений к базе данных...',
	);
	await prisma.$disconnect();
	server.close(() => {
		console.log('Сервер остановлен');
		process.exit(0);
	});
});
