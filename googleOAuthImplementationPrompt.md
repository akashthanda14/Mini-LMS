You are tasked with implementing Google OAuth2 authentication using Passport.js in an existing Node.js and Express.js repository. The repository already has user authentication via email/phone OTP and profile management, as seen in the attached `userController.js`. Integrate Google OAuth2 seamlessly, allowing users to register/login with Google accounts while maintaining compatibility with existing flows.

## Requirements
- Use Passport.js with the `passport-google-oauth20` strategy.
- Handle user registration and login via Google OAuth2.
- If a user logs in with Google and doesn't exist, create a new user with Google profile data (e.g., email, name).
- If the user exists, link or update the account appropriately.
- Ensure email verification is handled (Google provides verified emails).
- Generate JWT tokens upon successful OAuth login, similar to existing login.
- Store Google ID in the user model (assume Prisma schema can be updated).
- Redirect to frontend after OAuth success/failure.
- Follow best practices: secure, no bugs, adhere to Node.js/Express standards.

## Checklist
- [ ] Install required packages: `passport`, `passport-google-oauth20`.
- [ ] Update Prisma schema to add `googleId` field to User model.
- [ ] Create/update middleware for Passport initialization.
- [ ] Implement Google OAuth strategy in a new service file.
- [ ] Add OAuth routes in a new controller or extend existing.
- [ ] Update environment variables.
- [ ] Handle OAuth callbacks and token generation.
- [ ] Add error handling and logging.
- [ ] Test integration with existing user flows.
- [ ] Ensure CSRF protection if applicable.
- [ ] Update documentation.

## File Paths
- `/config/passport.js` - Passport configuration and Google strategy.
- `/controllers/authController.js` - OAuth routes and handlers (new file).
- `/services/googleAuthService.js` - Service for Google OAuth logic (new file).
- `/routes/auth.js` - Add OAuth routes here (extend existing).
- `/lib/prisma.js` - Ensure Prisma client is accessible.
- Update `/models/User.js` or Prisma schema for `googleId`.
- `.env` - Add Google OAuth credentials.

## Environment Variables
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret.
- `GOOGLE_REDIRECT_URI`: Redirect URI for OAuth callback (e.g., `http://localhost:3000/auth/google/callback`).
- `JWT_SECRET`: Existing JWT secret for token generation.
- `FRONTEND_URL`: URL to redirect after OAuth (e.g., for success/failure).

## Route Names
- `GET /auth/google` - Initiate Google OAuth login.
- `GET /auth/google/callback` - Handle OAuth callback, generate JWT, redirect to frontend.
- `GET /auth/google/failure` - Optional failure redirect.

## Acceptance Tests
- Test 1: New user signs up via Google OAuth - Verify user created in DB with Google ID, email verified, JWT returned, redirect to profile completion if needed.
- Test 2: Existing user logs in via Google OAuth - Verify account linked, JWT returned, no duplicate creation.
- Test 3: OAuth failure (e.g., invalid credentials) - Redirect to failure page with error message.
- Test 4: Integration with existing login - Ensure email/phone login still works, no conflicts.
- Test 5: Token validation - Verify JWT contains correct user data and is valid.
- Use tools like Supertest for API tests, and simulate OAuth with mock tokens if needed.

Implement the code step-by-step, providing updated file contents where necessary. Ensure the implementation is secure and follows the repository's existing patterns.