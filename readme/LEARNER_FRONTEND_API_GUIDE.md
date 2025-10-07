# 🎓 Learner Frontend API Guide

Complete reference for all learner (USER role) functionalities to implement in your frontend.

---

## 📋 Table of Contents

1. [Authentication & Registration](#1-authentication--registration)
2. [Profile Management](#2-profile-management)
3. [Course Discovery & Browsing](#3-course-discovery--browsing)
4. [Course Enrollment](#4-course-enrollment)
5. [Learning & Progress](#5-learning--progress)
6. [Certificates](#6-certificates)
7. [Creator Application](#7-creator-application)
8. [Frontend Implementation Checklist](#8-frontend-implementation-checklist)

---

## 1️⃣ Authentication & Registration

### 1.1 Register New User

**POST** `/api/auth/register` OR `/api/user-auth/register`

Register with either email or phone number (not both initially).

**Request Body:**
```json
{
  "email": "learner@example.com",
  "password": "SecurePass123"
}
```

OR

```json
{
  "phoneNumber": "+1234567890",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email/phone. Please verify.",
  "data": {
    "userId": "uuid",
    "verificationType": "email",
    "maskedContact": "l***r@example.com"
  }
}
```

---

### 1.2 Verify OTP

**POST** `/api/auth/verify-email` (for email)  
**POST** `/api/auth/verify-phone` (for phone)

**Request Body:**
```json
{
  "userId": "uuid",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email/Phone verified successfully",
  "data": {
    "userId": "uuid",
    "verified": true
  }
}
```

---

### 1.3 Complete Profile

**POST** `/api/auth/complete-profile`

After OTP verification, complete the profile.

**Request Body:**
```json
{
  "userId": "uuid",
  "name": "John Doe",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile completed successfully. You can now login.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "username": "johndoe",
    "email": "learner@example.com",
    "role": "LEARNER",
    "isProfileComplete": true
  }
}
```

---

### 1.4 Login

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "emailOrPhone": "learner@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "username": "johndoe",
    "email": "learner@example.com",
    "phoneNumber": null,
    "role": "LEARNER",
    "emailVerified": true,
    "phoneVerified": false,
    "isProfileComplete": true
  }
}
```

**Store the token** in localStorage/sessionStorage for subsequent authenticated requests.

---

### 1.5 Get Current User

**GET** `/api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "username": "johndoe",
    "email": "learner@example.com",
    "phoneNumber": null,
    "role": "LEARNER",
    "emailVerified": true,
    "phoneVerified": false,
    "isProfileComplete": true,
    "isActive": true
  }
}
```

---

### 1.6 Refresh Token

**POST** `/api/auth/refresh`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "token": "new-jwt-token",
  "message": "Token refreshed successfully"
}
```

---

### 1.7 Forgot Password

**POST** `/api/user-auth/forgot-password`

**Request Body:**
```json
{
  "emailOrPhone": "learner@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email/phone"
}
```

---

### 1.8 Reset Password

**POST** `/api/user-auth/reset-password`

**Request Body:**
```json
{
  "emailOrPhone": "learner@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with new password."
}
```

---

### 1.9 Resend OTP

**POST** `/api/user-auth/resend-otp`

**Request Body:**
```json
{
  "userId": "uuid",
  "type": "email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully"
}
```

---

## 2️⃣ Profile Management

### 2.1 Get User Profile

**GET** `/api/user-auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "username": "johndoe",
    "email": "learner@example.com",
    "phoneNumber": "+1234567890",
    "role": "LEARNER",
    "emailVerified": true,
    "phoneVerified": true,
    "isProfileComplete": true,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### 2.2 Update Profile

**PATCH** `/api/user-auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "username": "johnupdated"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "John Updated",
    "username": "johnupdated",
    "email": "learner@example.com"
  }
}
```

---

### 2.3 Request Email Change

**POST** `/api/user-auth/request-email-change`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "newEmail": "newemail@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to new email"
}
```

---

### 2.4 Verify Email Change

**POST** `/api/user-auth/verify-email-change`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email updated successfully",
  "user": {
    "email": "newemail@example.com"
  }
}
```

---

### 2.5 Request Phone Change

**POST** `/api/user-auth/request-phone-change`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "newPhone": "+9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to new phone number"
}
```

---

### 2.6 Verify Phone Change

**POST** `/api/user-auth/verify-phone-change`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number updated successfully",
  "user": {
    "phoneNumber": "+9876543210"
  }
}
```

---

## 3️⃣ Course Discovery & Browsing

### 3.1 Get All Published Courses

**GET** `/api/courses`

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- None (learners automatically see only PUBLISHED courses)

**Response:**
```json
{
  "success": true,
  "count": 25,
  "courses": [
    {
      "id": "course-uuid",
      "title": "Introduction to React",
      "description": "Learn React from scratch...",
      "thumbnail": "https://cloudinary.com/...",
      "category": "Programming",
      "level": "BEGINNER",
      "duration": 3600,
      "status": "PUBLISHED",
      "createdAt": "2025-01-15T00:00:00.000Z",
      "publishedAt": "2025-01-20T00:00:00.000Z",
      "creator": {
        "id": "creator-uuid",
        "name": "Jane Smith",
        "username": "janesmith",
        "email": "jane@example.com"
      },
      "lessonCount": 10,
      "enrollmentCount": 234
    }
  ]
}
```

---

### 3.2 Get Course Details

**GET** `/api/courses/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "course": {
    "id": "course-uuid",
    "title": "Introduction to React",
    "description": "Learn React from scratch...",
    "thumbnail": "https://cloudinary.com/...",
    "category": "Programming",
    "level": "BEGINNER",
    "duration": 3600,
    "status": "PUBLISHED",
    "createdAt": "2025-01-15T00:00:00.000Z",
    "publishedAt": "2025-01-20T00:00:00.000Z",
    "creator": {
      "id": "creator-uuid",
      "name": "Jane Smith",
      "username": "janesmith",
      "email": "jane@example.com",
      "role": "CREATOR"
    },
    "lessons": [
      {
        "id": "lesson-uuid",
        "title": "Getting Started with React",
        "videoUrl": "https://cloudinary.com/video.mp4",
        "transcript": "Welcome to React...",
        "order": 1,
        "duration": 360
      }
    ],
    "lessonCount": 10,
    "enrollmentCount": 234,
    "certificateCount": 145,
    "isEnrolled": false,
    "enrollment": null
  }
}
```

**Note:** `isEnrolled` and `enrollment` fields show enrollment status for the current user.

---

### 3.3 Get Lessons for a Course

**GET** `/api/courses/:courseId/lessons`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "lessons": [
    {
      "id": "lesson-uuid",
      "title": "Getting Started with React",
      "videoUrl": "https://cloudinary.com/video.mp4",
      "transcript": "Welcome to React...",
      "order": 1,
      "duration": 360,
      "createdAt": "2025-01-15T00:00:00.000Z"
    }
  ]
}
```

---

## 4️⃣ Course Enrollment

### 4.1 Enroll in Course

**POST** `/api/courses/:id/enroll`

**Headers:** `Authorization: Bearer <token>`

**Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "enrollment": {
      "id": "enrollment-uuid",
      "userId": "user-uuid",
      "courseId": "course-uuid",
      "progress": 0,
      "enrolledAt": "2025-10-05T12:00:00.000Z",
      "completedAt": null
    }
  }
}
```

**Errors:**
- `409`: Already enrolled
- `400`: Course not published
- `404`: Course not found
- `403`: Only learners can enroll

---

### 4.2 Check Enrollment Status

**GET** `/api/courses/:id/enrollment`

**Headers:** `Authorization: Bearer <token>`

**Response (Enrolled):**
```json
{
  "success": true,
  "data": {
    "enrolled": true,
    "enrollment": {
      "id": "enrollment-uuid",
      "progress": 35,
      "enrolledAt": "2025-10-01T00:00:00.000Z",
      "completedAt": null,
      "completedLessons": 4
    }
  }
}
```

**Response (Not Enrolled):**
```json
{
  "success": true,
  "data": {
    "enrolled": false,
    "enrollment": null
  }
}
```

---

## 5️⃣ Learning & Progress

### 5.1 Get All Enrollments & Progress

**GET** `/api/progress`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "count": 3,
  "enrollments": [
    {
      "id": "enrollment-uuid",
      "enrolledAt": "2025-09-01T00:00:00.000Z",
      "completedAt": null,
      "progress": 66,
      "course": {
        "id": "course-uuid",
        "title": "React Fundamentals",
        "thumbnail": "https://cloudinary.com/...",
        "category": "Programming",
        "level": "BEGINNER",
        "duration": 3600,
        "creator": {
          "name": "Jane Smith",
          "username": "janesmith"
        },
        "lessonCount": 12
      },
      "completedLessons": 8,
      "certificate": null
    }
  ]
}
```

---

### 5.2 Get Progress for Specific Course

**GET** `/api/courses/:id/progress`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollment": {
      "id": "enrollment-uuid",
      "progress": 66,
      "enrolledAt": "2025-09-01T00:00:00.000Z",
      "completedAt": null
    },
    "course": {
      "id": "course-uuid",
      "title": "React Fundamentals",
      "lessonCount": 12
    },
    "progress": {
      "totalLessons": 12,
      "completedLessons": 8,
      "percentComplete": 66,
      "lessons": [
        {
          "id": "lesson-1",
          "title": "Introduction",
          "order": 1,
          "duration": 300,
          "completed": true,
          "completedAt": "2025-09-02T10:00:00.000Z"
        },
        {
          "id": "lesson-2",
          "title": "Components",
          "order": 2,
          "duration": 450,
          "completed": true,
          "completedAt": "2025-09-03T14:30:00.000Z"
        },
        {
          "id": "lesson-3",
          "title": "Props",
          "order": 3,
          "duration": 400,
          "completed": false,
          "completedAt": null
        }
      ]
    }
  }
}
```

---

### 5.3 Mark Lesson as Complete

**POST** `/api/lessons/:id/complete`

**Headers:** `Authorization: Bearer <token>`

**Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Lesson marked as complete",
  "data": {
    "lessonProgress": {
      "id": "progress-uuid",
      "lessonId": "lesson-uuid",
      "completed": true,
      "completedAt": "2025-10-05T12:30:00.000Z"
    },
    "courseProgress": {
      "progress": 75,
      "completedAt": null,
      "isCompleted": false
    }
  }
}
```

**If course becomes 100% complete:**
```json
{
  "success": true,
  "message": "Lesson marked as complete",
  "data": {
    "lessonProgress": {
      "id": "progress-uuid",
      "lessonId": "lesson-uuid",
      "completed": true,
      "completedAt": "2025-10-05T12:30:00.000Z"
    },
    "courseProgress": {
      "progress": 100,
      "completedAt": "2025-10-05T12:30:00.000Z",
      "isCompleted": true
    }
  }
}
```

**Errors:**
- `403`: Not enrolled or not a learner
- `404`: Lesson not found
- `400`: Already completed

---

## 6️⃣ Certificates

### 6.1 Get Certificate for Enrollment

**GET** `/api/enrollments/:id/certificate`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "certificate": {
    "id": "cert-uuid",
    "serialNumber": "LMS-2025-ABC123",
    "serialHash": "a1b2c3d4e5f6...",
    "issuedAt": "2025-10-05T12:35:00.000Z",
    "imageUrl": "https://cloudinary.com/certificate.png",
    "enrollment": {
      "id": "enrollment-uuid",
      "completedAt": "2025-10-05T12:30:00.000Z",
      "course": {
        "id": "course-uuid",
        "title": "React Fundamentals"
      },
      "user": {
        "name": "John Doe"
      }
    }
  }
}
```

**Errors:**
- `403`: Not your enrollment
- `404`: Enrollment not found
- `400`: Course not completed yet

---

### 6.2 Download Certificate as PDF

**GET** `/api/enrollments/:id/certificate/download`

**Headers:** `Authorization: Bearer <token>`

**Response:** PDF file download

---

### 6.3 Get All User Certificates

**GET** `/api/certificates`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "count": 5,
  "certificates": [
    {
      "id": "cert-uuid",
      "serialNumber": "LMS-2025-ABC123",
      "serialHash": "a1b2c3d4e5f6...",
      "issuedAt": "2025-10-05T12:35:00.000Z",
      "imageUrl": "https://cloudinary.com/certificate.png",
      "enrollment": {
        "completedAt": "2025-10-05T12:30:00.000Z",
        "course": {
          "id": "course-uuid",
          "title": "React Fundamentals",
          "thumbnail": "https://cloudinary.com/...",
          "category": "Programming"
        }
      }
    }
  ]
}
```

---

### 6.4 Verify Certificate (Public)

**GET** `/api/certificates/verify/:serialHash`

**No authentication required**

**Response:**
```json
{
  "success": true,
  "certificate": {
    "serialNumber": "LMS-2025-ABC123",
    "issuedAt": "2025-10-05T12:35:00.000Z",
    "imageUrl": "https://cloudinary.com/certificate.png",
    "user": {
      "name": "John Doe"
    },
    "course": {
      "title": "React Fundamentals",
      "category": "Programming"
    }
  }
}
```

---

## 7️⃣ Creator Application

### 7.1 Apply to Become Creator

**POST** `/api/creator/apply`

**Headers:** `Authorization: Bearer <token>`

**Requirements:** Must be LEARNER role

**Request Body:**
```json
{
  "bio": "I have 5 years of experience teaching web development...",
  "portfolio": "https://myportfolio.com",
  "experience": "Taught 1000+ students online, worked at Tech Corp..."
}
```

**Validation:**
- `bio`: Minimum 50 characters, maximum 1000 characters
- `portfolio`: Valid URL
- `experience`: Minimum 50 characters, maximum 2000 characters

**Response:**
```json
{
  "success": true,
  "message": "Creator application submitted successfully. You will be notified once reviewed.",
  "application": {
    "id": "app-uuid",
    "status": "PENDING",
    "bio": "I have 5 years...",
    "portfolio": "https://myportfolio.com",
    "experience": "Taught 1000+ students...",
    "createdAt": "2025-10-05T12:00:00.000Z"
  }
}
```

**Errors:**
- `403`: Only learners can apply
- `409`: Application already exists (pending or approved)

---

### 7.2 Check Application Status

**GET** `/api/creator/status`

**Headers:** `Authorization: Bearer <token>`

**Response (Pending):**
```json
{
  "success": true,
  "application": {
    "id": "app-uuid",
    "status": "PENDING",
    "bio": "I have 5 years...",
    "portfolio": "https://myportfolio.com",
    "experience": "Taught 1000+ students...",
    "createdAt": "2025-10-05T12:00:00.000Z",
    "reviewedAt": null,
    "rejectionReason": null
  }
}
```

**Response (Approved):**
```json
{
  "success": true,
  "application": {
    "id": "app-uuid",
    "status": "APPROVED",
    "bio": "I have 5 years...",
    "portfolio": "https://myportfolio.com",
    "experience": "Taught 1000+ students...",
    "createdAt": "2025-10-05T12:00:00.000Z",
    "reviewedAt": "2025-10-06T09:00:00.000Z",
    "rejectionReason": null
  },
  "message": "Your creator application has been approved! You can now create courses."
}
```

**Response (Rejected):**
```json
{
  "success": true,
  "application": {
    "id": "app-uuid",
    "status": "REJECTED",
    "bio": "I have 5 years...",
    "portfolio": "https://myportfolio.com",
    "experience": "Taught 1000+ students...",
    "createdAt": "2025-10-05T12:00:00.000Z",
    "reviewedAt": "2025-10-06T09:00:00.000Z",
    "rejectionReason": "Portfolio needs more teaching examples and student testimonials."
  }
}
```

**Response (No Application):**
```json
{
  "success": true,
  "application": null,
  "message": "No application found"
}
```

---

## 8️⃣ Frontend Implementation Checklist

### 🔐 Authentication Flow

**Pages to Create:**
- [ ] Registration Page (with email/phone selection)
- [ ] OTP Verification Page
- [ ] Complete Profile Page
- [ ] Login Page
- [ ] Forgot Password Page
- [ ] Reset Password Page

**Components:**
- [ ] OTP Input Component (6 digits)
- [ ] Password Strength Indicator
- [ ] Resend OTP Timer
- [ ] Auth Form Validation
- [ ] Protected Route Wrapper

---

### 👤 Profile Management

**Pages:**
- [ ] Profile View/Edit Page
- [ ] Settings Page

**Features:**
- [ ] Display user info (name, username, email, phone)
- [ ] Edit profile (name, username)
- [ ] Change email (with OTP verification)
- [ ] Change phone (with OTP verification)
- [ ] Change password
- [ ] Account status indicators (verified badges)

---

### 📚 Course Discovery

**Pages:**
- [ ] Course Catalog/Browse Page
- [ ] Course Details Page
- [ ] Lesson Player Page

**Features:**
- [ ] Course Cards with thumbnail, title, category, level, enrollment count
- [ ] Search and filter courses
- [ ] Category tabs/filters
- [ ] Level filters (BEGINNER, INTERMEDIATE, ADVANCED)
- [ ] Course detail view with lessons list
- [ ] Enrollment status badge
- [ ] Video player with controls
- [ ] Lesson transcript display
- [ ] Next/Previous lesson navigation

**Course Card Component:**
```jsx
<CourseCard>
  <Thumbnail />
  <Title />
  <CreatorName />
  <Category Badge />
  <Level Badge />
  <Duration />
  <EnrollmentCount />
  <ViewDetailsButton />
</CourseCard>
```

---

### 🎓 Learning Dashboard

**Pages:**
- [ ] My Learning/Dashboard Page
- [ ] Course Progress Page

**Components:**
- [ ] Enrollment Cards (with progress bars)
- [ ] Progress Statistics
- [ ] Continue Learning Section
- [ ] Completed Courses Section
- [ ] Lesson Progress Tracker
- [ ] Course Completion Indicator
- [ ] Certificate Badge (when earned)

**Dashboard Layout:**
```
+---------------------------+
|   Continue Learning       |
|   [Course Cards]          |
+---------------------------+
|   In Progress (35%)       |
|   [Progress Bars]         |
+---------------------------+
|   Completed Courses       |
|   [Certificate Badges]    |
+---------------------------+
```

---

### 📜 Certificates

**Pages:**
- [ ] My Certificates Page
- [ ] Certificate Viewer/Download Page
- [ ] Certificate Verification Page (public)

**Features:**
- [ ] Certificate gallery/grid
- [ ] Certificate preview modal
- [ ] Download as PDF button
- [ ] Share certificate link
- [ ] Certificate verification lookup
- [ ] QR code for verification (optional)

---

### 🎨 Creator Application

**Pages:**
- [ ] Become a Creator Page
- [ ] Application Form Page
- [ ] Application Status Page

**Features:**
- [ ] Application form (bio, portfolio, experience)
- [ ] Character count indicators
- [ ] Form validation
- [ ] Application status tracker
- [ ] Rejection reason display
- [ ] Reapply button (if rejected)

**Application Status Component:**
```jsx
<ApplicationStatus>
  {status === 'PENDING' && <PendingIndicator />}
  {status === 'APPROVED' && <SuccessMessage />}
  {status === 'REJECTED' && <RejectionReason />}
</ApplicationStatus>
```

---

### 🎯 Key User Flows

#### **Flow 1: New User Registration**
1. Registration page → Enter email/phone + password
2. OTP verification page → Enter 6-digit code
3. Complete profile page → Enter name + username
4. Redirect to login → Login with credentials
5. Dashboard → Browse courses

#### **Flow 2: Enroll and Learn**
1. Browse courses → Click course card
2. Course details page → View lessons, click "Enroll"
3. Enrollment confirmation → Start learning
4. Lesson player → Watch video, read transcript
5. Mark lesson complete → Progress updates
6. Complete all lessons → Certificate generated
7. Certificate page → View/download certificate

#### **Flow 3: Become Creator**
1. User settings → "Become a Creator" button
2. Application form → Fill bio, portfolio, experience
3. Submit application → Status: PENDING
4. Wait for admin review
5. Get approved → Role changes to CREATOR
6. Access creator dashboard → Create courses

---

### 📱 Responsive Design Priorities

**Mobile-First Components:**
- [ ] Bottom navigation bar (Home, Courses, Learning, Profile)
- [ ] Collapsible course lessons list
- [ ] Touch-friendly video player controls
- [ ] Swipeable course cards
- [ ] Mobile-optimized certificate viewer

**Desktop Enhancements:**
- [ ] Sidebar navigation
- [ ] Grid layout for courses (3-4 columns)
- [ ] Split-view lesson player (video + transcript)
- [ ] Hover effects on course cards
- [ ] Multi-column dashboard

---

### 🔔 Notifications & Feedback

**Toast/Snackbar Messages:**
- [ ] Enrollment success
- [ ] Lesson completion
- [ ] Course completion + certificate earned
- [ ] Profile updated
- [ ] OTP sent
- [ ] Application submitted
- [ ] Application approved/rejected

**Empty States:**
- [ ] No enrollments yet → "Browse courses to get started"
- [ ] No certificates yet → "Complete a course to earn your first certificate"
- [ ] No courses available → "Check back soon for new courses"

---

### 🎨 UI/UX Best Practices

**Progress Indicators:**
```jsx
// Linear Progress Bar
<ProgressBar value={66} max={100} label="66% Complete" />

// Circular Progress
<CircularProgress percentage={66} color="green" />

// Lesson Checklist
<LessonList>
  <Lesson completed={true} /> ✅
  <Lesson completed={false} /> ⭕
</LessonList>
```

**Loading States:**
- [ ] Skeleton loaders for course cards
- [ ] Spinner for enrollment action
- [ ] Progress bar for video buffering
- [ ] Lazy loading for course images

**Error Handling:**
- [ ] 404 - Course not found
- [ ] 403 - Not enrolled (redirect to course details)
- [ ] Network error fallback
- [ ] Retry mechanisms

---

### 🧪 Testing Checklist

**Authentication:**
- [ ] Register with email
- [ ] Register with phone
- [ ] Verify OTP (email/phone)
- [ ] Complete profile
- [ ] Login
- [ ] Logout
- [ ] Forgot password flow
- [ ] Protected routes redirect to login

**Courses:**
- [ ] Browse all courses
- [ ] View course details
- [ ] Enroll in course
- [ ] Cannot enroll twice (409 error)
- [ ] View enrolled courses
- [ ] Watch lesson videos
- [ ] Mark lesson complete
- [ ] Complete all lessons → certificate

**Profile:**
- [ ] View profile
- [ ] Update name/username
- [ ] Change email (with OTP)
- [ ] Change phone (with OTP)

**Creator Application:**
- [ ] Submit application as learner
- [ ] Check application status
- [ ] Cannot apply twice

---

## 🚀 Quick Start Example

```javascript
// Example: Login and Enroll Flow

// 1. Login
const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailOrPhone: 'john@example.com',
    password: 'password123'
  })
});
const { token, user } = await loginResponse.json();
localStorage.setItem('token', token);

// 2. Get Courses
const coursesResponse = await fetch('http://localhost:4000/api/courses', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { courses } = await coursesResponse.json();

// 3. Enroll
const courseId = courses[0].id;
const enrollResponse = await fetch(`http://localhost:4000/api/courses/${courseId}/enroll`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
const { enrollment } = await enrollResponse.json();

// 4. Get Lessons
const lessonsResponse = await fetch(`http://localhost:4000/api/courses/${courseId}/lessons`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { lessons } = await lessonsResponse.json();

// 5. Mark Lesson Complete
const lessonId = lessons[0].id;
const completeResponse = await fetch(`http://localhost:4000/api/lessons/${lessonId}/complete`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await completeResponse.json();
console.log(`Progress: ${data.courseProgress.progress}%`);
```

---

## 📊 State Management Suggestions

### Redux/Zustand Store Structure

```javascript
{
  auth: {
    token: string | null,
    user: User | null,
    isAuthenticated: boolean
  },
  courses: {
    allCourses: Course[],
    currentCourse: Course | null,
    loading: boolean
  },
  enrollments: {
    myEnrollments: Enrollment[],
    currentProgress: Progress | null
  },
  certificates: {
    myCertificates: Certificate[]
  },
  creatorApplication: {
    application: Application | null,
    status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'
  }
}
```

---

## 🎯 Summary

Your learner frontend needs to implement:

### **Core Features (Must Have):**
1. ✅ Authentication & Registration (9 endpoints)
2. ✅ Profile Management (6 endpoints)
3. ✅ Course Browsing (3 endpoints)
4. ✅ Enrollment (2 endpoints)
5. ✅ Learning & Progress (3 endpoints)
6. ✅ Certificates (4 endpoints)
7. ✅ Creator Application (2 endpoints)

### **Total API Endpoints for Learners: ~29 endpoints**

### **Recommended Tech Stack:**
- **Frontend:** React/Next.js, Vue/Nuxt, or Angular
- **State Management:** Redux Toolkit, Zustand, or React Query
- **UI Library:** Material-UI, Chakra UI, Ant Design, or Tailwind CSS
- **Video Player:** Video.js, Plyr, or React Player
- **Forms:** React Hook Form + Yup validation
- **HTTP Client:** Axios or Fetch with interceptors

---

**Your backend is fully functional! 🎉**  
Just build the frontend to consume these APIs and you'll have a complete LMS platform.

---

## 📞 Support

If you need clarification on any endpoint or encounter issues, check the backend logs:
```bash
tail -f /Users/work/Desktop/LMS/server.log
tail -f /Users/work/Desktop/LMS/logs/combined-*.log
```

**Test Credentials:**
```
Learner 1: john@example.com / password123
Learner 2: emma@example.com / password123
Admin:     admin@microcourses.com / password123
Creator:   sarah@example.com / password123
```

Happy coding! 🚀
