import { Request, Response } from 'express';
import { userService } from '../services/userService';

export class UserController {
	async getAllUsers(req: Request, res: Response) {
		try {
			const users = await userService.getAllUsers();
			res.json(users);
		} catch (error) {
			console.error('Ошибка при получении пользователей:', error);
			res.status(500).json({ message: 'Ошибка при получении пользователей' });
		}
	}

	async getUserById(req: Request, res: Response) {
		try {
			const userId = parseInt(req.params.id);
			const user = await userService.getUserById(userId);

			if (!user) {
				return res.status(404).json({ message: 'Пользователь не найден' });
			}

			res.json(user);
		} catch (error) {
			console.error('Ошибка при получении пользователя:', error);
			res.status(500).json({ message: 'Ошибка при получении пользователя' });
		}
	}

	async createUser(req: Request, res: Response) {
		try {
			const { email, name, password } = req.body;

			if (!email || !password) {
				return res.status(400).json({ message: 'Email и пароль обязательны' });
			}

			const newUser = await userService.createUser({ email, name, password });
			res.status(201).json(newUser);
		} catch (error: any) {
			console.error('Ошибка при создании пользователя:', error);

			if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
				return res
					.status(400)
					.json({ message: 'Пользователь с таким email уже существует' });
			}

			res.status(500).json({ message: 'Ошибка при создании пользователя' });
		}
	}

	async updateUser(req: Request, res: Response) {
		try {
			const userId = parseInt(req.params.id);
			const { name, email } = req.body;

			const userExists = await userService.getUserById(userId);
			if (!userExists) {
				return res.status(404).json({ message: 'Пользователь не найден' });
			}

			const updatedUser = await userService.updateUser(userId, { name, email });
			res.json(updatedUser);
		} catch (error: any) {
			console.error('Ошибка при обновлении пользователя:', error);

			if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
				return res
					.status(400)
					.json({ message: 'Пользователь с таким email уже существует' });
			}

			res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
		}
	}

	async deleteUser(req: Request, res: Response) {
		try {
			const userId = parseInt(req.params.id);

			const userExists = await userService.getUserById(userId);
			if (!userExists) {
				return res.status(404).json({ message: 'Пользователь не найден' });
			}

			await userService.deleteUser(userId);
			res.status(204).end();
		} catch (error) {
			console.error('Ошибка при удалении пользователя:', error);
			res.status(500).json({ message: 'Ошибка при удалении пользователя' });
		}
	}
}

export const userController = new UserController();
