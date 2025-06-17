import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { prisma } from '../database/prisma';

dotenv.config();

// Конфигурация R2
const r2Client = new S3Client({
	region: 'auto',
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY || '',
		secretAccessKey: process.env.R2_SECRET_KEY || '',
	},
});

const bucketName = process.env.R2_BUCKET_NAME || '';

// Интерфейсы
export interface UploadedFile {
	id: number;
	key: string;
	url: string;
	contentType: string;
	filename: string;
	size?: number;
}

export interface FileUploadOptions {
	userId?: number;
	telegramUserId?: number;
	isAvatar?: boolean;
}

// Сервис для работы с файлами
export class FileService {
	// Загрузка файла в R2 и сохранение метаданных в БД
	async uploadFile(
		file: Buffer,
		filename: string,
		contentType: string,
		options: FileUploadOptions = {},
	): Promise<UploadedFile> {
		const key = `${Date.now()}-${filename}`;

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: key,
			Body: file,
			ContentType: contentType,
		});

		await r2Client.send(command);

		// Сохраняем метаданные в базе данных
		const fileData = await prisma.file.create({
			data: {
				key,
				filename,
				contentType,
				size: file.length,
				userId: options.userId,
				telegramUserId: options.telegramUserId,
			},
		});

		// Если это аватар, обновляем связь
		if (options.isAvatar) {
			if (options.userId) {
				await prisma.user.update({
					where: { id: options.userId },
					data: { avatarId: fileData.id },
				});
			} else if (options.telegramUserId) {
				await prisma.telegramUser.update({
					where: { id: options.telegramUserId },
					data: { avatarId: fileData.id },
				});
			}
		}

		// Формируем URL для доступа к файлу
		const url = await this.getFileUrl(key);

		return {
			id: fileData.id,
			key,
			url,
			contentType,
			filename,
			size: file.length,
		};
	}

	// Получение URL для доступа к файлу
	async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: key,
		});

		return getSignedUrl(r2Client, command, { expiresIn });
	}

	// Получение файла из R2
	async getFile(
		key: string,
	): Promise<{ stream: Readable; contentType: string }> {
		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: key,
		});

		const response = await r2Client.send(command);

		if (!response.Body || !response.ContentType) {
			throw new Error('Файл не найден или содержимое недоступно');
		}

		return {
			stream: response.Body as Readable,
			contentType: response.ContentType,
		};
	}

	// Удаление файла из R2 и из БД
	async deleteFile(key: string): Promise<void> {
		// Удаляем из R2
		const command = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: key,
		});

		await r2Client.send(command);

		// Удаляем запись из БД
		await prisma.file
			.delete({
				where: { key },
			})
			.catch(() => {
				console.warn(`Файл с ключом ${key} не найден в БД`);
			});
	}

	// Получение списка файлов
	async listFiles(
		prefix?: string,
		userId?: number,
		telegramUserId?: number,
	): Promise<UploadedFile[]> {
		// Если указан userId или telegramUserId, получаем файлы из БД
		if (userId || telegramUserId) {
			const files = await prisma.file.findMany({
				where: {
					OR: [
						{ userId: userId || undefined },
						{ telegramUserId: telegramUserId || undefined },
					],
				},
			});

			return Promise.all(
				files.map(async (file) => {
					const url = await this.getFileUrl(file.key);
					return {
						id: file.id,
						key: file.key,
						url,
						contentType: file.contentType,
						filename: file.filename,
						size: file.size || undefined,
					};
				}),
			);
		}

		// Иначе получаем из R2
		const command = new ListObjectsV2Command({
			Bucket: bucketName,
			Prefix: prefix,
		});

		const response = await r2Client.send(command);
		const filesFromR2 = response.Contents || [];

		// Для каждого файла из R2 находим соответствие в БД
		const fileKeys = filesFromR2
			.map((file) => file.Key)
			.filter(Boolean) as string[];

		if (fileKeys.length === 0) {
			return [];
		}

		const filesFromDB = await prisma.file.findMany({
			where: {
				key: {
					in: fileKeys,
				},
			},
		});

		// Создаем карту файлов из БД по ключу для быстрого доступа
		const fileMap = new Map(filesFromDB.map((file) => [file.key, file]));

		// Получаем URL для каждого файла
		const result = await Promise.all(
			filesFromR2.map(async (file) => {
				if (!file.Key) return null;
				const url = await this.getFileUrl(file.Key);
				const dbFile = fileMap.get(file.Key);

				if (dbFile) {
					return {
						id: dbFile.id,
						key: file.Key,
						url,
						contentType: dbFile.contentType,
						filename: dbFile.filename,
						size: dbFile.size || undefined,
					};
				}

				// Если файл есть в R2, но нет в БД, возвращаем базовую информацию
				return {
					id: 0, // временный ID
					key: file.Key,
					url,
					contentType: 'application/octet-stream',
					filename: file.Key.split('/').pop() || file.Key,
					size: file.Size,
				};
			}),
		);

		return result.filter(Boolean) as UploadedFile[];
	}

	// Получение аватара пользователя
	async getUserAvatar(userId: number): Promise<UploadedFile | null> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: { avatar: true },
		});

		if (!user?.avatar) {
			return null;
		}

		const url = await this.getFileUrl(user.avatar.key);

		return {
			id: user.avatar.id,
			key: user.avatar.key,
			url,
			contentType: user.avatar.contentType,
			filename: user.avatar.filename,
			size: user.avatar.size || undefined,
		};
	}

	// Получение аватара Telegram пользователя
	async getTelegramUserAvatar(
		telegramUserId: number,
	): Promise<UploadedFile | null> {
		const user = await prisma.telegramUser.findUnique({
			where: { id: telegramUserId },
			include: { avatar: true },
		});

		if (!user?.avatar) {
			return null;
		}

		const url = await this.getFileUrl(user.avatar.key);

		return {
			id: user.avatar.id,
			key: user.avatar.key,
			url,
			contentType: user.avatar.contentType,
			filename: user.avatar.filename,
			size: user.avatar.size || undefined,
		};
	}
}

// Экспортируем экземпляр сервиса
export const fileService = new FileService();
