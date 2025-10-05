# 🚀 LMS API Integration Guide

**Server Status:** ✅ Running on `http://localhost:4000`

---

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints Overview](#api-endpoints-overview)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Testing with Postman](#testing-with-postman)

---

## 🎯 Quick Start

### Prerequisites
- ✅ Server is running on `http://localhost:4000`
- ✅ Database is connected
- ✅ Redis is connected (for background jobs)
- ✅ All controllers restored

### Base URL
```
http://localhost:4000
```

### API Documentation
```
http://localhost:4000/api-docs
```

---

## 🔐 Authentication Flow

### User Registration & Login Flow

```
1. Register → 2. Verify OTP → 3. Complete Profile → 4. Login
```

#### Flow Diagram:
```
┌─────────────────┐
│  1. REGISTER    │  POST /api/user-auth/register
│  (Email/Phone)  │  → Sends OTP
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. VERIFY OTP  │  POST /api/user-auth/verify-email
│  (Confirm OTP)  │  POST /api/user-auth/verify-phone
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. COMPLETE     │  POST /api/user-auth/complete-profile
│    PROFILE      │  → Set name, password
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. LOGIN       │  POST /api/user-auth/login
│  (Get Token)    │  → Returns JWT token
└─────────────────┘
```

---

## 📚 API Endpoints Overview

### 🔓 Public Endpoints (No Auth Required)

#### Authentication
```
POST   /api/user-auth/register              - Register with email or phone
POST   /api/user-auth/verify-email          - Verify email OTP
POST   /api/user-auth/verify-phone          - Verify phone OTP
POST   /api/user-auth/complete-profile      - Complete user profile
POST   /api/user-auth/login                 - Login and get JWT token
POST   /api/user-auth/forgot-password       - Request password reset
POST   /api/user-auth/reset-password        - Reset password with OTP
POST   /api/admin-auth/login                - Admin login
GET    /health                              - Health check
```

#### Courses (Public Browse)
```
GET    /api/courses                         - Get all published courses
GET    /api/courses/:id                     - Get course details
```

### 🔒 Protected Endpoints (Auth Required)

#### Profile Management
```
GET    /api/user-auth/profile               - Get user profile
PATCH  /api/user-auth/profile               - Update profile
POST   /api/user-auth/change-email/request  - Request email change
POST   /api/user-auth/change-email/verify   - Verify email change
POST   /api/user-auth/change-phone/request  - Request phone change
POST   /api/user-auth/change-phone/verify   - Verify phone change
PATCH  /api/user-auth/change-password       - Change password
DELETE /api/user-auth/delete-account        - Delete account
```

#### Creator Routes (CREATOR role only)
```
POST   /api/creator/application             - Apply to become creator
GET    /api/creator/application             - Get application status
POST   /api/courses                         - Create new course
GET    /api/courses/my-courses              - Get creator's courses
PATCH  /api/courses/:id                     - Update course
DELETE /api/courses/:id                     - Delete course (DRAFT only)
POST   /api/courses/:id/submit              - Submit for review
POST   /api/courses/:courseId/thumbnail/upload  - Get upload credentials
PATCH  /api/courses/:courseId/thumbnail     - Save thumbnail URL
POST   /api/lessons                         - Create lesson
PATCH  /api/lessons/:id                     - Update lesson
DELETE /api/lessons/:id                     - Delete lesson
```

#### Enrollment Routes (LEARNER role)
```
POST   /api/enrollments/:courseId           - Enroll in course
GET    /api/enrollments                     - Get user enrollments
GET    /api/enrollments/:courseId           - Get specific enrollment
GET    /api/enrollments/:enrollmentId/progress  - Get progress
PATCH  /api/enrollments/:enrollmentId/complete  - Complete enrollment
POST   /api/lessons/:lessonId/progress      - Update lesson progress
POST   /api/lessons/:lessonId/complete      - Mark lesson complete
```

#### Certificate Routes
```
GET    /api/certificates                    - Get user certificates
GET    /api/certificates/:id                - Get certificate details
POST   /api/certificates/:enrollmentId/generate  - Generate certificate
```

#### Admin Routes (ADMIN role only)
```
GET    /api/admin/applications              - Get all applications
PATCH  /api/admin/applications/:id/approve  - Approve application
PATCH  /api/admin/applications/:id/reject   - Reject application
GET    /api/admin/courses                   - Get all courses
PATCH  /api/admin/courses/:id/approve       - Approve course
PATCH  /api/admin/courses/:id/reject        - Reject course
PATCH  /api/admin/courses/:id/publish       - Publish course
PATCH  /api/admin/courses/:id/unpublish     - Unpublish course
```

---

## 🛠️ Step-by-Step Integration

### Step 1: Test Server Health
```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "LMS Authentication Server is running",
  "timestamp": "2025-10-05T12:42:23.000Z"
}
```

---

### Step 2: Register a New User

#### Option A: Register with Email
```bash
curl -X POST http://localhost:4000/api/user-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

#### Option B: Register with Phone
```bash
curl -X POST http://localhost:4000/api/user-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent to email/phone",
  "userId": "uuid-here",
  "verificationType": "EMAIL" // or "PHONE"
}
```

**💡 Note:** Check your email/SMS for the OTP code.

---

### Step 3: Verify OTP

#### For Email:
```bash
curl -X POST http://localhost:4000/api/user-auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

#### For Phone:
```bash
curl -X POST http://localhost:4000/api/user-auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Verification successful",
  "userId": "uuid-here"
}
```

---

### Step 4: Complete Profile

```bash
curl -X POST http://localhost:4000/api/user-auth/complete-profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-from-step-2",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile completed successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "test@example.com",
    "role": "LEARNER",
    "isProfileComplete": true
  }
}
```

---

### Step 5: Login

```bash
curl -X POST http://localhost:4000/api/user-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "test@example.com",
    "role": "LEARNER"
  }
}
```

**💡 Save this token!** You'll need it for protected endpoints.

---

### Step 6: Access Protected Endpoints

Use the token from Step 5 in the Authorization header:

```bash
curl http://localhost:4000/api/user-auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🧪 Testing with Postman

### Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select the file: `/Users/work/Desktop/LMS/postman/LMS_Authentication_API.postman_collection.json`
4. Configure environment variables:
   - `baseUrl`: `http://localhost:4000`
   - `token`: (will be auto-set after login)

### Pre-configured Test Flows

The Postman collection includes:
- ✅ Complete authentication flow
- ✅ Profile management tests
- ✅ Course CRUD operations
- ✅ Enrollment workflow
- ✅ Admin operations

---

## 🎯 Common Integration Scenarios

### Scenario 1: User Browses and Enrolls in Course

```javascript
// 1. Get all published courses (no auth needed)
GET /api/courses

// 2. Get course details
GET /api/courses/:courseId

// 3. Login (get token)
POST /api/user-auth/login

// 4. Enroll in course (with token)
POST /api/enrollments/:courseId
Authorization: Bearer {token}

// 5. Track lesson progress
POST /api/lessons/:lessonId/progress
Authorization: Bearer {token}
```

---

### Scenario 2: Creator Creates and Publishes Course

```javascript
// 1. Login as user
POST /api/user-auth/login

// 2. Apply to become creator
POST /api/creator/application
Authorization: Bearer {token}

// 3. Wait for admin approval
GET /api/creator/application

// 4. Create course (after approval)
POST /api/courses
Authorization: Bearer {token}

// 5. Add lessons
POST /api/lessons
Authorization: Bearer {token}

// 6. Submit for review
POST /api/courses/:courseId/submit
Authorization: Bearer {token}

// 7. Admin approves and publishes
PATCH /api/admin/courses/:courseId/approve
PATCH /api/admin/courses/:courseId/publish
```

---

### Scenario 3: Admin Workflow

```javascript
// 1. Admin login
POST /api/admin-auth/login
{
  "email": "admin@example.com",
  "password": "greatstack123"
}

// 2. Review creator applications
GET /api/admin/applications

// 3. Approve/Reject application
PATCH /api/admin/applications/:id/approve

// 4. Review courses pending approval
GET /api/admin/courses?status=PENDING

// 5. Approve and publish course
PATCH /api/admin/courses/:id/approve
PATCH /api/admin/courses/:id/publish
```

---

## 🔑 Authentication Headers

For all protected endpoints, include the JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📦 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors if any */ ]
}
```

---

## 🚨 Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🎨 User Roles

The system supports three roles:

1. **LEARNER** (default)
   - Browse courses
   - Enroll in courses
   - Track progress
   - Get certificates

2. **CREATOR**
   - All LEARNER permissions
   - Create courses
   - Manage own courses
   - Add lessons

3. **ADMIN**
   - All permissions
   - Approve creator applications
   - Approve/reject courses
   - Publish/unpublish courses

---

## 📝 Next Steps

### For Frontend Integration:

1. **Start with Authentication**
   - Implement register/login forms
   - Store JWT token (localStorage/sessionStorage)
   - Add token to API requests

2. **Course Browsing**
   - List courses page
   - Course details page
   - Enrollment button

3. **User Dashboard**
   - My enrollments
   - Progress tracking
   - Certificates

4. **Creator Dashboard** (for creators)
   - My courses
   - Create/edit course
   - Add lessons
   - Submit for review

5. **Admin Dashboard** (for admins)
   - Pending applications
   - Pending courses
   - Approve/reject actions

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 4000 is already in use
lsof -i :4000

# Kill existing process
kill -9 <PID>

# Restart server
npm run dev
```

### Database connection issues
```bash
# Check DATABASE_URL in .env
# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run prisma:seed
```

### Redis connection issues
- Ensure Redis is running
- Check Redis URL in .env

---

## 📖 Additional Resources

- **API Documentation**: http://localhost:4000/api-docs
- **Postman Collection**: `/postman/LMS_Authentication_API.postman_collection.json`
- **Database Schema**: `/prisma/schema.prisma`
- **Test Scripts**: `/scripts/` directory

---

## ✅ Integration Checklist

- [ ] Server running successfully
- [ ] Test health endpoint
- [ ] Register a test user
- [ ] Complete authentication flow
- [ ] Test protected endpoints with token
- [ ] Import Postman collection
- [ ] Test creator application flow
- [ ] Test course creation
- [ ] Test enrollment flow
- [ ] Test admin operations

---

## 🎉 You're Ready!

Your LMS API is fully functional and ready for integration. Start with the authentication flow and gradually implement other features.

**Happy Coding! 🚀**

---

_Last Updated: October 5, 2025_
