import { Request, Response } from 'express';
import { voteService } from '../services/voteService';
import { storageService } from '../services/storageService';

class VoteController {
	// Добавление голоса
	async addVote(req: Request, res: Response) {
		try {
			const { telegramId, playerId, categoryId } = req.body;

			if (!telegramId || !playerId || !categoryId) {
				return res.status(400).json({
					error:
						'Не указаны обязательные поля: telegramId, playerId, categoryId',
				});
			}

			const vote = await voteService.addVote({
				telegramId,
				playerId: parseInt(playerId.toString()),
				categoryId: parseInt(categoryId.toString()),
			});

			res.status(201).json(vote);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение всех игроков для голосования
	async getPlayersForVoting(req: Request, res: Response) {
		try {
			const telegramId = req.query.telegramId;
			const releaseId = req.query.releaseId
				? parseInt(req.query.releaseId.toString())
				: undefined;

			if (!telegramId || Array.isArray(telegramId)) {
				return res.status(400).json({
					error: 'Не указан обязательный параметр: telegramId',
				});
			}

			const players = await voteService.getPlayersForVoting(
				telegramId.toString(),
				releaseId,
			);
			res.status(200).json(players);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение следующего игрока для голосования
	async getNextPlayerForVoting(req: Request, res: Response) {
		try {
			const telegramId = req.query.telegramId;
			const releaseId = req.query.releaseId
				? parseInt(req.query.releaseId.toString())
				: undefined;

			if (!telegramId || Array.isArray(telegramId)) {
				return res.status(400).json({
					error: 'Не указан обязательный параметр: telegramId',
				});
			}

			const player = await voteService.getNextPlayerForVoting(
				telegramId.toString(),
				releaseId,
			);

			if (!player) {
				return res
					.status(404)
					.json({ message: 'Нет доступных игроков для голосования' });
			}

			res.status(200).json(player);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение статистики голосования пользователя
	async getUserVotingStats(req: Request, res: Response) {
		try {
			const telegramId = req.query.telegramId;

			if (!telegramId || Array.isArray(telegramId)) {
				return res.status(400).json({
					error: 'Не указан обязательный параметр: telegramId',
				});
			}

			const stats = await voteService.getUserVotingStats(telegramId.toString());
			res.status(200).json(stats);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Получение всех голосов (только для админа)
	async getAllVotes(req: Request, res: Response) {
		try {
			const telegramId = req.query.telegramId;

			if (!telegramId || Array.isArray(telegramId)) {
				return res.status(400).json({
					error: 'Не указан обязательный параметр: telegramId',
				});
			}

			// Проверка прав администратора
			const isAdmin = await storageService.isAdmin(telegramId.toString());
			if (!isAdmin) {
				return res.status(403).json({
					error:
						'Доступ запрещен. Только администратор может просматривать все голоса.',
				});
			}

			const votes = await voteService.getAllVotesWithDetails();
			res.status(200).json(votes);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}
}

export const voteController = new VoteController();
