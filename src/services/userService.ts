import prisma from '../database/prisma';

export const userService = {
	/**
	 * Получить всех пользователей
	 */
	getAllUsers() {
		return prisma.user.findMany({
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true,
			},
		});
	},

	/**
	 * Найти пользователя по ID
	 */
	getUserById(userId: number) {
		return prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true,
			},
		});
	},

	/**
	 * Создать нового пользователя
	 */
	createUser(data: { email: string; name?: string; password: string }) {
		return prisma.user.create({
			data,
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true,
			},
		});
	},

	/**
	 * Обновить данные пользователя
	 */
	updateUser(userId: number, data: { name?: string; email?: string }) {
		return prisma.user.update({
			where: { id: userId },
			data,
			select: {
				id: true,
				email: true,
				name: true,
				updatedAt: true,
			},
		});
	},

	/**
	 * Удалить пользователя
	 */
	deleteUser(userId: number) {
		return prisma.user.delete({
			where: { id: userId },
		});
	},
};
