// user_modules/routes/adminRoutes.js
// Admin authentication routes

import express from 'express';
import { adminLogin } from '../controllers/adminController.js';

const router = express.Router();

// Admin login endpoint
router.post('/login', adminLogin);

export default router;
