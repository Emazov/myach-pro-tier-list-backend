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
import prisma from '../database/prisma';

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
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID
	? BigInt(process.env.TELEGRAM_ADMIN_ID)
	: undefined;

// Интерфейс для файла из БД
interface DBFile {
	id: number;
	key: string;
	filename: string;
	contentType: string;
	size?: number | null;
	description?: string | null;
}

// Интерфейсы
export interface UploadedFile {
	id: number;
	key: string;
	url: string;
	contentType: string;
	filename: string;
	size?: number;
	description?: string;
}

export interface FileUploadOptions {
	telegramUserId?: number;
	description?: string;
}

// Сервис для работы с файлами
export class FileService {
	// Проверка, является ли пользователь администратором
	async isAdmin(telegramId: string | number | BigInt): Promise<boolean> {
		if (!TELEGRAM_ADMIN_ID) {
			return false;
		}

		const userTelegramId = BigInt(telegramId.toString());
		return userTelegramId === TELEGRAM_ADMIN_ID;
	}

	// Загрузка файла в R2 и сохранение метаданных в БД
	async uploadFile(
		file: Buffer,
		filename: string,
		contentType: string,
		options: FileUploadOptions = {},
		telegramId?: string | number,
	): Promise<UploadedFile> {
		// Проверяем права администратора, если передан telegramId
		if (telegramId && !(await this.isAdmin(telegramId))) {
			throw new Error('Недостаточно прав для загрузки файлов');
		}

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
				telegramUserId: options.telegramUserId,
				description: options.description,
			},
		});

		// Формируем URL для доступа к файлу
		const url = await this.getFileUrl(key);

		return {
			id: fileData.id,
			key,
			url,
			contentType,
			filename,
			size: file.length,
			description: fileData.description || undefined,
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
	async deleteFile(key: string, telegramId?: string | number): Promise<void> {
		// Проверяем права администратора, если передан telegramId
		if (telegramId && !(await this.isAdmin(telegramId))) {
			throw new Error('Недостаточно прав для удаления файлов');
		}

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
		telegramUserId?: number,
		telegramId?: string | number,
	): Promise<UploadedFile[]> {
		// Проверяем права администратора для получения списка всех файлов
		if (!(prefix || telegramUserId)) {
			if (telegramId && !(await this.isAdmin(telegramId))) {
				throw new Error('Недостаточно прав для просмотра всех файлов');
			}
		}

		// Если указан telegramUserId, получаем файлы из БД
		if (telegramUserId) {
			const files = await prisma.file.findMany({
				where: {
					telegramUserId,
				},
			});

			return Promise.all(
				files.map(async (file: DBFile) => {
					const url = await this.getFileUrl(file.key);
					return {
						id: file.id,
						key: file.key,
						url,
						contentType: file.contentType,
						filename: file.filename,
						size: file.size || undefined,
						description: file.description || undefined,
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
		const fileMap = new Map(
			filesFromDB.map((file: DBFile) => [file.key, file]),
		);

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
						description: dbFile.description || undefined,
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

	// Получение аватара Telegram пользователя
	async getTelegramUserAvatar(
		telegramUserId: number,
	): Promise<UploadedFile | null> {
		const user = await prisma.telegramUser.findUnique({
			where: { id: telegramUserId },
			include: { files: { take: 1 } },
		});

		if (!user?.files || user.files.length === 0) {
			return null;
		}

		const avatarFile = user.files[0];
		const url = await this.getFileUrl(avatarFile.key);

		return {
			id: avatarFile.id,
			key: avatarFile.key,
			url,
			contentType: avatarFile.contentType,
			filename: avatarFile.filename,
			size: avatarFile.size || undefined,
			description: avatarFile.description || undefined,
		};
	}

	// Получение отдельного файла по ID
	async getFileById(id: number): Promise<UploadedFile | null> {
		const file = await prisma.file.findUnique({
			where: { id },
		});

		if (!file) {
			return null;
		}

		const url = await this.getFileUrl(file.key);

		return {
			id: file.id,
			key: file.key,
			url,
			contentType: file.contentType,
			filename: file.filename,
			size: file.size || undefined,
			description: file.description || undefined,
		};
	}
}

// Экспортируем экземпляр сервиса
export const fileService = new FileService();
