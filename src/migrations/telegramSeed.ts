import prisma from '../database/prisma';

/**
 * Заполнение базы данных тестовыми данными для Telegram
 */
async function seed() {
	try {
		console.log('Начало заполнения таблицы telegram_users...');

		// Очистка существующих данных
		await prisma.telegramUser.deleteMany({});

		// Создание тестовых пользователей Telegram
		const users = await Promise.all([
			prisma.telegramUser.create({
				data: {
					telegramId: BigInt('123456789'),
					username: 'test_user',
					firstName: 'Test',
					lastName: 'User',
				},
			}),
			prisma.telegramUser.create({
				data: {
					telegramId: BigInt('987654321'),
					username: 'another_user',
					firstName: 'Another',
					lastName: 'User',
				},
			}),
		]);

		console.log(`Создано ${users.length} пользователей Telegram`);
		console.log('Заполнение таблицы telegram_users завершено успешно');
	} catch (error) {
		console.error('Ошибка при заполнении данных Telegram:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Запускаем заполнение базы данных
seed();
