import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import crypto from 'crypto';

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

export interface StoredFile {
	key: string;
	filename: string;
	contentType: string;
	url: string;
}

class StorageService {
	// Проверка, является ли пользователь администратором
	async isAdmin(telegramId: string | number | BigInt): Promise<boolean> {
		if (!TELEGRAM_ADMIN_ID) {
			return false;
		}

		const userTelegramId = BigInt(telegramId.toString());
		return userTelegramId === TELEGRAM_ADMIN_ID;
	}

	// Генерация уникального ключа для файла
	generateUniqueKey(filename: string): string {
		const timestamp = Date.now();
		const randomString = crypto.randomBytes(8).toString('hex');
		const key = `${timestamp}-${randomString}-${filename}`;
		return key;
	}

	// Загрузка файла в R2 хранилище
	async uploadFile(
		file: Buffer,
		filename: string,
		contentType: string,
	): Promise<StoredFile> {
		const key = this.generateUniqueKey(filename);

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: key,
			Body: file,
			ContentType: contentType,
		});

		await r2Client.send(command);

		// Получаем URL для доступа к файлу
		const url = await this.getFileUrl(key);

		return {
			key,
			filename,
			contentType,
			url,
		};
	}

	// Получение URL для доступа к файлу
	async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
		if (!key) return '';

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

	// Удаление файла из R2
	async deleteFile(key: string): Promise<void> {
		if (!key) return;

		const command = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: key,
		});

		await r2Client.send(command);
	}
}

export const storageService = new StorageService();
