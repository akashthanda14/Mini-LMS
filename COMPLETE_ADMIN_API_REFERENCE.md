# Complete Admin Panel API Reference

## Authentication
All admin endpoints require:
- **JWT Token** with `role: 'ADMIN'`
- **Authorization Header:** `Bearer <token>`

**Get Admin Token:**
```bash
# Login as admin user
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"admin@example.com","password":"AdminPassword123"}'
```

---

## 1️⃣ Creator Application Management

### List All Applications
**GET** `/api/admin/applications?status=PENDING`

**Query Params:**
- `status` (optional): `PENDING`, `APPROVED`, `REJECTED`

**Response:**
```json
{
  "success": true,
  "count": 7,
  "applications": [
    {
      "id": "uuid",
      "status": "PENDING",
      "createdAt": "2025-10-01T...",
      "reviewedAt": null,
      "rejectionReason": null,
      "applicant": {
        "id": "user-uuid",
        "name": "John Doe",
        "username": "johndoe",
        "email": "john@example.com",
        "role": "USER"
      },
      "bio": "Experienced instructor...",
      "portfolio": "https://portfolio.com",
      "experience": "5 years teaching",
      "reviewer": null
    }
  ]
}
```

---

### Get Pending Applications
**GET** `/api/admin/applications/pending`

Shortcut for filtering pending applications.

---

### Get Single Application
**GET** `/api/admin/applications/:id`

Returns detailed application with full user profile.

---

### Approve Application
**POST** `/api/admin/applications/:id/approve`

**Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Creator application approved successfully. User role upgraded to CREATOR.",
  "application": {
    "id": "uuid",
    "status": "APPROVED",
    "reviewedAt": "2025-10-05T...",
    "applicant": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CREATOR"
    }
  }
}
```

**Effects:**
- User's role updated to `CREATOR`
- User can now create courses
- Application marked as approved

---

### Reject Application
**POST** `/api/admin/applications/:id/reject`

**Body:**
```json
{
  "reason": "Portfolio does not demonstrate sufficient teaching experience"
}
```

**Validation:**
- Reason must be at least 10 characters

**Response:**
```json
{
  "success": true,
  "message": "Creator application rejected.",
  "application": {
    "id": "uuid",
    "status": "REJECTED",
    "reviewedAt": "2025-10-05T...",
    "rejectionReason": "Portfolio does not demonstrate...",
    "applicant": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

## 2️⃣ Course Review & Moderation

### List All Courses
**GET** `/api/admin/courses?status=PENDING`

**Query Params:**
- `status` (optional): `DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED`

**Response:**
```json
{
  "success": true,
  "count": 12,
  "courses": [
    {
      "id": "course-uuid",
      "title": "Advanced React Patterns",
      "description": "Learn advanced React...",
      "thumbnail": "https://cloudinary.com/...",
      "category": "Programming",
      "level": "ADVANCED",
      "duration": 3600,
      "status": "PENDING",
      "createdAt": "2025-10-01T...",
      "submittedAt": "2025-10-03T...",
      "publishedAt": null,
      "creator": {
        "id": "creator-uuid",
        "name": "Jane Smith",
        "username": "janesmith",
        "email": "jane@example.com"
      },
      "lessonCount": 12,
      "enrollmentCount": 0
    }
  ]
}
```

---

### Get Pending Courses
**GET** `/api/admin/courses/pending`

Shortcut for courses awaiting review.

---

### Get Course Details
**GET** `/api/admin/courses/:id`

**Response:**
```json
{
  "success": true,
  "course": {
    "id": "course-uuid",
    "title": "Advanced React Patterns",
    "description": "Learn advanced React...",
    "thumbnail": "https://cloudinary.com/...",
    "category": "Programming",
    "level": "ADVANCED",
    "duration": 3600,
    "status": "PENDING",
    "createdAt": "2025-10-01T...",
    "updatedAt": "2025-10-03T...",
    "submittedAt": "2025-10-03T...",
    "publishedAt": null,
    "rejectionReason": null,
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
        "title": "Introduction to Hooks",
        "videoUrl": "https://cloudinary.com/...",
        "transcript": "...",
        "order": 1,
        "duration": 300,
        "createdAt": "2025-10-01T..."
      }
    ],
    "stats": {
      "lessonCount": 12,
      "enrollmentCount": 0,
      "certificateCount": 0
    }
  }
}
```

---

### Publish Course
**POST** `/api/admin/courses/:id/publish`

**Body:** None required

**Requirements:**
- Course must be in `PENDING` status
- Course must have at least one lesson

**Response:**
```json
{
  "success": true,
  "message": "Course published successfully",
  "course": {
    "id": "course-uuid",
    "title": "Advanced React Patterns",
    "status": "PUBLISHED",
    "publishedAt": "2025-10-05T...",
    "creator": {
      "id": "creator-uuid",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "lessonCount": 12
  }
}
```

**Effects:**
- Course becomes visible to all users
- Users can enroll
- Creator can no longer edit course

---

### Reject Course
**POST** `/api/admin/courses/:id/reject`

**Body:**
```json
{
  "feedback": "Course content needs clearer learning objectives and better video quality"
}
```

**Validation:**
- Feedback must be at least 10 characters

**Response:**
```json
{
  "success": true,
  "message": "Course rejected",
  "course": {
    "id": "course-uuid",
    "title": "Advanced React Patterns",
    "status": "REJECTED",
    "rejectionReason": "Course content needs clearer...",
    "creator": {
      "id": "creator-uuid",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

**Effects:**
- Course status changes to `REJECTED`
- Creator can see feedback
- Creator can revise and resubmit

---

## 3️⃣ Dashboard & Analytics

### Get Full Metrics
**GET** `/api/admin/metrics`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1523,
      "byRole": {
        "USER": 1450,
        "CREATOR": 68,
        "ADMIN": 5
      },
      "recentSignups": 42
    },
    "courses": {
      "total": 256,
      "byStatus": {
        "DRAFT": 45,
        "PENDING": 12,
        "PUBLISHED": 187,
        "REJECTED": 12
      },
      "recentlyCreated": 8
    },
    "enrollments": {
      "total": 8934,
      "active": 6721,
      "completed": 2213,
      "completionRate": "24.77",
      "recentEnrollments": 234
    },
    "certificates": {
      "total": 2150,
      "issuanceRate": "97.15"
    },
    "applications": {
      "total": 89,
      "byStatus": {
        "PENDING": 7,
        "APPROVED": 68,
        "REJECTED": 14
      }
    },
    "timestamp": "2025-10-05T12:00:00.000Z"
  }
}
```

---

### Get Quick Summary
**GET** `/api/admin/metrics/summary`

Lightweight version for frequent polling.

---

### Get Growth Analytics
**GET** `/api/admin/metrics/growth`

Month-over-month comparison (last 30 days vs previous 30 days).

---

### Get Top Courses
**GET** `/api/admin/metrics/top-courses?limit=10`

**Query Params:**
- `limit` (optional): 1-50, default: 10

---

### Get Recent Activity
**GET** `/api/admin/metrics/activity?limit=20`

**Query Params:**
- `limit` (optional): 1-100, default: 20

---

## 🎯 Common Admin Workflows

### 1. Review Creator Application
```bash
# Get pending applications
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/applications/pending

# Get specific application details
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/applications/{id}

# Approve
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/applications/{id}/approve

# Or reject
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Portfolio needs more examples"}' \
  http://localhost:4000/api/admin/applications/{id}/reject
```

---

### 2. Moderate Course
```bash
# Get pending courses
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/courses/pending

# Review course details and lessons
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/courses/{id}

# Publish
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/courses/{id}/publish

# Or reject
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feedback":"Needs better video quality"}' \
  http://localhost:4000/api/admin/courses/{id}/reject
```

---

### 3. Monitor Platform
```bash
# Get dashboard summary
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/metrics/summary

# Check growth trends
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/metrics/growth

# View recent activity
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/metrics/activity
```

---

## 🔒 Admin Role Management

### How to Make a User Admin
```sql
-- Update user role in database
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';
```

Or use Prisma:
```javascript
await prisma.user.update({
  where: { email: 'admin@example.com' },
  data: { role: 'ADMIN' }
});
```

---

## 📱 Frontend Implementation Checklist

### Admin Dashboard Components

**1. Dashboard Home**
- [ ] Summary stats cards
- [ ] Pending items badges
- [ ] Growth indicators
- [ ] Recent activity feed

**2. Creator Applications Page**
- [ ] List view with filters (PENDING/APPROVED/REJECTED)
- [ ] Application detail modal
- [ ] Approve/Reject actions
- [ ] Reason textarea for rejection

**3. Course Review Page**
- [ ] Course list with status filters
- [ ] Course preview with lessons
- [ ] Video player for lesson previews
- [ ] Publish/Reject actions
- [ ] Feedback textarea for rejection

**4. Analytics Page**
- [ ] Charts for growth trends
- [ ] Top courses table
- [ ] User distribution pie chart
- [ ] Activity timeline

---

## 🧪 Testing All Admin Endpoints

```bash
# Save admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"admin@example.com","password":"YourPassword"}' | jq -r '.token')

# Test all endpoints
echo "Testing Applications..."
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/admin/applications
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/admin/applications/pending

echo "Testing Courses..."
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/admin/courses
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/admin/courses/pending

echo "Testing Metrics..."
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/admin/metrics/summary
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/admin/metrics/growth
```

---

## 📊 Summary of Admin Powers

| Feature | Endpoint Count | Description |
|---------|---------------|-------------|
| **Applications** | 5 endpoints | Review, approve/reject creator applications |
| **Courses** | 5 endpoints | Review, publish/reject courses |
| **Metrics** | 5 endpoints | Dashboard analytics and insights |
| **TOTAL** | **15 endpoints** | Complete admin functionality |

---

**Your admin panel is fully functional!** 🎉

Just ensure your frontend integrates these endpoints properly.
