# Admin Metrics API Documentation

## Overview
Admin dashboard metrics and analytics endpoints for platform insights.

**Base URL:** `/api/admin/metrics`  
**Authentication:** Required (JWT token with ADMIN role)  
**Authorization Header:** `Bearer <admin_token>`

---

## Endpoints

### 1. Get Comprehensive Dashboard Metrics
**GET** `/api/admin/metrics`

Returns complete dashboard statistics including users, courses, enrollments, certificates, and applications.

**Request:**
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/metrics
```

**Response 200:**
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

### 2. Get Quick Summary (Lightweight)
**GET** `/api/admin/metrics/summary`

Returns essential metrics only - faster response for dashboards.

**Request:**
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/metrics/summary
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1523,
      "recentSignups": 42
    },
    "courses": {
      "total": 256,
      "pending": 12,
      "published": 187
    },
    "enrollments": {
      "total": 8934,
      "active": 6721
    },
    "applications": {
      "pending": 7
    },
    "timestamp": "2025-10-05T12:00:00.000Z"
  }
}
```

---

### 3. Get Growth Analytics
**GET** `/api/admin/metrics/growth`

Returns month-over-month growth comparison (last 30 days vs previous 30 days).

**Request:**
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/metrics/growth
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "users": {
      "current": 42,
      "previous": 38,
      "growthPercentage": "10.53"
    },
    "courses": {
      "current": 8,
      "previous": 12,
      "growthPercentage": "-33.33"
    },
    "enrollments": {
      "current": 234,
      "previous": 198,
      "growthPercentage": "18.18"
    },
    "period": "30 days",
    "timestamp": "2025-10-05T12:00:00.000Z"
  }
}
```

---

### 4. Get Top Performing Courses
**GET** `/api/admin/metrics/top-courses`

Returns courses ranked by enrollment count.

**Query Parameters:**
- `limit` (optional): Number of courses to return (1-50, default: 10)

**Request:**
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/api/admin/metrics/top-courses?limit=5"
```

**Response 200:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "course-uuid-1",
      "title": "Advanced JavaScript Patterns",
      "thumbnail": "https://cloudinary.com/...",
      "category": "Programming",
      "level": "ADVANCED",
      "creator": {
        "id": "creator-uuid",
        "name": "Jane Doe",
        "username": "janedoe"
      },
      "enrollmentCount": 523,
      "certificateCount": 412,
      "completionRate": "78.78"
    }
  ]
}
```

---

### 5. Get Recent Activity
**GET** `/api/admin/metrics/activity`

Returns recent platform activities (registrations, enrollments, course submissions, certificates).

**Query Parameters:**
- `limit` (optional): Number of activities to return (1-100, default: 20)

**Request:**
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/api/admin/metrics/activity?limit=10"
```

**Response 200:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "type": "CERTIFICATE_ISSUED",
      "timestamp": "2025-10-05T11:45:23.000Z",
      "description": "John Smith completed \"React Fundamentals\"",
      "data": {
        "certificateId": "cert-uuid",
        "userName": "John Smith",
        "courseTitle": "React Fundamentals"
      }
    },
    {
      "type": "ENROLLMENT_CREATED",
      "timestamp": "2025-10-05T11:30:12.000Z",
      "description": "Alice Brown enrolled in \"Node.js Mastery\"",
      "data": {
        "enrollmentId": "enroll-uuid",
        "userName": "Alice Brown",
        "courseTitle": "Node.js Mastery"
      }
    },
    {
      "type": "COURSE_SUBMITTED",
      "timestamp": "2025-10-05T10:15:45.000Z",
      "description": "Bob Johnson submitted \"Python for Data Science\"",
      "data": {
        "courseId": "course-uuid",
        "courseTitle": "Python for Data Science",
        "creatorName": "Bob Johnson"
      }
    },
    {
      "type": "USER_REGISTERED",
      "timestamp": "2025-10-05T09:22:33.000Z",
      "description": "Sarah Lee joined as USER",
      "data": {
        "userId": "user-uuid",
        "userName": "Sarah Lee",
        "role": "USER"
      }
    }
  ]
}
```

---

## Activity Types

| Type | Description |
|------|-------------|
| `USER_REGISTERED` | New user signed up |
| `COURSE_SUBMITTED` | Creator submitted course for review |
| `ENROLLMENT_CREATED` | User enrolled in a course |
| `CERTIFICATE_ISSUED` | Certificate awarded to user |

---

## Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

**400 Bad Request (invalid limit):**
```json
{
  "success": false,
  "message": "Limit must be between 1 and 50"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to retrieve metrics"
}
```

---

## Frontend Integration Examples

### React Hook
```typescript
const useAdminMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/admin/metrics', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const data = await response.json();
      setMetrics(data.data);
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  return { metrics, loading };
};
```

### Display Growth with Indicator
```tsx
const GrowthIndicator = ({ value }) => {
  const isPositive = parseFloat(value) > 0;
  return (
    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
      {isPositive ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
};
```

---

## Performance Notes

- **Summary endpoint** is optimized for quick loading (< 200ms typical)
- **Full metrics** may take 500-1000ms depending on data volume
- All endpoints use parallel queries for optimal performance
- Consider caching results on frontend (5-10 minutes)
- Use summary endpoint for frequent polling, full metrics on page load

---

## Testing

```bash
# Get admin token first
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"admin@example.com","password":"YourPassword"}' | jq -r '.token')

# Test all endpoints
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/admin/metrics
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/admin/metrics/summary
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/admin/metrics/growth
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:4000/api/admin/metrics/top-courses?limit=5"
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:4000/api/admin/metrics/activity?limit=20"
```

---

## Dashboard Implementation Guide

**Recommended Layout:**
1. Top row: Summary cards (users, courses, enrollments, pending items)
2. Second row: Growth indicators with sparklines
3. Third row: Top courses table + Recent activity feed
4. Auto-refresh summary every 5 minutes

**Metrics to highlight:**
- Pending applications count (action required)
- Pending courses count (action required)
- Recent signups (last 7 days)
- Enrollment growth percentage
- Platform completion rate

---

Ready to use! Restart your server and test the endpoints.
