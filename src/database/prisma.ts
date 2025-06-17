import { PrismaClient } from '../generated/prisma';

// Создание глобального экземпляра Prisma Client
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
	prisma = new PrismaClient();
} else {
	// В режиме разработки переиспользуем экземпляр, чтобы избежать множественных подключений
	if (!(global as any).prisma) {
		(global as any).prisma = new PrismaClient();
	}
	prisma = (global as any).prisma;
}

export default prisma;
