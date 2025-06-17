import prisma from '../database/prisma';
import { storageService, StoredFile } from './storageService';

// Интерфейсы для типизации данных
export interface CreateReleaseDto {
	name: string;
	description?: string;
	logo?: {
		buffer: Buffer;
		originalname: string;
		mimetype: string;
	};
}

export interface UpdateReleaseDto {
	name?: string;
	description?: string;
	logo?: {
		buffer: Buffer;
		originalname: string;
		mimetype: string;
	};
	removeLogo?: boolean;
}

export interface ReleaseWithLogo {
	id: number;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	logoUrl?: string;
	playersCount: number;
}

class ReleaseService {
	// Получение всех релизов
	async getAllReleases(): Promise<ReleaseWithLogo[]> {
		const releases = await prisma.release.findMany({
			include: {
				_count: {
					select: { players: true },
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		// Формируем URL для логотипов
		return Promise.all(
			releases.map(async (release) => {
				let logoUrl: string | undefined = undefined;

				if (release.logoKey) {
					logoUrl = await storageService.getFileUrl(release.logoKey);
				}

				return {
					id: release.id,
					name: release.name,
					description: release.description,
					createdAt: release.createdAt,
					updatedAt: release.updatedAt,
					logoUrl,
					playersCount: release._count.players,
				};
			}),
		);
	}

	// Получение релиза по ID
	async getReleaseById(id: number): Promise<ReleaseWithLogo | null> {
		const release = await prisma.release.findUnique({
			where: { id },
			include: {
				_count: {
					select: { players: true },
				},
			},
		});

		if (!release) {
			return null;
		}

		let logoUrl: string | undefined = undefined;

		if (release.logoKey) {
			logoUrl = await storageService.getFileUrl(release.logoKey);
		}

		return {
			id: release.id,
			name: release.name,
			description: release.description,
			createdAt: release.createdAt,
			updatedAt: release.updatedAt,
			logoUrl,
			playersCount: release._count.players,
		};
	}

	// Создание нового релиза
	async createRelease(data: CreateReleaseDto): Promise<ReleaseWithLogo> {
		const { name, description, logo } = data;

		// Загружаем логотип если есть
		let storedLogo: StoredFile | undefined;

		if (logo) {
			storedLogo = await storageService.uploadFile(
				logo.buffer,
				logo.originalname,
				logo.mimetype,
			);
		}

		// Создаем релиз
		const release = await prisma.release.create({
			data: {
				name,
				description,
				...(storedLogo && {
					logoKey: storedLogo.key,
					logoFilename: storedLogo.filename,
					logoContentType: storedLogo.contentType,
				}),
			},
			include: {
				_count: {
					select: { players: true },
				},
			},
		});

		return {
			id: release.id,
			name: release.name,
			description: release.description,
			createdAt: release.createdAt,
			updatedAt: release.updatedAt,
			logoUrl: storedLogo?.url,
			playersCount: release._count.players,
		};
	}

	// Обновление релиза
	async updateRelease(
		id: number,
		data: UpdateReleaseDto,
	): Promise<ReleaseWithLogo> {
		const { name, description, logo, removeLogo } = data;

		// Проверяем существование релиза
		const releaseExists = await prisma.release.findUnique({
			where: { id },
		});

		if (!releaseExists) {
			throw new Error(`Релиз с ID ${id} не найден`);
		}

		// Загружаем новый логотип если есть
		let storedLogo: StoredFile | undefined;

		if (logo) {
			storedLogo = await storageService.uploadFile(
				logo.buffer,
				logo.originalname,
				logo.mimetype,
			);

			// Удаляем старый логотип
			if (releaseExists.logoKey) {
				await storageService.deleteFile(releaseExists.logoKey);
			}
		}

		// Если нужно удалить логотип и не загружать новый
		if (removeLogo && !logo && releaseExists.logoKey) {
			await storageService.deleteFile(releaseExists.logoKey);
		}

		// Обновляем релиз
		const release = await prisma.release.update({
			where: { id },
			data: {
				...(name !== undefined && { name }),
				...(description !== undefined && { description }),
				...(removeLogo &&
					!storedLogo && {
						logoKey: null,
						logoFilename: null,
						logoContentType: null,
					}),
				...(storedLogo && {
					logoKey: storedLogo.key,
					logoFilename: storedLogo.filename,
					logoContentType: storedLogo.contentType,
				}),
			},
			include: {
				_count: {
					select: { players: true },
				},
			},
		});

		let logoUrl: string | undefined = undefined;

		if (release.logoKey) {
			logoUrl = await storageService.getFileUrl(release.logoKey);
		}

		return {
			id: release.id,
			name: release.name,
			description: release.description,
			createdAt: release.createdAt,
			updatedAt: release.updatedAt,
			logoUrl,
			playersCount: release._count.players,
		};
	}

	// Удаление релиза
	async deleteRelease(id: number): Promise<void> {
		// Проверяем существование релиза
		const releaseExists = await prisma.release.findUnique({
			where: { id },
			include: {
				players: true,
			},
		});

		if (!releaseExists) {
			throw new Error(`Релиз с ID ${id} не найден`);
		}

		// Удаляем логотип если есть
		if (releaseExists.logoKey) {
			await storageService.deleteFile(releaseExists.logoKey);
		}

		// Удаляем фотографии всех игроков
		if (releaseExists.players.length > 0) {
			for (const player of releaseExists.players) {
				if (player.photoKey) {
					await storageService.deleteFile(player.photoKey);
				}
			}

			// Удаляем всех игроков этого релиза
			await prisma.player.deleteMany({
				where: {
					releaseId: id,
				},
			});
		}

		// Удаляем релиз
		await prisma.release.delete({
			where: { id },
		});
	}

	// Получение всех игроков определенного релиза
	async getReleasePlayers(releaseId: number) {
		// Проверяем существование релиза
		const releaseExists = await prisma.release.findUnique({
			where: { id: releaseId },
		});

		if (!releaseExists) {
			throw new Error(`Релиз с ID ${releaseId} не найден`);
		}

		const players = await prisma.player.findMany({
			where: { releaseId },
			orderBy: { number: 'asc' },
		});

		// Формируем URL для фотографий
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
					createdAt: player.createdAt,
					updatedAt: player.updatedAt,
					photoUrl,
				};
			}),
		);
	}
}

export const releaseService = new ReleaseService();
