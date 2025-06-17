import TelegramBot from 'node-telegram-bot-api';
import prisma from '../database/prisma';

class TelegramService {
	private bot: TelegramBot;

	constructor() {
		const token = process.env.TELEGRAM_BOT_TOKEN;

		if (!token) {
			throw new Error('TELEGRAM_BOT_TOKEN не найден в переменных окружения');
		}

		// В режиме разработки используем polling, в продакшене - webhooks
		const options: TelegramBot.ConstructorOptions = {};
		if (process.env.NODE_ENV !== 'production') {
			options.polling = true;
		}

		this.bot = new TelegramBot(token, options);

		// Если используем long polling, настраиваем обработчики событий сразу
		if (options.polling) {
			this.setupEventHandlers();
		}
	}

	// Настройка обработчиков событий для режима polling
	private setupEventHandlers(): void {
		// Обработка команды /start
		this.bot.onText(/\/start/, async (msg) => {
			await this.handleStartCommand(msg);
		});

		// Обработка ошибок
		this.bot.on('error', (error) => {
			console.error('Telegram bot error:', error);
		});

		// Обработка polling_error
		this.bot.on('polling_error', (error) => {
			console.error('Telegram polling error:', error);
		});

		console.log('Telegram бот настроен в режиме Long Polling');
	}

	// Инициализация бота в режиме webhook
	public initWebhook(url: string): void {
		this.bot.setWebHook(`${url}/api/telegram/webhook`);
	}

	// Получение инстанса бота
	public getBot(): TelegramBot {
		return this.bot;
	}

	// Обработка входящего сообщения от Telegram
	public async processUpdate(update: TelegramBot.Update): Promise<void> {
		if (update.message && update.message.text === '/start') {
			await this.handleStartCommand(update.message);
		}
	}

	// Обработка команды /start
	private async handleStartCommand(
		message: TelegramBot.Message,
	): Promise<void> {
		const { from } = message;

		if (!from) return;

		try {
			// Проверка, существует ли пользователь
			const existingUser = await prisma.telegramUser.findUnique({
				where: { telegramId: BigInt(from.id) },
			});

			if (!existingUser) {
				// Сохранение нового пользователя
				await prisma.telegramUser.create({
					data: {
						telegramId: BigInt(from.id),
						username: from.username || null,
						firstName: from.first_name || null,
						lastName: from.last_name || null,
					},
				});

				// todo: убрать консоль
				console.log(
					`Новый пользователь Telegram сохранен: ${from.username || from.id}`,
				);
			}

			// Отправка приветственного сообщения
			await this.bot.sendMessage(
				from.id,
				`Привет, ${
					from.first_name || 'пользователь'
				}! 👋\nДобро пожаловать в наш бот.`,
			);
		} catch (error) {
			console.error('Ошибка при обработке команды /start:', error);
		}
	}
}

// Создаем и экспортируем единственный экземпляр сервиса
const telegramService = new TelegramService();
export default telegramService;
