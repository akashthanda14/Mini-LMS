// user_modules/index.js
// Central export file for user authentication modules

// Export merged auth routes (replaces userRoutes)
export { default as authRoutes } from './routes/authRoutes.js';
// Backwards-compatible export name
export { default as userRoutes } from './routes/authRoutes.js';

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

// Export token services
export {
  createAuthToken,
  verifyAuthToken,
  verifyEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  createProfileCompletionToken,
  verifyProfileCompletionToken,
} from './services/tokenService.js';
