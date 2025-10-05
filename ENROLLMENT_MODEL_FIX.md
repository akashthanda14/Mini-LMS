# Admin Metrics - Enrollment Model Fix

## Issue Fixed
The `Enrollment` model in Prisma schema doesn't have a `status` field. It uses timestamps instead:

### Enrollment Model Fields:
```prisma
model Enrollment {
  id             String           @id @default(uuid())
  userId         String
  courseId       String
  progress       Int              @default(0)
  enrolledAt     DateTime         @default(now())
  completedAt    DateTime?        // ← NULL = active, NOT NULL = completed
  lastAccessedAt DateTime?
  // ... relations
}
```

## How Enrollment Status Works:

### Active Enrollments
- `completedAt` is `NULL`
- User is still taking the course
- Query: `{ completedAt: null }`

### Completed Enrollments
- `completedAt` is set to a timestamp
- User has finished the course
- Query: `{ completedAt: { not: null } }`

## Fixed Queries in adminMetricsService.js:

**Before (WRONG):**
```javascript
prisma.enrollment.count({ where: { status: 'ACTIVE' } })  // ❌ No status field!
prisma.enrollment.count({ where: { status: 'COMPLETED' } })
```

**After (CORRECT):**
```javascript
prisma.enrollment.count({ where: { completedAt: null } })      // ✅ Active
prisma.enrollment.count({ where: { completedAt: { not: null } } })  // ✅ Completed
```

## Metrics Response (Unchanged):

The API response structure remains the same:
```json
{
  "enrollments": {
    "total": 150,
    "active": 98,        // completedAt is null
    "completed": 52,     // completedAt is not null
    "completionRate": "34.67",
    "recentEnrollments": 15
  }
}
```

## Certificate Relationship:

Certificates are issued when enrollment is completed:
- `completedAt` timestamp is set
- Certificate record is created
- One-to-one relationship: `Enrollment.certificate`

## Test the Fix:

```bash
# Login and get metrics
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"admin@example.com","password":"YourPassword"}' | jq -r '.token')

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/metrics/summary
```

---

**Status:** ✅ Fixed - No more Prisma errors!
