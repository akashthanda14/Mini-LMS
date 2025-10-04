// user_modules/controllers/adminController.js
// Admin authentication controller

import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../services/userService.js';

/**
 * ADMIN LOGIN
 * Authenticates admin using environment variables
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      // Find or create a real admin user in the database
      let adminUser = await findUserByEmail(email);
      if (!adminUser) {
        // Create a minimal admin user record
        adminUser = await createUser({
          name: 'Administrator',
          email,
          role: 'ADMIN',
          emailVerified: true,
          phoneVerified: false,
          isProfileComplete: true,
        });
      }

      const payload = {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role || 'ADMIN',
        loginMethod: 'admin',
        emailVerified: adminUser.emailVerified ?? true,
        phoneVerified: adminUser.phoneVerified ?? false,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token });
    }

    res.json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    console.error('adminLogin error:', error);
    res.json({ success: false, message: error.message });
  }
};

export default { adminLogin };
