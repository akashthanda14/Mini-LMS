# MicroCourse LMS Backend

A full-featured Learning Management System backend with certificate generation, user auth, course management, and more.

---

## 🚀 Tech Stack

- **Node.js** (v18+)
- **Express.js** (API framework)
- **Prisma** (ORM for PostgreSQL)
- **BullMQ** (Job/queue management, Redis-backed)
- **Redis** (Queue backend)
- **PDFKit** (Certificate PDF generation)
- **Nodemailer** & **Resend** (Email delivery)
- **Swagger/OpenAPI** (API documentation)
- **dotenv** (Environment variable management)
- **Jest/Vitest** (Testing)
- **ESM Modules** (import/export syntax)

---

## 📁 Folder Structure

```
.
├── src
│   ├── controllers
│   ├── jobs
│   ├── middleware
│   ├── prisma
│   ├── routes
│   ├── services
│   └── utils
├── tests
├── .env.example
├── package.json
└── README.md
```

---

## 🏗️ Features

- **User Authentication** (JWT, Google OAuth)
- **Course Management** (CRUD, enrollments, progress tracking)
- **Lesson & Content Delivery**
- **Certificate Generation** (PDF, public verification, download)
- **Email Notifications** (SMTP, Resend API)
- **Profile Completion Flow**
- **Rate Limiting**
- **Job Queues** (certificate, transcription)
- **Admin & Learner Roles**
- **API Documentation** (Swagger/OpenAPI)
- **Environment-based Config**
- **Unit & Integration Tests**

---

## 🔑 API Endpoints (Full List)

### Auth & User
- `POST   /api/auth/register` — Register a new user
- `POST   /api/auth/login` — Login and receive JWT
- `POST   /api/auth/google` — Google OAuth login
- `POST   /api/auth/forgot-password` — Request password reset
- `POST   /api/auth/reset-password` — Reset password with token
- `GET    /api/auth/me` — Get current user profile (auth required)
- `PUT    /api/auth/profile` — Update user profile (auth required)
- `POST   /api/auth/logout` — Logout (if session-based)

### Courses
- `GET    /api/courses` — List all courses
- `GET    /api/courses/:id` — Get course details
- `POST   /api/courses` — Create a new course (admin)
- `PUT    /api/courses/:id` — Update course (admin)
- `DELETE /api/courses/:id` — Delete course (admin)

### Lessons
- `GET    /api/courses/:courseId/lessons` — List lessons in a course
- `GET    /api/lessons/:id` — Get lesson details
- `POST   /api/courses/:courseId/lessons` — Create lesson (admin)
- `PUT    /api/lessons/:id` — Update lesson (admin)
- `DELETE /api/lessons/:id` — Delete lesson (admin)

### Enrollments & Progress
- `POST   /api/enrollments` — Enroll in a course
- `GET    /api/enrollments` — List user enrollments
- `GET    /api/enrollments/:id` — Get enrollment details
- `PATCH  /api/enrollments/:id/progress` — Update lesson progress

### Certificates
- `GET    /api/enrollments/:id/certificate` — Get certificate metadata for enrollment
- `POST   /api/enrollments/:id/certificate/generate` — Queue certificate generation
- `GET    /api/enrollments/:id/certificate/download` — Download certificate PDF
- `GET    /api/certificates` — List all certificates for current user
- `GET    /api/certificates/verify/:serialHash` — Public certificate verification

### Admin & Misc
- `GET    /api/users` — List all users (admin)
- `GET    /api/users/:id` — Get user details (admin)
- `PUT    /api/users/:id` — Update user (admin)
- `DELETE /api/users/:id` — Delete user (admin)
- `GET    /api/stats` — Platform statistics (admin)

### Transcription (if enabled)
- `POST   /api/lessons/:id/transcribe` — Request transcription (admin/instructor)
- `GET    /api/lessons/:id/transcription` — Get transcription result

(See [swagger.yaml](swagger.yaml) for full details.)

---

## 🛠️ Best Practices

- **Modular Structure:** Separate controllers, services, routes, and middleware.
- **Async/Await:** All DB and IO code is async.
- **Validation:** Use middleware for UUID and input validation.
- **Error Handling:** Centralized error middleware.
- **Security:** JWT auth, role checks, and input sanitization.
- **Environment Config:** All secrets and config in `.env`.
- **Logging:** Winston or similar for structured logs.
- **Testing:** Unit and integration tests for all critical flows.
- **Queue Idempotency:** Certificate/job endpoints are idempotent and safe for retries.
- **Documentation:** Swagger/OpenAPI for all endpoints.

---

## 📝 How to Run

1. `npm install`
2. Set up `.env` (see `.env.example`)
3. Start Redis (`brew services start redis` or `docker run -p 6379:6379 redis`)
4. Start backend: `npm run dev`
5. Start workers: `node workers/certificateWorker.js`
6. Open [http://localhost:4000/api/docs](http://localhost:4000/api/docs) for Swagger UI

---

## 🤝 Contributing

- Follow code style in `.editorconfig` and `.prettierrc`
- Write/maintain tests for new features
- Document new endpoints in Swagger

---

## 🌐 Author & Links

- **Portfolio:** [akashdeep.site](https://akashdeep.site)
- **LinkedIn:** [akashthanda14](https://www.linkedin.com/in/akashthanda14)
- **GitHub:** [akashthanda14](https://github.com/akashthanda14)

---

## 📣 Contact
 +916239562383
