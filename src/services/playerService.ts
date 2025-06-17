import prisma from '../database/prisma';
import { storageService, StoredFile } from './storageService';

// Интерфейсы для типизации данных
export interface CreatePlayerDto {
	name: string;
	position?: string;
	number?: number;
	description?: string;
	releaseId: number;
	photo?: {
		buffer: Buffer;
		originalname: string;
		mimetype: string;
	};
}

export interface UpdatePlayerDto {
	name?: string;
	position?: string;
	number?: number;
	description?: string;
	photo?: {
		buffer: Buffer;
		originalname: string;
		mimetype: string;
	};
	removePhoto?: boolean;
}

export interface PlayerWithPhoto {
	id: number;
	name: string;
	position: string | null;
	number: number | null;
	description: string | null;
	releaseId: number;
	createdAt: Date;
	updatedAt: Date;
	photoUrl?: string;
}

class PlayerService {
	// Получение всех игроков
	async getAllPlayers(): Promise<PlayerWithPhoto[]> {
		const players = await prisma.player.findMany({
			orderBy: { releaseId: 'asc' },
		});

		return Promise.all(
			players.map(async (player) => {
				let photoUrl: string | undefined = undefined;

				if (player.photoKey) {
					photoUrl = await storageService.getFileUrl(player.photoKey);
				}

				return {
					id: player.id,
					name: player.name,
					position: player.position,
					number: player.number,
					description: player.description,
					releaseId: player.releaseId,
					createdAt: player.createdAt,
					updatedAt: player.updatedAt,
					photoUrl,
				};
			}),
		);
	}

	// Получение игрока по ID
	async getPlayerById(id: number): Promise<PlayerWithPhoto | null> {
		const player = await prisma.player.findUnique({
			where: { id },
		});

		if (!player) {
			return null;
		}

		let photoUrl: string | undefined = undefined;

		if (player.photoKey) {
			photoUrl = await storageService.getFileUrl(player.photoKey);
		}

		return {
			id: player.id,
			name: player.name,
			position: player.position,
			number: player.number,
			description: player.description,
			releaseId: player.releaseId,
			createdAt: player.createdAt,
			updatedAt: player.updatedAt,
			photoUrl,
		};
	}

	// Создание нового игрока
	async createPlayer(data: CreatePlayerDto): Promise<PlayerWithPhoto> {
		const { name, position, number, description, releaseId, photo } = data;

		// Проверяем существование релиза
		const releaseExists = await prisma.release.findUnique({
			where: { id: releaseId },
		});

		if (!releaseExists) {
			throw new Error(`Релиз с ID ${releaseId} не найден`);
		}

		// Загружаем фотографию если есть
		let storedPhoto: StoredFile | undefined;

		if (photo) {
			storedPhoto = await storageService.uploadFile(
				photo.buffer,
				photo.originalname,
				photo.mimetype,
			);
		}

		// Создаем игрока
		const player = await prisma.player.create({
			data: {
				name,
				position,
				number,
				description,
				releaseId,
				...(storedPhoto && {
					photoKey: storedPhoto.key,
					photoFilename: storedPhoto.filename,
					photoContentType: storedPhoto.contentType,
				}),
			},
		});

		return {
			id: player.id,
			name: player.name,
			position: player.position,
			number: player.number,
			description: player.description,
			releaseId: player.releaseId,
			createdAt: player.createdAt,
			updatedAt: player.updatedAt,
			photoUrl: storedPhoto?.url,
		};
	}

	// Обновление игрока
	async updatePlayer(
		id: number,
		data: UpdatePlayerDto,
	): Promise<PlayerWithPhoto> {
		const { name, position, number, description, photo, removePhoto } = data;

		// Проверяем существование игрока
		const playerExists = await prisma.player.findUnique({
			where: { id },
		});

		if (!playerExists) {
			throw new Error(`Игрок с ID ${id} не найден`);
		}

		// Загружаем новую фотографию если есть
		let storedPhoto: StoredFile | undefined;

		if (photo) {
			storedPhoto = await storageService.uploadFile(
				photo.buffer,
				photo.originalname,
				photo.mimetype,
			);

			// Удаляем старую фотографию
			if (playerExists.photoKey) {
				await storageService.deleteFile(playerExists.photoKey);
			}
		}

		// Если нужно удалить фотографию и не загружать новую
		if (removePhoto && !photo && playerExists.photoKey) {
			await storageService.deleteFile(playerExists.photoKey);
		}

		// Обновляем игрока
		const player = await prisma.player.update({
			where: { id },
			data: {
				...(name !== undefined && { name }),
				...(position !== undefined && { position }),
				...(number !== undefined && { number }),
				...(description !== undefined && { description }),
				...(removePhoto &&
					!storedPhoto && {
						photoKey: null,
						photoFilename: null,
						photoContentType: null,
					}),
				...(storedPhoto && {
					photoKey: storedPhoto.key,
					photoFilename: storedPhoto.filename,
					photoContentType: storedPhoto.contentType,
				}),
			},
		});

		let photoUrl: string | undefined = undefined;

		if (player.photoKey) {
			photoUrl = await storageService.getFileUrl(player.photoKey);
		}

		return {
			id: player.id,
			name: player.name,
			position: player.position,
			number: player.number,
			description: player.description,
			releaseId: player.releaseId,
			createdAt: player.createdAt,
			updatedAt: player.updatedAt,
			photoUrl,
		};
	}

	// Удаление игрока
	async deletePlayer(id: number): Promise<void> {
		// Проверяем существование игрока
		const playerExists = await prisma.player.findUnique({
			where: { id },
		});

		if (!playerExists) {
			throw new Error(`Игрок с ID ${id} не найден`);
		}

		// Удаляем фотографию если есть
		if (playerExists.photoKey) {
			await storageService.deleteFile(playerExists.photoKey);
		}

		// Удаляем игрока
		await prisma.player.delete({
			where: { id },
		});
	}
}

export const playerService = new PlayerService();
