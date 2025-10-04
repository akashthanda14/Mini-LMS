// EXAMPLE: How to integrate user_modules into your server.js
// This is a reference file - DO NOT run this directly

/*
==============================================================================
  STEP 1: Import the new routes
==============================================================================
*/

// At the top of your server.js file, add these imports:
import userAuthRoutes from './user_modules/routes/userRoutes.js';
import adminAuthRoutes from './user_modules/routes/adminRoutes.js';

/*
==============================================================================
  STEP 2: Register the routes with your Express app
==============================================================================
*/

// After your middleware setup and before your existing routes, add:
app.use('/api/user-auth', userAuthRoutes);
app.use('/api/admin-auth', adminAuthRoutes);

/*
==============================================================================
  COMPLETE EXAMPLE: Minimal server.js setup
==============================================================================
*/

/*
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import user authentication modules
import userAuthRoutes from './user_modules/routes/userRoutes.js';
import adminAuthRoutes from './user_modules/routes/adminRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Authentication routes (NEW - from user_modules)
app.use('/api/user-auth', userAuthRoutes);
app.use('/api/admin-auth', adminAuthRoutes);

// Your other existing routes
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// etc...

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 User auth available at: http://localhost:${PORT}/api/user-auth`);
  console.log(`🔐 Admin auth available at: http://localhost:${PORT}/api/admin-auth`);
});
*/

/*
==============================================================================
  STEP 3: Test the new endpoints
==============================================================================
*/

/*
Available endpoints after integration:

USER AUTHENTICATION:
  POST /api/user-auth/register           - Register with email or phone
  POST /api/user-auth/verify-email-otp   - Verify email OTP
  POST /api/user-auth/verify-phone-otp   - Verify phone OTP
  POST /api/user-auth/complete-profile   - Complete user profile
  POST /api/user-auth/login              - Login with credentials
  POST /api/user-auth/forgot-password    - Request password reset
  POST /api/user-auth/reset-password     - Reset password with OTP
  
PROFILE MANAGEMENT (Protected):
  POST /api/user-auth/request-email-change   - Request email change
  POST /api/user-auth/verify-email-change    - Verify email change
  POST /api/user-auth/request-phone-change   - Request phone change
  POST /api/user-auth/verify-phone-change    - Verify phone change
  GET  /api/user-auth/auth/status            - Get auth status

ADMIN:
  POST /api/admin-auth/login             - Admin login
*/

/*
==============================================================================
  STEP 4: Example API calls
==============================================================================
*/

/*
// Example 1: User Registration with Email
fetch('http://localhost:3000/api/user-auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com'
  })
});

// Example 2: Verify Email OTP
fetch('http://localhost:3000/api/user-auth/verify-email-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    otp: '123456'
  })
});

// Example 3: Complete Profile
fetch('http://localhost:3000/api/user-auth/complete-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 123,
    name: 'John Doe',
    password: 'SecurePassword123'
  })
});

// Example 4: Login
fetch('http://localhost:3000/api/user-auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailOrPhone: 'user@example.com',
    password: 'SecurePassword123'
  })
});

// Example 5: Request Email Change (Protected - requires JWT token)
fetch('http://localhost:3000/api/user-auth/request-email-change', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  },
  body: JSON.stringify({
    newEmail: 'newemail@example.com'
  })
});
*/

/*
==============================================================================
  STEP 5: Backward Compatibility (Optional)
==============================================================================
*/

/*
// If you want to keep old routes working during migration, you can:
// Option A: Keep both old and new routes
app.use('/api/user-auth', userAuthRoutes);  // New routes
app.use('/api/user', oldUserRoute);          // Old routes

// Option B: Redirect old routes to new ones
app.use('/api/user/*', (req, res, next) => {
  const newPath = req.path.replace('/api/user', '/api/user-auth');
  res.redirect(307, newPath);
});
*/

/*
==============================================================================
  QUICK START CHECKLIST
==============================================================================

✅ 1. Import user_modules routes in server.js
✅ 2. Register routes with app.use()
✅ 3. Set environment variables (JWT_SECRET, ADMIN_EMAIL, etc.)
✅ 4. Test registration endpoint
✅ 5. Test login endpoint
✅ 6. Test password reset flow
✅ 7. Update frontend API calls (if applicable)
✅ 8. Deploy to staging/production

==============================================================================
*/

export default {};
