import prisma from '../database/prisma';
import { fileService } from './fileService';

// Интерфейсы для типизации данных
export interface CreatePlayerDto {
  name: string;
  position?: string;
  number?: number;
  description?: string;
  photoFileId?: number;
  releaseId: number;
}

export interface UpdatePlayerDto {
  name?: string;
  position?: string;
  number?: number;
  description?: string;
  photoFileId?: number;
}

export interface PlayerWithPhoto {
  id: number;
  name: string;
  position: string | null;
  number: number | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  releaseId: number;
  photoUrl?: string;
}

class PlayerService {
  // Получение всех игроков с фотографиями
  async getAllPlayers(): Promise<PlayerWithPhoto[]> {
    const players = await prisma.player.findMany({
      include: {
        photoFile: true,
      },
      orderBy: { releaseId: 'desc' }
    });

    // Формируем URL для фотографий
    return Promise.all(players.map(async player => {
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
        releaseId: player.releaseId,
        photoUrl
      };
    }));
  }

  // Получение игрока по ID
  async getPlayerById(id: number): Promise<PlayerWithPhoto | null> {
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        photoFile: true
      }
    });

    if (!player) {
      return null;
    }

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
      releaseId: player.releaseId,
      photoUrl
    };
  }

  // Создание нового игрока
  async createPlayer(data: CreatePlayerDto): Promise<PlayerWithPhoto> {
    const { name, position, number, description, photoFileId, releaseId } = data;

    // Проверяем существование релиза
    const releaseExists = await prisma.release.findUnique({
      where: { id: releaseId }
    });

    if (!releaseExists) {
      throw new Error(`Релиз с ID ${releaseId} не найден`);
    }

    // Проверяем количество игроков в релизе
    const playersCount = await prisma.player.count({
      where: { releaseId }
    });

    if (playersCount >= 20) {
      throw new Error(`В релизе уже максимальное количество игроков (20)`);
    }

    // Проверяем существование фото если оно указано
    if (photoFileId) {
      const fileExists = await prisma.file.findUnique({
        where: { id: photoFileId }
      });

      if (!fileExists) {
        throw new Error(`Файл с ID ${photoFileId} не найден`);
      }
    }

    // Создаем игрока
    const player = await prisma.player.create({
      data: {
        name,
        position,
        number,
        description,
        release: {
          connect: { id: releaseId }
        },
        ...(photoFileId && {
          photoFile: {
            connect: { id: photoFileId }
          }
        })
      },
      include: {
        photoFile: true
      }
    });

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
      releaseId: player.releaseId,
      photoUrl
    };
  }

  // Обновление игрока
  async updatePlayer(id: number, data: UpdatePlayerDto): Promise<PlayerWithPhoto> {
    const { name, position, number, description, photoFileId } = data;

    // Проверяем существование игрока
    const playerExists = await prisma.player.findUnique({
      where: { id }
    });

    if (!playerExists) {
      throw new Error(`Игрок с ID ${id} не найден`);
    }

    // Проверяем существование фото если оно указано
    if (photoFileId) {
      const fileExists = await prisma.file.findUnique({
        where: { id: photoFileId }
      });

      if (!fileExists) {
        throw new Error(`Файл с ID ${photoFileId} не найден`);
      }
    }

    // Обновляем игрока
    const player = await prisma.player.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(position !== undefined && { position }),
        ...(number !== undefined && { number }),
        ...(description !== undefined && { description }),
        ...(photoFileId !== undefined && {
          photoFile: {
            connect: { id: photoFileId }
          }
        })
      },
      include: {
        photoFile: true
      }
    });

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
      releaseId: player.releaseId,
      photoUrl
    };
  }

  // Удаление игрока
  async deletePlayer(id: number): Promise<void> {
    // Проверяем существование игрока
    const playerExists = await prisma.player.findUnique({
      where: { id }
    });

    if (!playerExists) {
      throw new Error(`Игрок с ID ${id} не найден`);
    }

    // Удаляем игрока
    await prisma.player.delete({
      where: { id }
    });
  }
}

export const playerService = new PlayerService(); 