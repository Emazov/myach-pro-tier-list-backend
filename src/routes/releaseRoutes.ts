import express from 'express';
import { releaseController } from '../controllers/releaseController';

const router = express.Router();

// Получение всех релизов
router.get('/', releaseController.getAllReleases);

// Получение релиза по ID
router.get('/:id', releaseController.getReleaseById);

// Получение всех игроков релиза
router.get('/:id/players', releaseController.getReleasePlayers);

// Создание нового релиза (только для админа)
router.post('/', releaseController.createRelease);

// Обновление релиза (только для админа)
router.put('/:id', releaseController.updateRelease);

// Удаление релиза (только для админа)
router.delete('/:id', releaseController.deleteRelease);

export default router;
