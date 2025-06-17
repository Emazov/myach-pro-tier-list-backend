import { Router } from 'express';
import multer from 'multer';
import { releaseController } from '../controllers/releaseController';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Получение всех релизов
router.get('/', releaseController.getAllReleases);

// Получение релиза по ID
router.get('/:id', releaseController.getReleaseById);

// Получение всех игроков релиза
router.get('/:id/players', releaseController.getReleasePlayers);

// Создание нового релиза (с возможностью загрузки логотипа)
router.post('/', upload.single('logo'), releaseController.createRelease);

// Обновление релиза (с возможностью загрузки логотипа)
router.put('/:id', upload.single('logo'), releaseController.updateRelease);

// Удаление релиза
router.delete('/:id', releaseController.deleteRelease);

export default router;
