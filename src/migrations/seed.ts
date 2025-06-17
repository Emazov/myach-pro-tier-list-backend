import prisma from '../database/prisma';

/**
 * Заполнение базы данных тестовыми данными
 */
async function seed() {
	try {
		console.log('Начало заполнения базы данных...');

		// Очистка существующих данных
		await prisma.user.deleteMany({});

		// Создание тестовых пользователей
		const users = await Promise.all([
			prisma.user.create({
				data: {
					email: 'admin@example.com',
					name: 'Администратор',
					// В реальном проекте можно добавить хеширование пароля, если модель будет обновлена
				},
			}),
			prisma.user.create({
				data: {
					email: 'user@example.com',
					name: 'Тестовый пользователь',
					// В реальном проекте можно добавить хеширование пароля, если модель будет обновлена
				},
			}),
		]);

		console.log(`Создано ${users.length} пользователей`);
		console.log('Заполнение базы данных завершено успешно');
	} catch (error) {
		console.error('Ошибка при заполнении базы данных:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Запускаем заполнение базы данных
seed();
