import prisma from '../database/prisma';

/**
 * Заполнение базы данных тестовыми данными
 */
async function main() {
	console.log('🌱 Начало заполнения базы данных...');

	// Очищаем таблицу перед заполнением
	await prisma.telegramUser.deleteMany({});

	console.log('Данные очищены');

	// Создаем тестовых пользователей Telegram
	const telegramUser1 = await prisma.telegramUser.create({
		data: {
			telegramId: BigInt(123456789),
		},
	});

	const telegramUser2 = await prisma.telegramUser.create({
		data: {
			telegramId: BigInt(987654321),
		},
	});

	console.log(`📝 Создано ${2} пользователей Telegram`);

	console.log('✅ Заполнение базы данных успешно завершено!');
}

main()
	.catch((e) => {
		console.error('❌ Ошибка при заполнении базы данных:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
