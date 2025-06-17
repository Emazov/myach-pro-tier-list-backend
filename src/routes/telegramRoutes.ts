import { Router } from 'express';
import * as telegramController from '../controllers/telegramController';

const router = Router();

// Маршрут для обработки webhook от Telegram
router.post('/webhook', telegramController.webhook);

export default router;
