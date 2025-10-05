# Backend-Frontend API Mismatches

## 🔴 Issues Found - Backend Changes Required

---

## 1. ✅ Admin Metrics - `/api/admin/metrics`

**Status:** ✅ MATCHES - No changes needed

**Current backend response:**
```json
{
  "success": true,
  "data": {
    "users": { "total": 100, "byRole": {...}, "recentSignups": 12 },
    "courses": { "total": 50, "byStatus": {...}, "recentlyCreated": 8 },
    "enrollments": { "total": 500, "active": 350, "completed": 150, "completionRate": "30.00", "recentEnrollments": 45 },
    "certificates": { "total": 140, "issuanceRate": "93.33" },
    "applications": { "total": 25, "byStatus": {...} },
    "timestamp": "2025-10-05T12:34:56.789Z"
  }
}
```

---

## 2. 🔴 Growth Analytics - `/api/admin/metrics/growth`

**Status:** ❌ MISMATCH - Needs fixes

### Current Backend Response:
```json
{
  "success": true,
  "data": {
    "users": {
      "current": 100,
      "previous": 85,
      "growthPercentage": "17.65"  // ❌ Missing "+" sign and "%" symbol
    },
    "courses": { ... },
    "enrollments": { ... },
    // ❌ Missing "certificates" object
    "period": "30 days",
    "timestamp": "2025-10-05T..."
  }
}
```

### Frontend Expects:
```json
{
  "success": true,
  "data": {
    "users": {
      "current": 100,
      "previous": 85,
      "growth": 15,                    // ✅ Add growth number
      "growthRate": "+17.65%"          // ✅ Format: "+17.65%" not "17.65"
    },
    "courses": {
      "current": 50,
      "previous": 45,
      "growth": 5,                     // ✅ Add growth number
      "growthRate": "+11.11%"          // ✅ Format with sign and %
    },
    "enrollments": {
      "current": 500,
      "previous": 420,
      "growth": 80,                    // ✅ Add growth number
      "growthRate": "+19.05%"          // ✅ Format with sign and %
    },
    "certificates": {                  // ✅ ADD THIS OBJECT
      "current": 140,
      "previous": 115,
      "growth": 25,
      "growthRate": "+21.74%"
    }
  }
}
```

### Required Changes in `services/adminMetricsService.js`:

```javascript
export const getGrowthAnalytics = async () => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      currentMonthUsers,
      previousMonthUsers,
      currentMonthCourses,
      previousMonthCourses,
      currentMonthEnrollments,
      previousMonthEnrollments,
      currentMonthCertificates,  // ✅ ADD THIS
      previousMonthCertificates  // ✅ ADD THIS
    ] = await Promise.all([
      // ... existing queries ...
      
      // ✅ ADD certificates queries:
      prisma.certificate.count({
        where: { issuedAt: { gte: thirtyDaysAgo } }
      }),
      prisma.certificate.count({
        where: { 
          issuedAt: { 
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ]);

    // ✅ UPDATE calculateGrowth to include sign and %
    const calculateGrowthRate = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? '+100.00%' : '0.00%';
      }
      const rate = ((current - previous) / previous * 100).toFixed(2);
      const sign = rate >= 0 ? '+' : '';
      return `${sign}${rate}%`;
    };

    return {
      users: {
        current: currentMonthUsers,
        previous: previousMonthUsers,
        growth: currentMonthUsers - previousMonthUsers,  // ✅ ADD THIS
        growthRate: calculateGrowthRate(currentMonthUsers, previousMonthUsers)
      },
      courses: {
        current: currentMonthCourses,
        previous: previousMonthCourses,
        growth: currentMonthCourses - previousMonthCourses,  // ✅ ADD THIS
        growthRate: calculateGrowthRate(currentMonthCourses, previousMonthCourses)
      },
      enrollments: {
        current: currentMonthEnrollments,
        previous: previousMonthEnrollments,
        growth: currentMonthEnrollments - previousMonthEnrollments,  // ✅ ADD THIS
        growthRate: calculateGrowthRate(currentMonthEnrollments, previousMonthEnrollments)
      },
      certificates: {  // ✅ ADD THIS ENTIRE OBJECT
        current: currentMonthCertificates,
        previous: previousMonthCertificates,
        growth: currentMonthCertificates - previousMonthCertificates,
        growthRate: calculateGrowthRate(currentMonthCertificates, previousMonthCertificates)
      }
    };
  } catch (error) {
    logger.error('Error fetching growth analytics', { error: error.message });
    throw new Error('Failed to fetch growth analytics');
  }
};
```

---

## 3. 🔴 Top Courses - `/api/admin/metrics/top-courses`

**Status:** ⚠️ PARTIAL MISMATCH

### Current Backend Response:
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "uuid",
      "title": "Course Title",
      "thumbnail": "url",
      "category": "Development",
      "level": "Beginner",
      "creator": {
        "id": "uuid",
        "name": "John Doe",
        "username": "johndoe"
      },
      "enrollmentCount": 1234,
      "certificateCount": 1050,      // ❌ Frontend doesn't need this
      "completionRate": "85.00"      // ✅ Good but needs "%" symbol
    }
  ]
}
```

### Frontend Expects:
```json
{
  "success": true,
  "data": {
    "courses": [                     // ✅ Wrap in "courses" key
      {
        "id": "uuid",
        "title": "Course Title",
        "creator": {
          "name": "John Doe",
          "email": "john@example.com"  // ✅ Add email
        },
        "enrollmentCount": 1234,
        "completionRate": "85.5%",     // ✅ Add "%" symbol
        "averageProgress": "67.3%"     // ✅ ADD THIS FIELD
      }
    ]
  }
}
```

### Required Changes in `services/adminMetricsService.js`:

```javascript
export const getTopCourses = async (limit = 10) => {
  try {
    const topCourses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true  // ✅ ADD email
          }
        },
        _count: {
          select: {
            enrollments: true,
            certificates: true
          }
        },
        // ✅ ADD enrollments to calculate average progress
        enrollments: {
          select: {
            progress: true
          }
        }
      },
      orderBy: {
        enrollments: { _count: 'desc' }
      },
      take: limit
    });

    return {
      courses: topCourses.map(course => {
        const completionRate = course._count.enrollments > 0
          ? ((course._count.certificates / course._count.enrollments) * 100).toFixed(1)
          : '0.0';
        
        // ✅ Calculate average progress
        const avgProgress = course.enrollments.length > 0
          ? (course.enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / course.enrollments.length).toFixed(1)
          : '0.0';

        return {
          id: course.id,
          title: course.title,
          creator: {
            name: course.creator.name,
            email: course.creator.email
          },
          enrollmentCount: course._count.enrollments,
          completionRate: `${completionRate}%`,  // ✅ Add %
          averageProgress: `${avgProgress}%`     // ✅ Add this field
        };
      })
    };
  } catch (error) {
    logger.error('Error fetching top courses', { error: error.message });
    throw new Error('Failed to fetch top courses');
  }
};
```

### Required Changes in `controllers/adminMetricsController.js`:

```javascript
export const getTopPerformingCourses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 50'
      });
    }

    const topCoursesData = await getTopCourses(limit);

    return res.status(200).json({
      success: true,
      data: topCoursesData  // ✅ Service now returns { courses: [...] }
    });
  } catch (error) {
    // ... error handling
  }
};
```

---

## 4. 🔴 Recent Activity - `/api/admin/metrics/activity`

**Status:** ❌ MAJOR MISMATCH

### Current Backend Response:
```json
{
  "success": true,
  "data": [
    {
      "type": "USER_REGISTERED",        // ❌ Wrong format
      "timestamp": "2025-10-05T...",
      "description": "John Doe joined as USER",
      "data": { ... }                   // ❌ Should be "metadata"
    }
  ]
}
```

### Frontend Expects:
```json
{
  "success": true,
  "data": {
    "activities": [                          // ✅ Wrap in "activities" key
      {
        "id": "activity-uuid-1",             // ✅ ADD id field
        "type": "enrollment",                // ✅ Use lowercase
        "description": "John Doe enrolled in Complete React Course",
        "timestamp": "2025-10-05T14:30:00.000Z",
        "metadata": {                        // ✅ Rename "data" to "metadata"
          "userId": "user-uuid",
          "courseId": "course-uuid"
        }
      },
      {
        "id": "activity-uuid-2",
        "type": "completion",                // ✅ Use "completion" not "CERTIFICATE_ISSUED"
        "description": "Jane Smith completed JavaScript Mastery",
        "timestamp": "2025-10-05T14:25:00.000Z",
        "metadata": { ... }
      },
      {
        "id": "activity-uuid-3",
        "type": "course_published",          // ✅ Use "course_published"
        "description": "New course 'Node.js Advanced' was published",
        "timestamp": "2025-10-05T14:20:00.000Z",
        "metadata": { "courseId": "course-uuid" }
      },
      {
        "id": "activity-uuid-4",
        "type": "application_approved",      // ✅ Use "application_approved"
        "description": "Creator application approved for Mike Johnson",
        "timestamp": "2025-10-05T14:15:00.000Z",
        "metadata": { ... }
      }
    ]
  }
}
```

### Valid Activity Types:
- `"enrollment"` - User enrolled in a course
- `"completion"` - User completed a course
- `"course_published"` - Course was published
- `"application_approved"` - Creator application approved

### Required Changes in `services/adminMetricsService.js`:

```javascript
export const getRecentActivity = async (limit = 20) => {
  try {
    const [recentUsers, recentCourses, recentEnrollments, recentCertificates] = await Promise.all([
      // ... existing queries ...
    ]);

    const activities = [
      // ❌ REMOVE user registration activities (not in frontend spec)
      
      ...recentCourses.map(course => ({
        id: `course-${course.id}`,               // ✅ ADD id
        type: 'course_published',                // ✅ Change to lowercase with underscore
        timestamp: course.submittedAt,
        description: `New course '${course.title}' was published`,
        metadata: {                              // ✅ Rename from "data"
          courseId: course.id
        }
      })),
      ...recentEnrollments.map(enrollment => ({
        id: `enrollment-${enrollment.id}`,       // ✅ ADD id
        type: 'enrollment',                      // ✅ Change to lowercase
        timestamp: enrollment.enrolledAt,
        description: `${enrollment.user.name} enrolled in ${enrollment.course.title}`,
        metadata: {                              // ✅ Rename from "data"
          userId: enrollment.user.id,
          courseId: enrollment.course.id
        }
      })),
      ...recentCertificates.map(cert => ({
        id: `certificate-${cert.id}`,            // ✅ ADD id
        type: 'completion',                      // ✅ Change from "CERTIFICATE_ISSUED"
        timestamp: cert.issuedAt,
        description: `${cert.enrollment.user.name} completed ${cert.enrollment.course.title}`,
        metadata: {                              // ✅ Rename from "data"
          userId: cert.enrollment.user.id,
          courseId: cert.enrollment.course.id
        }
      }))
    ];

    // Sort and wrap in "activities" key
    return {
      activities: activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
    };
  } catch (error) {
    logger.error('Error fetching recent activity', { error: error.message });
    throw new Error('Failed to fetch recent activity');
  }
};
```

### Required Changes in `controllers/adminMetricsController.js`:

```javascript
export const getActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }

    const activityData = await getRecentActivity(limit);

    return res.status(200).json({
      success: true,
      data: activityData  // ✅ Service now returns { activities: [...] }
    });
  } catch (error) {
    // ... error handling
  }
};
```

---

## 5. ⚠️ Pending Applications - `/api/admin/applications/pending`

**Status:** ⚠️ MINOR MISMATCH

### Current Backend:
```json
{
  "success": true,
  "count": 7,
  "applications": [
    {
      "id": "uuid",
      "status": "PENDING",
      "createdAt": "2025-10-01T...",
      "applicant": {
        "id": "uuid",
        "name": "John Doe",
        "username": "johndoe",
        "email": "john@example.com"
        // ❌ Missing "role" field
      },
      "bio": "...",
      "portfolio": "...",
      "experience": "..."
      // ❌ Missing "reviewedAt", "rejectionReason", "reviewer"
    }
  ]
}
```

### Frontend Expects:
```json
{
  "success": true,
  "count": 7,
  "applications": [
    {
      "id": "uuid",
      "status": "PENDING",
      "createdAt": "2025-10-01T...",
      "reviewedAt": null,              // ✅ ADD (null for pending)
      "rejectionReason": null,         // ✅ ADD (null for pending)
      "applicant": {
        "id": "uuid",
        "name": "John Doe",
        "username": "johndoe",
        "email": "john@example.com",
        "role": "USER"                 // ✅ ADD role field
      },
      "bio": "...",
      "portfolio": "...",
      "experience": "...",
      "reviewer": null                 // ✅ ADD (null for pending)
    }
  ]
}
```

### Required Changes in `controllers/adminApplicationController.js`:

```javascript
export const getPendingApplications = async (req, res) => {
  try {
    const applications = await getApplicationsByStatus('PENDING');

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications: applications.map(app => ({
        id: app.id,
        status: app.status,
        createdAt: app.createdAt,
        reviewedAt: app.reviewedAt || null,          // ✅ ADD
        rejectionReason: app.rejectionReason || null,// ✅ ADD
        applicant: {
          id: app.user.id,
          name: app.user.name,
          username: app.user.username,
          email: app.user.email,
          role: app.user.role                        // ✅ ADD role
        },
        bio: app.bio,
        portfolio: app.portfolio,
        experience: app.experience,
        reviewer: app.reviewer || null               // ✅ ADD
      })),
    });
  } catch (error) {
    // ... error handling
  }
};
```

---

## 6. ⚠️ Pending Courses - `/api/admin/courses/pending`

**Status:** ⚠️ MINOR MISMATCH

### Current Backend:
```json
{
  "success": true,
  "count": 5,
  "courses": [
    {
      "id": "uuid",
      "title": "Course Title",
      "description": "...",
      "thumbnail": "url",
      "category": "Development",    // ❌ Frontend doesn't need
      "level": "Beginner",          // ❌ Frontend doesn't need
      "status": "PENDING",
      "submittedAt": "2025-10-03T...",
      "creator": { ... },
      "lessonCount": 12
      // ❌ Missing: createdAt, updatedAt, reviewedAt, rejectionFeedback, lessons array
    }
  ]
}
```

### Frontend Expects:
```json
{
  "success": true,
  "count": 5,
  "courses": [
    {
      "id": "uuid",
      "title": "Course Title",
      "description": "...",
      "thumbnailUrl": "url",             // ✅ Rename "thumbnail" to "thumbnailUrl"
      "status": "PENDING",
      "createdAt": "2025-10-01T...",     // ✅ ADD
      "updatedAt": "2025-10-03T...",     // ✅ ADD
      "submittedAt": "2025-10-03T...",
      "reviewedAt": null,                // ✅ ADD
      "rejectionFeedback": null,         // ✅ ADD
      "lessonCount": 12,
      "creator": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "lessons": [                       // ✅ ADD lessons array
        {
          "id": "lesson-uuid-1",
          "title": "Introduction to Hooks",
          "order": 1,
          "videoUrl": "https://cloudinary.com/video1.mp4"
        }
      ]
    }
  ]
}
```

### Required Changes in `controllers/adminCourseController.js`:

```javascript
export const getPendingCourses = async (req, res) => {
  try {
    // ✅ Update getCourses to include lessons
    const courses = await prisma.course.findMany({
      where: { status: 'PENDING' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        lessons: {                    // ✅ ADD lessons
          select: {
            id: true,
            title: true,
            order: true,
            videoUrl: true
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { lessons: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnail,        // ✅ Rename to thumbnailUrl
        status: course.status,
        createdAt: course.createdAt,           // ✅ ADD
        updatedAt: course.updatedAt,           // ✅ ADD
        submittedAt: course.submittedAt,
        reviewedAt: course.reviewedAt || null, // ✅ ADD
        rejectionFeedback: course.rejectionFeedback || null, // ✅ ADD
        lessonCount: course._count.lessons,
        creator: {
          id: course.creator.id,
          name: course.creator.name,
          email: course.creator.email
        },
        lessons: course.lessons            // ✅ ADD lessons array
      }))
    });
  } catch (error) {
    // ... error handling
  }
};
```

---

## 7. ⚠️ Publish Course Response

### Current Response (likely):
```json
{
  "success": true,
  "message": "Course published successfully",
  "course": {
    "id": "uuid",
    "status": "PUBLISHED"
    // ❌ Missing other fields
  }
}
```

### Frontend Expects:
```json
{
  "success": true,
  "message": "Course published successfully",
  "course": {
    "id": "uuid",
    "title": "Course Title",           // ✅ ADD
    "status": "PUBLISHED",
    "publishedAt": "2025-10-05T...",   // ✅ ADD (this might exist)
    "creator": {                       // ✅ ADD
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "lessonCount": 12                  // ✅ ADD
  }
}
```

---

## 8. ⚠️ Reject Course Response

### Frontend Expects:
```json
{
  "success": true,
  "message": "Course rejected",
  "course": {
    "id": "uuid",
    "title": "Course Title",           // ✅ Include these fields
    "status": "REJECTED",
    "rejectionFeedback": "...",
    "creator": {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

---

## 9. ✅ Auth `/api/auth/me`

**Status:** ✅ MATCHES - No changes needed

---

## 📋 Summary of Required Changes

### Priority 1 - Critical (Frontend won't work without these):

1. **Growth Analytics** (`services/adminMetricsService.js`)
   - Add certificates growth data
   - Change `growthPercentage` to `growthRate` with "+/-" and "%"
   - Add `growth` number field

2. **Recent Activity** (`services/adminMetricsService.js`)
   - Wrap response in `{ activities: [...] }`
   - Change activity types to lowercase
   - Rename `data` to `metadata`
   - Add `id` field to each activity

3. **Top Courses** (`services/adminMetricsService.js`)
   - Wrap response in `{ courses: [...] }`
   - Add "%" symbol to rates
   - Add `averageProgress` field
   - Add creator email

### Priority 2 - Important (Better UX):

4. **Pending Applications** (`controllers/adminApplicationController.js`)
   - Add `reviewedAt`, `rejectionReason`, `reviewer` fields (null for pending)
   - Add `role` to applicant object

5. **Pending Courses** (`controllers/adminCourseController.js`)
   - Rename `thumbnail` to `thumbnailUrl`
   - Add `createdAt`, `updatedAt`, `reviewedAt`, `rejectionFeedback`
   - Add `lessons` array with basic lesson info

6. **Publish/Reject Responses** (`controllers/adminCourseController.js`)
   - Include full course details in response

### Priority 3 - Optional (Nice to have):

7. Consider adding input validation for:
   - Rejection reason minimum 10 characters
   - Rejection feedback minimum 10 characters

---

## 🧪 Testing Checklist

After making changes, test each endpoint:

```bash
# 1. Growth Analytics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/metrics/growth | jq

# 2. Top Courses
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/metrics/top-courses | jq

# 3. Recent Activity
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/metrics/activity | jq

# 4. Pending Applications
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/applications/pending | jq

# 5. Pending Courses
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/courses/pending | jq
```

---

## 📝 Files to Modify

1. `services/adminMetricsService.js` - Lines ~150-440
2. `controllers/adminMetricsController.js` - Lines ~70-150
3. `controllers/adminApplicationController.js` - Lines ~78-110
4. `controllers/adminCourseController.js` - Lines ~77-230

**Total estimated changes:** ~200 lines of code across 4 files

---

**Priority Order:** 
1. Fix Growth Analytics (frontend feature broken)
2. Fix Recent Activity (frontend feature broken)
3. Fix Top Courses (frontend feature broken)
4. Fix Pending Applications/Courses (minor UI issues)
