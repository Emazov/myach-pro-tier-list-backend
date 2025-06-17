import { Router } from 'express';
import multer from 'multer';
import { playerController } from '../controllers/playerController';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Получение всех игроков
router.get('/', playerController.getAllPlayers);

// Получение игрока по ID
router.get('/:id', playerController.getPlayerById);

// Создание нового игрока (с возможностью загрузки фотографии)
router.post('/', upload.single('photo'), playerController.createPlayer);

// Обновление игрока (с возможностью загрузки фотографии)
router.put('/:id', upload.single('photo'), playerController.updatePlayer);

// Удаление игрока
router.delete('/:id', playerController.deletePlayer);

export default router;
