// user_modules/index.js
// Central export file for user authentication modules

// Export all routes
export { default as userRoutes } from './routes/userRoutes.js';
export { default as adminRoutes } from './routes/adminRoutes.js';

// Export user controllers
export {
  registerUser,
  verifyEmailOtp,
  verifyPhoneOtp,
  completeProfile,
  loginUser,
} from './controllers/userController.js';

// Export auth controllers
export {
  forgotPassword,
  resetPassword,
} from './controllers/authController.js';

// Export profile controllers
export {
  requestEmailChange,
  verifyEmailChange,
  requestPhoneChange,
  verifyPhoneChange,
} from './controllers/profileController.js';

// Export admin controllers
export {
  adminLogin,
} from './controllers/adminController.js';

// Export user services
export {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  updateProfile,
  updateProfileCompletion,
  verifyUserEmail,
  verifyUserPhone,
} from './services/userService.js';

// Export OTP services
export {
  storeEmailOTP,
  verifyEmailOtpService,
  verifyEmailOTPByUserId,
  storePhoneOTP,
  verifyPhoneOtpService,
} from './services/otpService.js';
