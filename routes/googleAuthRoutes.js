import express from 'express';
import { googleAuth, googleCallback, googleFailure } from '../controllers/authController.js';

const router = express.Router();

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/google/failure', googleFailure);

export default router;
