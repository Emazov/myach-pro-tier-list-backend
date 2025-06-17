import prisma from '../database/prisma';
import { fileService } from './fileService';

// Интерфейсы для типизации данных
export interface CreateReleaseDto {
	name: string;
	description?: string;
	logoFileId?: number;
}

export interface UpdateReleaseDto {
	name?: string;
	description?: string;
	logoFileId?: number;
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
				logoFile: true,
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

				if (release.logoFile) {
					logoUrl = await fileService.getFileUrl(release.logoFile.key);
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
				logoFile: true,
				_count: {
					select: { players: true },
				},
			},
		});

		if (!release) {
			return null;
		}

		let logoUrl: string | undefined = undefined;

		if (release.logoFile) {
			logoUrl = await fileService.getFileUrl(release.logoFile.key);
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
		const { name, description, logoFileId } = data;

		// Проверяем существование файла логотипа если он указан
		if (logoFileId) {
			const fileExists = await prisma.file.findUnique({
				where: { id: logoFileId },
			});

			if (!fileExists) {
				throw new Error(`Файл с ID ${logoFileId} не найден`);
			}
		}

		// Создаем релиз
		const release = await prisma.release.create({
			data: {
				name,
				description,
				...(logoFileId && {
					logoFile: {
						connect: { id: logoFileId },
					},
				}),
			},
			include: {
				logoFile: true,
				_count: {
					select: { players: true },
				},
			},
		});

		let logoUrl: string | undefined = undefined;

		if (release.logoFile) {
			logoUrl = await fileService.getFileUrl(release.logoFile.key);
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

	// Обновление релиза
	async updateRelease(
		id: number,
		data: UpdateReleaseDto,
	): Promise<ReleaseWithLogo> {
		const { name, description, logoFileId } = data;

		// Проверяем существование релиза
		const releaseExists = await prisma.release.findUnique({
			where: { id },
		});

		if (!releaseExists) {
			throw new Error(`Релиз с ID ${id} не найден`);
		}

		// Проверяем существование файла логотипа если он указан
		if (logoFileId) {
			const fileExists = await prisma.file.findUnique({
				where: { id: logoFileId },
			});

			if (!fileExists) {
				throw new Error(`Файл с ID ${logoFileId} не найден`);
			}
		}

		// Обновляем релиз
		const release = await prisma.release.update({
			where: { id },
			data: {
				...(name !== undefined && { name }),
				...(description !== undefined && { description }),
				...(logoFileId !== undefined && {
					logoFile: {
						connect: { id: logoFileId },
					},
				}),
			},
			include: {
				logoFile: true,
				_count: {
					select: { players: true },
				},
			},
		});

		let logoUrl: string | undefined = undefined;

		if (release.logoFile) {
			logoUrl = await fileService.getFileUrl(release.logoFile.key);
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

		// Удаляем всех игроков этого релиза
		if (releaseExists.players.length > 0) {
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
			include: {
				photoFile: true,
			},
			orderBy: { number: 'asc' },
		});

		// Формируем URL для фотографий
		return Promise.all(
			players.map(async (player) => {
				let photoUrl: string | undefined = undefined;

				if (player.photoFile) {
					photoUrl = await fileService.getFileUrl(player.photoFile.key);
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
