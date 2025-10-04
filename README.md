# Mini-LMS: Comprehensive Learning Management System

Welcome to **Mini-LMS**, a full-featured Learning Management System powered by Node.js, Express, Prisma, and PostgreSQL. This platform supports:

- Secure JWT-based **Authentication** & **Role-Based Access Control** (Learner, Creator, Admin)
- **Course** and **Lesson** management with video streaming (Cloudinary) and transcripts
- **Enrollment** and **Progress Tracking**, including visual charts and certificates
- **Creator Onboarding** and **Admin Review** workflows
- Robust **Testing**, **Error Handling**, and **Deployment** optimizations

---

## 📖 Documentation Index

All documentation lives in the `docs/` folder. Key resources:

- 📂 [API Documentation](docs/API_DOCUMENTATION.md)
- 📂 [Authentication & RBAC](docs/AUTH_RBAC_DOCUMENTATION.md)
- 📂 [Course Management Guide](docs/COURSE_MANAGEMENT.md)
- 📂 [Lesson Management Guide](docs/LESSON_MANAGEMENT.md)
- 📂 [Enrollment & Progress](docs/ENROLLMENT_SYSTEM.md)
- 📂 [Creator Application Flow](docs/CREATOR_APPLICATION_DOCUMENTATION.md)
- 📂 [Admin Review System](docs/ADMIN_APPLICATION_REVIEW.md) ❌ (update if missing)
- 📂 [Progress & Certificates](docs/PROGRESS_CERTIFICATES.md) ❌ (update if missing)
- 📂 [Architecture Overview](docs/BACKEND_ARCHITECTURE_DIAGRAM.md)
- 📂 [Database Schema](docs/LMS_SCHEMA_DOCUMENTATION.md)
- 📂 [Setup & Deployment](docs/SETUP.md)
- 📂 [Testing & QA Guides](docs/TESTING_INSTRUCTIONS.md, docs/AUTH_FLOW_TEST.md)

Use [DOC_INDEX.md](docs/DOC_INDEX.md) for a full listing and quick links.

---

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/akashthanda14/Mini-LMS.git
   cd Mini-LMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set your database URL, JWT secret, Cloudinary keys, etc.

4. **Database Setup**
   ```bash
   npx prisma migrate dev       # Run migrations
   npx prisma db seed           # Seed test data
   ```

5. **Start the server**
   ```bash
   npm run dev                  # Development mode with hot reload
   ```

6. **Access the API docs**
   Open <http://localhost:4000/api-docs> in your browser.

---

## 📦 Project Structure

```
📦 Mini-LMS/
 ┣ 📂 controllers/       # Express route handlers
 ┣ 📂 middleware/        # Auth, RBAC, logging middleware
 ┣ 📂 routes/            # API route definitions
 ┣ 📂 services/          # Business logic and DB interactions
 ┣ 📂 prisma/            # Prisma schema & migrations
 ┣ 📂 config/            # App config (Cloudinary, queue)
 ┣ 📂 docs/              # Markdown documentation
 ┣ 📂 scripts/           # Utility scripts & tests
 ┣ 📂 workers/           # Background workers (transcription, etc.)
 ┣ 📜 server.js          # Entry point
 ┣ 📜 next.config.js     # Next.js frontend config
 ┗ 📜 README.md          # Project overview (this file)
```

---

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to your branch: `git push origin feature/my-feature`
5. Open a Pull Request against `main`

Refer to [COMMIT_HISTORY.md](docs/COMMIT_HISTORY.md) for commit guidelines.

---

## 🤝 Community & Support

- 🐛 Report bugs and request features via GitHub Issues
- 💬 Join the discussion on Slack or Discord (invite link in `docs/COMMUNITY.md`)
- 📧 Contact maintainers: `support@minilms.example.com`

---

## ⚖️ License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
