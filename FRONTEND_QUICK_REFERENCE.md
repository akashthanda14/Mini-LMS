# 🚀 LMS Frontend Quick Reference

Quick lookup table for all learner API endpoints.

---

## 📍 Base URL
```
http://localhost:4000/api
```

---

## 🔐 Authentication Header
```javascript
headers: {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

---

## 📋 All Learner Endpoints (29 Total)

### Authentication & Registration (9 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/verify-email` | ❌ | Verify email OTP |
| POST | `/auth/verify-phone` | ❌ | Verify phone OTP |
| POST | `/auth/complete-profile` | ❌ | Complete profile after OTP |
| POST | `/auth/login` | ❌ | Login user |
| GET | `/auth/me` | ✅ | Get current user |
| POST | `/auth/refresh` | ✅ | Refresh JWT token |
| POST | `/user-auth/forgot-password` | ❌ | Send password reset OTP |
| POST | `/user-auth/reset-password` | ❌ | Reset password with OTP |

### Profile Management (6 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user-auth/profile` | ✅ | Get user profile |
| PATCH | `/user-auth/profile` | ✅ | Update profile |
| POST | `/user-auth/request-email-change` | ✅ | Request email change |
| POST | `/user-auth/verify-email-change` | ✅ | Verify email change OTP |
| POST | `/user-auth/request-phone-change` | ✅ | Request phone change |
| POST | `/user-auth/verify-phone-change` | ✅ | Verify phone change OTP |

### Course Discovery (3 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/courses` | ✅ | Get all published courses |
| GET | `/courses/:id` | ✅ | Get course details |
| GET | `/courses/:courseId/lessons` | ✅ | Get lessons for course |

### Enrollment (2 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/courses/:id/enroll` | ✅ | Enroll in course (LEARNER only) |
| GET | `/courses/:id/enrollment` | ✅ | Check enrollment status |

### Learning & Progress (3 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/progress` | ✅ | Get all enrollments & progress |
| GET | `/courses/:id/progress` | ✅ | Get progress for specific course |
| POST | `/lessons/:id/complete` | ✅ | Mark lesson as complete (LEARNER only) |

### Certificates (4 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/enrollments/:id/certificate` | ✅ | Get certificate for enrollment |
| GET | `/enrollments/:id/certificate/download` | ✅ | Download certificate PDF |
| GET | `/certificates` | ✅ | Get all user certificates |
| GET | `/certificates/verify/:serialHash` | ❌ | Verify certificate (public) |

### Creator Application (2 endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/creator/apply` | ✅ | Submit creator application (LEARNER only) |
| GET | `/creator/status` | ✅ | Check application status |

---

## 🎯 Common Request Examples

### 1. Login
```javascript
POST /api/auth/login
{
  "emailOrPhone": "john@example.com",
  "password": "password123"
}
```

### 2. Get Courses
```javascript
GET /api/courses
Headers: { Authorization: 'Bearer <token>' }
```

### 3. Enroll
```javascript
POST /api/courses/{courseId}/enroll
Headers: { Authorization: 'Bearer <token>' }
```

### 4. Complete Lesson
```javascript
POST /api/lessons/{lessonId}/complete
Headers: { Authorization: 'Bearer <token>' }
```

### 5. Get My Progress
```javascript
GET /api/progress
Headers: { Authorization: 'Bearer <token>' }
```

### 6. Get Certificate
```javascript
GET /api/enrollments/{enrollmentId}/certificate
Headers: { Authorization: 'Bearer <token>' }
```

---

## 🎨 Response Patterns

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔒 Role Restrictions

| Role | Can Enroll | Can Create Courses | Can Complete Lessons | Can Apply for Creator |
|------|-----------|-------------------|---------------------|---------------------|
| LEARNER | ✅ | ❌ | ✅ | ✅ |
| CREATOR | ❌ | ✅ | ❌ | ❌ |
| ADMIN | ❌ | ❌ | ❌ | ❌ |

---

## 📱 Frontend Pages Needed

### Public Pages
- [ ] Landing Page
- [ ] Login Page
- [ ] Registration Page
- [ ] OTP Verification Page
- [ ] Complete Profile Page
- [ ] Forgot Password Page
- [ ] Reset Password Page
- [ ] Certificate Verification Page (public)

### Protected Pages (LEARNER)
- [ ] Dashboard / My Learning
- [ ] Course Catalog
- [ ] Course Details Page
- [ ] Lesson Player Page
- [ ] My Progress Page
- [ ] My Certificates Page
- [ ] Profile Page
- [ ] Settings Page
- [ ] Become Creator Page
- [ ] Application Status Page

**Total: ~18 pages**

---

## 🧩 Key Components

### Reusable Components
- [ ] Navbar (with auth state)
- [ ] Footer
- [ ] Course Card
- [ ] Progress Bar
- [ ] Lesson List Item
- [ ] Certificate Card
- [ ] Video Player
- [ ] OTP Input (6 digits)
- [ ] Loading Skeleton
- [ ] Error Boundary
- [ ] Protected Route
- [ ] Toast Notifications

---

## 🔄 State Management Structure

```javascript
// Global State
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean
  },
  courses: {
    list: Course[],
    current: Course | null
  },
  enrollments: {
    list: Enrollment[],
    currentProgress: Progress | null
  },
  certificates: Certificate[],
  ui: {
    loading: boolean,
    error: string | null
  }
}
```

---

## 🎯 User Journey Map

```
┌─────────────────────────────────────────────────────┐
│                 NEW USER JOURNEY                     │
└─────────────────────────────────────────────────────┘
  1. Landing Page → "Sign Up"
  2. Registration → Enter email + password
  3. Verify OTP → 6-digit code
  4. Complete Profile → Name + Username
  5. Login → Email + Password
  6. Dashboard → "Browse Courses"
  7. Course Catalog → View published courses
  8. Course Details → Click "Enroll"
  9. Lesson Player → Watch video
  10. Mark Complete → Progress updates
  11. Complete Course → Certificate generated
  12. Download Certificate → PDF

┌─────────────────────────────────────────────────────┐
│              BECOME CREATOR JOURNEY                  │
└─────────────────────────────────────────────────────┘
  1. Settings → "Become a Creator"
  2. Application Form → Bio, Portfolio, Experience
  3. Submit → Status: PENDING
  4. Wait for Review
  5. Approved → Role: CREATOR
  6. Creator Dashboard → Create courses
```

---

## 🧪 Testing Accounts

```javascript
// Use these for testing
LEARNER_1 = {
  email: 'john@example.com',
  password: 'password123'
}

LEARNER_2 = {
  email: 'emma@example.com',
  password: 'password123'
}

CREATOR = {
  email: 'sarah@example.com',
  password: 'password123'
}

ADMIN = {
  email: 'admin@microcourses.com',
  password: 'password123'
}
```

---

## 🛠️ Development Tips

### 1. Store Token
```javascript
// After login
localStorage.setItem('token', response.token);
localStorage.setItem('user', JSON.stringify(response.user));
```

### 2. Axios Interceptor
```javascript
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Protected Route
```javascript
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
}
```

### 4. Handle 401 Errors
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📊 API Response Examples

### Course List
```json
{
  "success": true,
  "count": 5,
  "courses": [
    {
      "id": "uuid",
      "title": "React Fundamentals",
      "thumbnail": "https://...",
      "category": "Programming",
      "level": "BEGINNER",
      "lessonCount": 10,
      "enrollmentCount": 234
    }
  ]
}
```

### Enrollment Progress
```json
{
  "success": true,
  "enrollments": [
    {
      "id": "uuid",
      "progress": 66,
      "course": {
        "id": "uuid",
        "title": "React Fundamentals"
      },
      "completedLessons": 8
    }
  ]
}
```

### Certificate
```json
{
  "success": true,
  "certificate": {
    "serialNumber": "LMS-2025-ABC123",
    "imageUrl": "https://...",
    "issuedAt": "2025-10-05T12:00:00Z"
  }
}
```

---

## 🚦 Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Role restriction (e.g., not a LEARNER) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Already exists (e.g., already enrolled) |
| 500 | Server Error | Show error message, retry |

---

## ⚡ Performance Tips

1. **Lazy Load Course Images**
   - Use intersection observer
   - Load thumbnails on scroll

2. **Cache Course List**
   - Store in state/cache for 5 minutes
   - Refresh on manual action

3. **Optimistic UI Updates**
   - Mark lesson complete immediately
   - Rollback on error

4. **Prefetch Next Lesson**
   - Preload next video when 80% complete

5. **Pagination/Infinite Scroll**
   - Load 12 courses at a time
   - Load more on scroll

---

## 🎉 Implementation Checklist

### Phase 1: Authentication (Week 1)
- [ ] Registration flow
- [ ] OTP verification
- [ ] Login/Logout
- [ ] Protected routes
- [ ] Profile page

### Phase 2: Course Browsing (Week 2)
- [ ] Course catalog
- [ ] Course details
- [ ] Search/filters
- [ ] Enrollment button
- [ ] Lesson list

### Phase 3: Learning (Week 3)
- [ ] Video player
- [ ] Mark complete
- [ ] Progress tracking
- [ ] My learning dashboard
- [ ] Course progress view

### Phase 4: Certificates (Week 4)
- [ ] Certificate generation (auto)
- [ ] Certificate viewer
- [ ] Download PDF
- [ ] Certificate gallery
- [ ] Public verification

### Phase 5: Polish (Week 5)
- [ ] Creator application form
- [ ] Application status
- [ ] Notifications/toasts
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Testing

---

## 📚 Resources

- **Full API Guide:** `/LEARNER_FRONTEND_API_GUIDE.md`
- **Admin API Guide:** `/COMPLETE_ADMIN_API_REFERENCE.md`
- **Server Logs:** `/server.log`
- **Test Scripts:** `/scripts/test-*.js`

---

**Ready to build? Start with authentication! 🚀**
