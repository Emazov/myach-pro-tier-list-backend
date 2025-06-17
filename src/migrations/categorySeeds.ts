import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

const categories = [
	{
		name: 'goat',
		title: 'GOAT',
		description: 'Лучшие игроки',
		maxPlaces: 2,
		sortOrder: 1,
	},
	{
		name: 'good',
		title: 'Хорош',
		description: 'Хорошие игроки',
		maxPlaces: 6,
		sortOrder: 2,
	},
	{
		name: 'normal',
		title: 'Норм',
		description: 'Нормальные игроки',
		maxPlaces: 6,
		sortOrder: 3,
	},
	{
		name: 'bad',
		title: 'Бездарь',
		description: 'Бездарные игроки',
		maxPlaces: 6,
		sortOrder: 4,
	},
];

async function seedCategories() {
	console.log('Начало заполнения категорий игроков...');

	try {
		// Удаляем все существующие категории
		await prisma.playerCategory.deleteMany();
		console.log('Существующие категории удалены');

		// Создаем категории
		for (const category of categories) {
			await prisma.playerCategory.create({
				data: category,
			});
		}
		console.log('Категории игроков успешно созданы');
	} catch (error) {
		console.error('Ошибка при заполнении категорий игроков:', error);
	} finally {
		await prisma.$disconnect();
	}
}

seedCategories()
	.then(() => {
		console.log('Заполнение категорий игроков завершено');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Ошибка при запуске сида категорий:', error);
		process.exit(1);
	});
