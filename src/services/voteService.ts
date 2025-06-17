import prisma from '../database/prisma';
import { categoryService } from './categoryService';
import { storageService } from './storageService';
import { releaseService } from './releaseService';

export interface CreateVoteDto {
	telegramId: string | number; // Телеграм ID пользователя
	playerId: number; // ID игрока
	categoryId: number; // ID категории
}

export interface PlayerWithCategory {
	id: number;
	name: string;
	releaseId: number;
	photoUrl?: string;
	categoryId?: number;
	categoryName?: string;
}

class VoteService {
	// Добавление голоса
	async addVote(data: CreateVoteDto): Promise<any> {
		const { telegramId, playerId, categoryId } = data;

		// Находим или создаем пользователя Telegram
		const telegramUser = await this.findOrCreateTelegramUser(telegramId);

		// Проверяем, что игрок существует
		const player = await prisma.player.findUnique({
			where: { id: playerId },
		});

		if (!player) {
			throw new Error(`Игрок с ID ${playerId} не найден`);
		}

		// Проверяем, что категория существует
		const category = await prisma.playerCategory.findUnique({
			where: { id: categoryId },
		});

		if (!category) {
			throw new Error(`Категория с ID ${categoryId} не найдена`);
		}

		// Проверяем доступность мест в категории
		const isAvailable = await categoryService.checkCategoryAvailability(
			categoryId,
			telegramUser.id,
		);

		if (!isAvailable) {
			throw new Error(`В категории "${category.title}" нет свободных мест`);
		}

		// Проверяем, не голосовал ли пользователь уже за этого игрока
		const existingVote = await prisma.playerVote.findUnique({
			where: {
				playerId_userId: {
					playerId,
					userId: telegramUser.id,
				},
			},
		});

		if (existingVote) {
			// Обновляем существующий голос
			return prisma.playerVote.update({
				where: { id: existingVote.id },
				data: { categoryId },
				include: {
					category: true,
					player: true,
				},
			});
		}

		// Создаем новый голос
		return prisma.playerVote.create({
			data: {
				player: { connect: { id: playerId } },
				user: { connect: { id: telegramUser.id } },
				category: { connect: { id: categoryId } },
			},
			include: {
				category: true,
				player: true,
			},
		});
	}

	// Получение всех игроков для голосования с информацией о голосах пользователя
	async getPlayersForVoting(
		telegramId: string | number,
		releaseId?: number,
	): Promise<PlayerWithCategory[]> {
		// Находим пользователя Telegram
		const telegramUser = await this.findOrCreateTelegramUser(telegramId);

		// Строим запрос
		const query: any = {};
		if (releaseId) {
			query.releaseId = releaseId;
		}

		// Получаем игроков
		const players = await prisma.player.findMany({
			where: query,
			include: {
				votes: {
					where: {
						userId: telegramUser.id,
					},
					include: {
						category: true,
					},
				},
			},
		});

		// Формируем URL для фотографий
		return Promise.all(
			players.map(async (player) => {
				let photoUrl: string | undefined = undefined;

				if (player.photoKey) {
					photoUrl = await storageService.getFileUrl(player.photoKey);
				}

				// Если у игрока есть голос данного пользователя
				const userVote = player.votes[0];

				return {
					id: player.id,
					name: player.name,
					releaseId: player.releaseId,
					photoUrl,
					categoryId: userVote?.categoryId,
					categoryName: userVote?.category.name,
				};
			}),
		);
	}

	// Получение следующего игрока для голосования
	async getNextPlayerForVoting(
		telegramId: string | number,
		releaseId?: number,
	): Promise<PlayerWithCategory | null> {
		// Находим пользователя Telegram
		const telegramUser = await this.findOrCreateTelegramUser(telegramId);

		// Строим запрос для поиска игрока, за которого пользователь еще не голосовал
		const query: any = {
			votes: {
				none: {
					userId: telegramUser.id,
				},
			},
		};

		if (releaseId) {
			query.releaseId = releaseId;
		}

		// Находим первого игрока, за которого пользователь еще не голосовал
		const player = await prisma.player.findFirst({
			where: query,
		});

		if (!player) {
			return null; // Нет игроков для голосования
		}

		let photoUrl: string | undefined = undefined;

		if (player.photoKey) {
			photoUrl = await storageService.getFileUrl(player.photoKey);
		}

		return {
			id: player.id,
			name: player.name,
			releaseId: player.releaseId,
			photoUrl,
		};
	}

	// Получение статистики голосования пользователя
	async getUserVotingStats(telegramId: string | number): Promise<any> {
		// Находим пользователя Telegram
		const telegramUser = await this.findOrCreateTelegramUser(telegramId);

		// Получаем все голоса пользователя
		const votes = await prisma.playerVote.findMany({
			where: {
				userId: telegramUser.id,
			},
			include: {
				player: true,
				category: true,
			},
		});

		// Группируем по категориям
		const categoriesMap = votes.reduce((acc, vote) => {
			const categoryId = vote.categoryId;

			if (!acc[categoryId]) {
				acc[categoryId] = {
					id: vote.category.id,
					name: vote.category.name,
					title: vote.category.title,
					maxPlaces: vote.category.maxPlaces,
					players: [],
				};
			}

			acc[categoryId].players.push({
				id: vote.player.id,
				name: vote.player.name,
			});

			return acc;
		}, {} as Record<string, any>);

		return Object.values(categoriesMap);
	}

	// Получение всех голосов с детальной информацией
	async getAllVotesWithDetails(): Promise<any[]> {
		// Получаем все голоса
		return prisma.playerVote.findMany({
			include: {
				player: true,
				category: true,
				user: true,
			},
		});
	}

	// Служебный метод для поиска или создания пользователя Telegram
	private async findOrCreateTelegramUser(telegramId: string | number) {
		const userTelegramId = BigInt(telegramId.toString());

		// Ищем пользователя
		let telegramUser = await prisma.telegramUser.findUnique({
			where: { telegramId: userTelegramId },
		});

		// Если пользователь не найден, создаем его
		if (!telegramUser) {
			telegramUser = await prisma.telegramUser.create({
				data: { telegramId: userTelegramId },
			});
		}

		return telegramUser;
	}
}

export const voteService = new VoteService();
