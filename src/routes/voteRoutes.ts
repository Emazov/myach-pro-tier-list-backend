import { Router } from 'express';
import { voteController } from '../controllers/voteController';

const router = Router();

// Добавление голоса
router.post('/', voteController.addVote);

// Получение всех игроков для голосования
router.get('/players', voteController.getPlayersForVoting);

// Получение следующего игрока для голосования
router.get('/players/next', voteController.getNextPlayerForVoting);

// Получение статистики голосования пользователя
router.get('/user-stats', voteController.getUserVotingStats);

// Получение всех голосов
router.get('/', voteController.getAllVotes);

export default router;
