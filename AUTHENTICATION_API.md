# Authentication & User Management API

Complete API documentation for authentication, user registration, and user management endpoints.

## 📑 Table of Contents

- [Base URL](#base-url)
- [Authentication Flow](#authentication-flow)
- [User Registration](#user-registration)
- [User Login](#user-login)
- [Password Management](#password-management)
- [Profile Management](#profile-management)
- [Admin Authentication](#admin-authentication)
- [Error Codes](#error-codes)
- [Testing](#testing)

---

## Base URL

```
http://localhost:4000/api
```

---

## Authentication Flow

```
┌─────────────┐
│   Register  │ → Email/Phone + Password → OTP Verification
└─────────────┘
       ↓
┌─────────────┐
│ Verify OTP  │ → 6-digit Code → Account Activated
└─────────────┘
       ↓
┌─────────────┐
│    Login    │ → Email/Phone + Password → JWT Token
└─────────────┘
       ↓
┌─────────────┐
│ Authenticated│ → Use Token for Protected Routes
└─────────────┘
```

---

## User Registration

### 1. Register with Email

**Endpoint:** `POST /user-auth/register-email`

**Description:** Register a new user with email address

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "LEARNER"
}
```

**Field Validations:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format, must be unique
- `password`: Required, minimum 8 characters, at least one uppercase, one lowercase, one number
- `role`: Optional, one of: `LEARNER` (default), `CREATOR`

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with the OTP sent.",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "LEARNER",
      "isVerified": false,
      "createdAt": "2025-10-04T14:30:00.000Z"
    },
    "otpSent": true,
    "expiresIn": 300
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid input:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**409 Conflict** - Email already exists:
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### 2. Register with Phone

**Endpoint:** `POST /user-auth/register-phone`

**Description:** Register a new user with phone number

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "phone": "+919876543210",
  "password": "SecurePass123!",
  "role": "CREATOR"
}
```

**Field Validations:**
- `name`: Required, 2-100 characters
- `phone`: Required, valid E.164 format (e.g., +919876543210), must be unique
- `password`: Required, minimum 8 characters, at least one uppercase, one lowercase, one number
- `role`: Optional, one of: `LEARNER` (default), `CREATOR`

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your phone with the OTP sent.",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Smith",
      "phone": "+919876543210",
      "role": "CREATOR",
      "isVerified": false,
      "createdAt": "2025-10-04T14:35:00.000Z"
    },
    "otpSent": true,
    "expiresIn": 300
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid phone:
```json
{
  "success": false,
  "message": "Invalid phone number format. Use E.164 format (e.g., +919876543210)"
}
```

**409 Conflict** - Phone already exists:
```json
{
  "success": false,
  "message": "Phone number already registered"
}
```

---

### 3. Verify Email OTP

**Endpoint:** `POST /user-auth/verify-email-otp`

**Description:** Verify email with 6-digit OTP sent during registration

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Field Validations:**
- `email`: Required, must match registered email
- `otp`: Required, exactly 6 digits

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "LEARNER",
      "isVerified": true,
      "verifiedAt": "2025-10-04T14:32:00.000Z"
    }
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid OTP:
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**404 Not Found** - Email not found:
```json
{
  "success": false,
  "message": "Email not found"
}
```

**429 Too Many Requests** - Too many attempts:
```json
{
  "success": false,
  "message": "Too many failed attempts. Please request a new OTP."
}
```

---

### 4. Verify Phone OTP

**Endpoint:** `POST /user-auth/verify-phone-otp`

**Description:** Verify phone number with 6-digit OTP sent during registration

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "654321"
}
```

**Field Validations:**
- `phone`: Required, must match registered phone
- `otp`: Required, exactly 6 digits

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Phone verified successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Smith",
      "phone": "+919876543210",
      "role": "CREATOR",
      "isVerified": true,
      "verifiedAt": "2025-10-04T14:37:00.000Z"
    }
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid OTP:
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**404 Not Found** - Phone not found:
```json
{
  "success": false,
  "message": "Phone number not found"
}
```

---

### 5. Resend OTP

**Endpoint:** `POST /user-auth/resend-otp`

**Description:** Resend OTP to email or phone

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body (Email):**
```json
{
  "email": "john@example.com"
}
```

**Request Body (Phone):**
```json
{
  "phone": "+919876543210"
}
```

**Field Validations:**
- Must provide either `email` or `phone`
- Cannot provide both

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otpSent": true,
    "expiresIn": 300,
    "sentTo": "john@example.com"
  }
}
```

**Error Responses:**

**400 Bad Request** - No identifier provided:
```json
{
  "success": false,
  "message": "Please provide either email or phone"
}
```

**429 Too Many Requests** - Rate limited:
```json
{
  "success": false,
  "message": "Please wait 60 seconds before requesting another OTP"
}
```

---

## User Login

### 6. Login

**Endpoint:** `POST /auth/login`

**Description:** Login with email/phone and password to receive JWT token

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body (Email):**
```json
{
  "emailOrPhone": "john@example.com",
  "password": "SecurePass123!"
}
```

**Request Body (Phone):**
```json
{
  "emailOrPhone": "+919876543210",
  "password": "SecurePass123!"
}
```

**Field Validations:**
- `emailOrPhone`: Required, can be email or phone number
- `password`: Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": null,
    "role": "LEARNER",
    "isVerified": true,
    "createdAt": "2025-10-04T14:30:00.000Z"
  }
}
```

**Token Information:**
- **Type:** Bearer JWT
- **Expiry:** 7 days
- **Usage:** Include in `Authorization` header: `Bearer <token>`

**Error Responses:**

**400 Bad Request** - Account not verified:
```json
{
  "success": false,
  "message": "Please verify your account before logging in"
}
```

**401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**404 Not Found** - User not found:
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Password Management

### 7. Request Password Reset

**Endpoint:** `POST /auth/forgot-password`

**Description:** Request password reset OTP

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body (Email):**
```json
{
  "email": "john@example.com"
}
```

**Request Body (Phone):**
```json
{
  "phone": "+919876543210"
}
```

**Field Validations:**
- Must provide either `email` or `phone`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset OTP sent successfully",
  "data": {
    "otpSent": true,
    "expiresIn": 300,
    "sentTo": "john@example.com"
  }
}
```

**Error Responses:**

**404 Not Found** - User not found:
```json
{
  "success": false,
  "message": "User not found"
}
```

**429 Too Many Requests** - Rate limited:
```json
{
  "success": false,
  "message": "Too many reset requests. Please try again later."
}
```

---

### 8. Verify Reset OTP

**Endpoint:** `POST /auth/verify-reset-otp`

**Description:** Verify OTP for password reset

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body (Email):**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Request Body (Phone):**
```json
{
  "phone": "+919876543210",
  "otp": "654321"
}
```

**Field Validations:**
- Must provide either `email` or `phone`
- `otp`: Required, exactly 6 digits

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "verified": true,
    "resetToken": "temp_reset_token_abc123"
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid OTP:
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

### 9. Reset Password

**Endpoint:** `POST /auth/reset-password`

**Description:** Reset password after OTP verification

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body (Email):**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass456!"
}
```

**Request Body (Phone):**
```json
{
  "phone": "+919876543210",
  "otp": "654321",
  "newPassword": "NewSecurePass456!"
}
```

**Field Validations:**
- Must provide either `email` or `phone`
- `otp`: Required, exactly 6 digits
- `newPassword`: Required, minimum 8 characters, at least one uppercase, one lowercase, one number

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Error Responses:**

**400 Bad Request** - Weak password:
```json
{
  "success": false,
  "message": "Password must be at least 8 characters with uppercase, lowercase, and number"
}
```

**400 Bad Request** - Invalid OTP:
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

### 10. Change Password

**Endpoint:** `PUT /profile/change-password`

**Description:** Change password for authenticated user

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Request Body:**
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Field Validations:**
- `currentPassword`: Required, must match current password
- `newPassword`: Required, minimum 8 characters, at least one uppercase, one lowercase, one number
- New password must be different from current password

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

**401 Unauthorized** - No token:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**401 Unauthorized** - Wrong current password:
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

**400 Bad Request** - Same password:
```json
{
  "success": false,
  "message": "New password must be different from current password"
}
```

---

## Profile Management

### 11. Get User Profile

**Endpoint:** `GET /profile`

**Description:** Get current user's profile information

**Request Headers:**
```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "role": "LEARNER",
      "isVerified": true,
      "createdAt": "2025-10-04T14:30:00.000Z",
      "updatedAt": "2025-10-04T14:30:00.000Z"
    }
  }
}
```

**Error Responses:**

**401 Unauthorized** - No token:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**401 Unauthorized** - Invalid token:
```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

### 12. Update Profile

**Endpoint:** `PUT /profile`

**Description:** Update user profile information

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Request Body:**
```json
{
  "name": "John Updated Doe"
}
```

**Field Validations:**
- `name`: Optional, 2-100 characters if provided

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Updated Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "role": "LEARNER",
      "isVerified": true,
      "updatedAt": "2025-10-04T15:00:00.000Z"
    }
  }
}
```

---

### 13. Request Email Change

**Endpoint:** `POST /profile/change-email/request`

**Description:** Request to change email address (sends OTP to new email)

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Request Body:**
```json
{
  "newEmail": "newemail@example.com"
}
```

**Field Validations:**
- `newEmail`: Required, valid email format, must not be already registered

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification OTP sent to new email",
  "data": {
    "otpSent": true,
    "expiresIn": 300,
    "newEmail": "newemail@example.com"
  }
}
```

**Error Responses:**

**409 Conflict** - Email already in use:
```json
{
  "success": false,
  "message": "Email already in use"
}
```

---

### 14. Verify Email Change

**Endpoint:** `POST /profile/change-email/verify`

**Description:** Verify new email with OTP

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Request Body:**
```json
{
  "newEmail": "newemail@example.com",
  "otp": "123456"
}
```

**Field Validations:**
- `newEmail`: Required, must match the email OTP was sent to
- `otp`: Required, exactly 6 digits

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Email changed successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "newemail@example.com",
      "updatedAt": "2025-10-04T15:05:00.000Z"
    }
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid OTP:
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

### 15. Request Phone Change

**Endpoint:** `POST /profile/change-phone/request`

**Description:** Request to change phone number (sends OTP to new phone)

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Request Body:**
```json
{
  "newPhone": "+919999888877"
}
```

**Field Validations:**
- `newPhone`: Required, valid E.164 format, must not be already registered

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification OTP sent to new phone",
  "data": {
    "otpSent": true,
    "expiresIn": 300,
    "newPhone": "+919999888877"
  }
}
```

**Error Responses:**

**409 Conflict** - Phone already in use:
```json
{
  "success": false,
  "message": "Phone number already in use"
}
```

---

### 16. Verify Phone Change

**Endpoint:** `POST /profile/change-phone/verify`

**Description:** Verify new phone with OTP

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Request Body:**
```json
{
  "newPhone": "+919999888877",
  "otp": "654321"
}
```

**Field Validations:**
- `newPhone`: Required, must match the phone OTP was sent to
- `otp`: Required, exactly 6 digits

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Phone changed successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "phone": "+919999888877",
      "updatedAt": "2025-10-04T15:10:00.000Z"
    }
  }
}
```

---

## Admin Authentication

### 17. Admin Login

**Endpoint:** `POST /admin-auth/login`

**Description:** Login for admin users

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "admin@lms.com",
  "password": "admin123"
}
```

**Field Validations:**
- `email`: Required
- `password`: Required
- User must have `ADMIN` role

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Admin User",
    "email": "admin@lms.com",
    "role": "ADMIN",
    "isVerified": true
  }
}
```

**Error Responses:**

**403 Forbidden** - Not an admin:
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

**401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Authentication required or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

---

## Testing

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:4000/api/user-auth/register-email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "role": "LEARNER"
  }'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:4000/api/user-auth/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Get Profile:**
```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:4000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Change Password:**
```bash
curl -X PUT http://localhost:4000/api/profile/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "TestPass123!",
    "newPassword": "NewTestPass456!"
  }'
```

### Using Postman

1. Import the base URL: `http://localhost:4000/api`
2. Create requests for each endpoint
3. For authenticated routes:
   - Go to **Authorization** tab
   - Select **Bearer Token**
   - Paste your JWT token

---

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended

### Token Management
- Store JWT securely (use httpOnly cookies in production)
- Never expose tokens in URLs
- Implement token refresh mechanism
- Set appropriate token expiry (current: 7 days)

### OTP Security
- OTPs expire after 5 minutes (300 seconds)
- Maximum 3 attempts per OTP
- Rate limiting on OTP requests
- OTPs are 6 digits

### Rate Limiting
- Registration: 5 requests per hour per IP
- Login: 10 failed attempts = 1 hour lockout
- OTP requests: 1 per minute per user
- Password reset: 3 requests per hour per user

---

## Support

For issues or questions:
- Check server logs: `tail -f server.log`
- API Documentation: `http://localhost:4000/api-docs`
- Health Check: `http://localhost:4000/health`

---

## License

MIT License - See LICENSE file for details
