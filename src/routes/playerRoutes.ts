import express from 'express';
import { playerController } from '../controllers/playerController';

const router = express.Router();

// Получение всех игроков
router.get('/', playerController.getAllPlayers);

// Получение игрока по ID
router.get('/:id', playerController.getPlayerById);

// Создание нового игрока (только для админа)
router.post('/', playerController.createPlayer);

// Обновление игрока (только для админа)
router.put('/:id', playerController.updatePlayer);

// Удаление игрока (только для админа)
router.delete('/:id', playerController.deletePlayer);

export default router;
