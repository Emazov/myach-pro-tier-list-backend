import prisma from '../database/prisma';
import { storageService } from './storageService';

export interface CategoryWithStats {
	id: number;
	name: string;
	title: string;
	description: string | null;
	maxPlaces: number;
	sortOrder: number;
	votesCount: number;
	placesLeft: number;
}

export interface PlayerResult {
	id: number;
	name: string;
	photoUrl?: string;
	votesCount: number;
}

export interface CategoryResult {
	id: number;
	name: string;
	title: string;
	players: PlayerResult[];
}

class CategoryService {
	// Получение всех категорий
	async getAllCategories(): Promise<CategoryWithStats[]> {
		const categories = await prisma.playerCategory.findMany({
			orderBy: { sortOrder: 'asc' },
			include: {
				_count: {
					select: { votes: true },
				},
			},
		});

		return categories.map((category) => ({
			id: category.id,
			name: category.name,
			title: category.title,
			description: category.description,
			maxPlaces: category.maxPlaces,
			sortOrder: category.sortOrder,
			votesCount: category._count.votes,
			placesLeft: Math.max(0, category.maxPlaces - category._count.votes),
		}));
	}

	// Получение категории по ID
	async getCategoryById(id: number): Promise<CategoryWithStats | null> {
		const category = await prisma.playerCategory.findUnique({
			where: { id },
			include: {
				_count: {
					select: { votes: true },
				},
			},
		});

		if (!category) return null;

		return {
			id: category.id,
			name: category.name,
			title: category.title,
			description: category.description,
			maxPlaces: category.maxPlaces,
			sortOrder: category.sortOrder,
			votesCount: category._count.votes,
			placesLeft: Math.max(0, category.maxPlaces - category._count.votes),
		};
	}

	// Проверка доступности мест в категории
	async checkCategoryAvailability(
		categoryId: number,
		userId: number,
	): Promise<boolean> {
		const category = await prisma.playerCategory.findUnique({
			where: { id: categoryId },
			include: {
				_count: {
					select: { votes: true },
				},
				votes: {
					where: {
						userId,
					},
				},
			},
		});

		if (!category) return false;

		// Проверяем сколько у пользователя уже есть голосов в этой категории
		const userVotesInCategory = category.votes.length;

		// Общее количество голосов в категории
		const totalVotes = category._count.votes;

		// У категории есть ограничение по максимальному количеству мест
		const maxPlaces = category.maxPlaces;

		// Проверяем, не превышен ли лимит
		return totalVotes < maxPlaces || userVotesInCategory > 0;
	}

	// Получение статистики по категориям
	async getCategoriesStatistics(): Promise<any[]> {
		const categories = await prisma.playerCategory.findMany({
			orderBy: { sortOrder: 'asc' },
			include: {
				votes: {
					include: {
						player: true,
					},
				},
			},
		});

		return categories.map((category) => {
			// Подсчет голосов для каждого игрока в этой категории
			const playerVotes = category.votes.reduce((acc, vote) => {
				const playerId = vote.playerId;
				acc[playerId] = (acc[playerId] || 0) + 1;
				return acc;
			}, {} as Record<number, number>);

			const playerStats = Object.entries(playerVotes)
				.map(([playerId, count]) => {
					const player = category.votes.find(
						(v) => v.playerId === parseInt(playerId),
					)?.player;
					return {
						playerId: parseInt(playerId),
						name: player?.name || 'Неизвестный игрок',
						votesCount: count,
					};
				})
				.sort((a, b) => b.votesCount - a.votesCount);

			return {
				id: category.id,
				name: category.name,
				title: category.title,
				description: category.description,
				maxPlaces: category.maxPlaces,
				votesCount: category.votes.length,
				playerStats,
			};
		});
	}

	// Получение итоговых результатов голосования (для всех)
	async getVotingResults(): Promise<CategoryResult[]> {
		const categories = await prisma.playerCategory.findMany({
			orderBy: { sortOrder: 'asc' },
			include: {
				votes: {
					include: {
						player: true,
					},
				},
			},
		});

		const results = await Promise.all(
			categories.map(async (category) => {
				// Подсчет голосов для каждого игрока в этой категории
				const playerVotes = category.votes.reduce((acc, vote) => {
					const playerId = vote.playerId;
					acc[playerId] = (acc[playerId] || 0) + 1;
					return acc;
				}, {} as Record<number, number>);

				const players = await Promise.all(
					Object.entries(playerVotes)
						.map(async ([playerId, count]) => {
							const playerIdNum = parseInt(playerId);
							const player = category.votes.find(
								(v) => v.playerId === playerIdNum,
							)?.player;

							if (!player) return null;

							let photoUrl: string | undefined = undefined;

							if (player.photoKey) {
								photoUrl = await storageService.getFileUrl(player.photoKey);
							}

							return {
								id: playerIdNum,
								name: player.name,
								photoUrl,
								votesCount: count,
							};
						})
						.filter((p): p is Promise<PlayerResult> => p !== null),
				);

				// Сортируем игроков по количеству голосов
				const sortedPlayers = players.sort(
					(a, b) => b.votesCount - a.votesCount,
				);

				return {
					id: category.id,
					name: category.name,
					title: category.title,
					players: sortedPlayers,
				};
			}),
		);

		return results;
	}
}

export const categoryService = new CategoryService();
