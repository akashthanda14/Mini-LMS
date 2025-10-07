# Frontend Implementation Prompt: Creator Application System

## Overview
Implement a complete creator application flow that allows learners to apply to become course creators. The system includes application submission, status tracking, and a creator dashboard for approved users.

---

## Backend API Endpoints (EXACT PATHS)

### 1. Submit Creator Application
```
POST /api/creator/apply
```

**Access:** Private - LEARNER role only

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bio": "Experienced educator with 5+ years teaching web development. Passionate about making tech education accessible...",
  "experience": "I've taught 500+ students online and created multiple courses on JavaScript, React, and Node.js...",
  "portfolio": "https://myportfolio.com"
}
```

**Field Requirements:**
- `bio` (required): 100-500 characters
- `experience` (required): minimum 50 characters
- `portfolio` (optional): valid URL format

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Creator application submitted successfully. You will be notified once reviewed.",
  "application": {
    "id": "uuid-string",
    "status": "PENDING",
    "createdAt": "2025-10-05T12:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request** (Missing fields):
```json
{
  "success": false,
  "message": "Bio and experience are required fields."
}
```

**400 Bad Request** (Bio length):
```json
{
  "success": false,
  "message": "Bio must be between 100 and 500 characters.",
  "bioLength": 85
}
```

**400 Bad Request** (Invalid portfolio):
```json
{
  "success": false,
  "message": "Portfolio must be a valid URL."
}
```

**400 Bad Request** (Short experience):
```json
{
  "success": false,
  "message": "Experience must be at least 50 characters."
}
```

**403 Forbidden** (Not a learner):
```json
{
  "success": false,
  "message": "Only learners can apply to become creators.",
  "currentRole": "CREATOR"
}
```

**409 Conflict** (Already applied):
```json
{
  "success": false,
  "message": "You already have a creator application"
}
```

---

### 2. Get Application Status
```
GET /api/creator/status
```

**Access:** Private - Any authenticated user

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200 OK) - Application exists:**
```json
{
  "success": true,
  "application": {
    "id": "uuid-string",
    "status": "PENDING",
    "bio": "Experienced educator...",
    "portfolio": "https://myportfolio.com",
    "experience": "I've taught 500+ students...",
    "createdAt": "2025-10-05T12:00:00.000Z",
    "updatedAt": "2025-10-05T12:00:00.000Z",
    "reviewedAt": null,
    "rejectionReason": null,
    "reviewer": null
  }
}
```

**Success Response (200 OK) - Application approved:**
```json
{
  "success": true,
  "application": {
    "id": "uuid-string",
    "status": "APPROVED",
    "bio": "Experienced educator...",
    "portfolio": "https://myportfolio.com",
    "experience": "I've taught 500+ students...",
    "createdAt": "2025-10-05T12:00:00.000Z",
    "updatedAt": "2025-10-06T10:30:00.000Z",
    "reviewedAt": "2025-10-06T10:30:00.000Z",
    "rejectionReason": null,
    "reviewer": {
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

**Success Response (200 OK) - Application rejected:**
```json
{
  "success": true,
  "application": {
    "id": "uuid-string",
    "status": "REJECTED",
    "bio": "Experienced educator...",
    "portfolio": "https://myportfolio.com",
    "experience": "I've taught 500+ students...",
    "createdAt": "2025-10-05T12:00:00.000Z",
    "updatedAt": "2025-10-06T10:30:00.000Z",
    "reviewedAt": "2025-10-06T10:30:00.000Z",
    "rejectionReason": "Insufficient teaching experience demonstrated",
    "reviewer": {
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

**404 Not Found** (No application):
```json
{
  "success": false,
  "message": "No application found. You can submit an application to become a creator.",
  "canApply": true
}
```

---

### 3. Get Creator Dashboard
```
GET /api/creator/dashboard
```

**Access:** Private - CREATOR role only

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "dashboard": {
    "creator": {
      "id": "uuid",
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "application": {
      "approvedAt": "2025-10-06T10:30:00.000Z",
      "status": "APPROVED"
    },
    "stats": {
      "totalCourses": 5,
      "publishedCourses": 3,
      "draftCourses": 2,
      "totalEnrollments": 150,
      "totalLessons": 45,
      "totalCertificates": 23
    },
    "courses": [
      {
        "id": "uuid",
        "title": "React Masterclass",
        "description": "Learn React from scratch...",
        "thumbnail": "https://cloudinary.com/image.jpg",
        "category": "PROGRAMMING",
        "level": "INTERMEDIATE",
        "status": "PUBLISHED",
        "duration": 1200,
        "createdAt": "2025-09-01T12:00:00.000Z",
        "publishedAt": "2025-09-05T14:00:00.000Z",
        "lessonCount": 12,
        "enrollmentCount": 75,
        "certificateCount": 15,
        "lessons": [
          {
            "id": "uuid",
            "title": "Introduction to React",
            "order": 1,
            "duration": 600
          }
        ]
      }
    ]
  }
}
```

**403 Forbidden** (Not a creator):
```json
{
  "success": false,
  "message": "Access denied. Creator role required."
}
```

---

## Application Status Flow

```
LEARNER role
    ↓
Submit Application (POST /api/creator/apply)
    ↓
Status: PENDING
    ↓
Admin Reviews
    ↓
    ├─→ APPROVED → User role upgraded to CREATOR → Access creator dashboard
    └─→ REJECTED → Can reapply (must submit new application)
```

---

## Required Components & Pages

### 1. Creator Application Form Page
**Route:** `/become-creator` or `/creator/apply`

**Features:**
- Only accessible to users with LEARNER role
- Show message if user already has application (fetch status first)
- Three-field form with validation:
  - Bio textarea (100-500 chars, show character counter)
  - Experience textarea (min 50 chars, show character counter)
  - Portfolio URL input (optional, validate URL format)
- Client-side validation before submit
- Loading state during submission
- Success message on submit with next steps
- Error handling for all error responses
- Redirect creators/admins with informative message

**Recommended shadcn/ui components:**
- `Card` for form container
- `Textarea` with character counter
- `Input` for portfolio URL
- `Button` with loading state
- `Alert` for messages
- `Label` for form fields
- `Progress` or character count badge

**UX Flow:**
```
Page Load
  ↓
Check user role (from auth context)
  ↓
  ├─→ If CREATOR/ADMIN: Show "You're already a creator" message
  ├─→ If LEARNER: Fetch application status
  │       ↓
  │       ├─→ Has PENDING: Show "Application under review" status
  │       ├─→ Has REJECTED: Show rejection reason + allow reapply
  │       └─→ No application: Show application form
  └─→ Not logged in: Redirect to login
```

---

### 2. Application Status Page
**Route:** `/creator/status` or part of profile/settings

**Features:**
- Show current application details
- Status badge with appropriate styling:
  - PENDING: Yellow/warning badge, "Under Review" text
  - APPROVED: Green/success badge, "Approved" text with date
  - REJECTED: Red/destructive badge, "Rejected" text with reason
- Display submitted bio, experience, portfolio
- Show review details if reviewed (reviewer, date)
- Show rejection reason if rejected
- For APPROVED: Link to creator dashboard
- For REJECTED: Option to submit new application
- For PENDING: Estimated review time message

**Recommended shadcn/ui components:**
- `Card` for status container
- `Badge` for status indicator
- `Separator` between sections
- `Button` for actions
- `Alert` for rejection reason or helpful tips
- `ScrollArea` for long content

---

### 3. Creator Dashboard Page
**Route:** `/creator/dashboard` or `/dashboard` (for creators)

**Features:**
- Only accessible to users with CREATOR role
- Show creator profile summary
- Display stats in card grid:
  - Total Courses
  - Published Courses
  - Total Enrollments
  - Total Certificates Issued
- Course list table/grid with:
  - Thumbnail
  - Title & description
  - Status badge (PUBLISHED/DRAFT/UNDER_REVIEW)
  - Lesson count
  - Enrollment count
  - Certificate count
  - Actions: Edit, View, Publish/Unpublish
- Link to create new course
- Application approval date display

**Recommended shadcn/ui components:**
- `Card` for stat cards
- `Table` or `DataTable` for course list
- `Badge` for course status
- `Avatar` for creator profile
- `Tabs` to organize dashboard sections
- `DropdownMenu` for course actions
- `Button` for create new course

**Mobile Responsive:**
- Stats: 1 column on mobile, 2 on tablet, 4 on desktop
- Course table: ScrollArea horizontally on mobile or convert to card grid

---

### 4. Navigation Integration

**For LEARNER role:**
- Add "Become a Creator" link in:
  - User dropdown menu
  - Profile/Settings page
  - Dashboard sidebar

**For CREATOR role:**
- Replace "Become a Creator" with "Creator Dashboard" link
- Add creator-specific navigation items:
  - My Courses
  - Create Course
  - Analytics (future)

**For users with PENDING application:**
- Show "Application Pending" badge in nav
- Link to status page instead of application form

---

## API Service Functions

Create `src/services/creatorService.ts` (or `.js`):

```typescript
import apiClient from './api';

export interface CreatorApplicationData {
  bio: string;
  experience: string;
  portfolio?: string;
}

export interface ApplicationStatus {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  bio: string;
  portfolio: string | null;
  experience: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  reviewer: {
    name: string;
    email: string;
  } | null;
}

export const submitCreatorApplication = async (data: CreatorApplicationData) => {
  const response = await apiClient.post('/api/creator/apply', data);
  return response.data;
};

export const getApplicationStatus = async () => {
  const response = await apiClient.get('/api/creator/status');
  return response.data;
};

export const getCreatorDashboard = async () => {
  const response = await apiClient.get('/api/creator/dashboard');
  return response.data;
};
```

---

## Validation Rules (Client-Side)

```typescript
import validator from 'validator';

export const validateBio = (bio: string) => {
  if (!bio) return { valid: false, error: 'Bio is required' };
  if (bio.length < 100) return { valid: false, error: 'Bio must be at least 100 characters' };
  if (bio.length > 500) return { valid: false, error: 'Bio must not exceed 500 characters' };
  return { valid: true };
};

export const validateExperience = (experience: string) => {
  if (!experience) return { valid: false, error: 'Experience is required' };
  if (experience.length < 50) return { valid: false, error: 'Experience must be at least 50 characters' };
  return { valid: true };
};

export const validatePortfolio = (portfolio?: string) => {
  if (!portfolio) return { valid: true }; // Optional field
  if (!validator.isURL(portfolio)) {
    return { valid: false, error: 'Portfolio must be a valid URL (e.g., https://example.com)' };
  }
  return { valid: true };
};
```

---

## State Management Recommendations

**Option 1: React Context (Simple)**
Create `CreatorContext` to track application status across app:
```typescript
interface CreatorContextType {
  applicationStatus: ApplicationStatus | null;
  hasApplication: boolean;
  canApply: boolean;
  isCreator: boolean;
  refreshStatus: () => Promise<void>;
}
```

**Option 2: React Query (Recommended)**
```typescript
// Hooks
useApplicationStatus() // Fetch and cache status
useSubmitApplication() // Mutation for submit
useCreatorDashboard() // Fetch dashboard data
```

---

## UX Enhancements

### Character Counter Component
```tsx
<div className="flex justify-between text-sm">
  <Label>Bio</Label>
  <span className={cn(
    "text-muted-foreground",
    bio.length < 100 && "text-destructive",
    bio.length > 500 && "text-destructive"
  )}>
    {bio.length}/500 characters
  </span>
</div>
```

### Application Tips Section
Show on application form:
- "✓ Highlight your unique teaching approach"
- "✓ Include links to teaching materials or content"
- "✓ Mention relevant certifications or credentials"
- "✓ Describe your target audience"

### Status Timeline (Optional Enhancement)
For application status page:
```
[✓] Application Submitted - Oct 5, 2025
[⏳] Under Review - Current
[ ] Decision Made
```

---

## Error Handling

### Network Errors
```typescript
try {
  await submitCreatorApplication(data);
} catch (error) {
  if (error.response?.status === 409) {
    // Already applied
    toast.error('You already have an application in review');
  } else if (error.response?.status === 403) {
    // Not a learner
    toast.error('Only learners can apply to become creators');
  } else if (error.response?.data?.message) {
    toast.error(error.response.data.message);
  } else {
    toast.error('Network error. Please try again.');
  }
}
```

---

## Accessibility Requirements

- All form inputs must have associated labels
- Character counters should be announced to screen readers
- Status badges must have aria-label describing the status
- Form validation errors must be announced
- Focus management after submission
- Keyboard navigation for all interactive elements
- Color should not be the only indicator of status (use text + icons)

**Example:**
```tsx
<Badge 
  variant={status === 'APPROVED' ? 'success' : 'warning'}
  aria-label={`Application status: ${status}`}
>
  {status === 'APPROVED' && <CheckCircle className="mr-1" />}
  {status}
</Badge>
```

---

## Mobile-First Design Guidelines

### Application Form (Mobile)
- Stack all fields vertically
- Full-width inputs with adequate touch targets (min 44x44px)
- Fixed bottom bar with submit button on mobile
- Collapsible tips section to save space

### Status Page (Mobile)
- Card-based layout stacking vertically
- Prominent status badge at top
- Collapsible sections for bio/experience
- Bottom-fixed action button if applicable

### Creator Dashboard (Mobile)
- Stats: 2x2 grid on mobile
- Course list: Card view instead of table
- Hamburger menu for creator actions
- Floating action button for "Create Course"

---

## Testing Checklist

**Application Form:**
- [ ] Shows form only for learners
- [ ] Redirects creators/admins appropriately
- [ ] Character counter updates in real-time
- [ ] Client-side validation prevents invalid submission
- [ ] Shows loading state during API call
- [ ] Displays success message on submission
- [ ] Handles 409 error (already applied)
- [ ] Handles network errors gracefully

**Status Page:**
- [ ] Correctly displays PENDING status
- [ ] Shows rejection reason for REJECTED
- [ ] Displays reviewer info for reviewed applications
- [ ] Links to dashboard for APPROVED creators
- [ ] Shows "apply now" for users without application

**Creator Dashboard:**
- [ ] Only accessible to CREATOR role
- [ ] Stats display correctly
- [ ] Course list loads and displays
- [ ] Status badges show correct colors
- [ ] Mobile responsive layout works
- [ ] Actions (edit, view) work correctly

---

## Security Notes

- Always verify user role on backend (frontend checks are for UX only)
- Authorization header must be included in all requests
- Never expose admin/reviewer information beyond what's provided
- Portfolio URLs should be sanitized before display (use validator)
- Implement rate limiting on application submission (backend already handles)

---

## Environment Variables

No additional env vars needed. Use existing:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Acceptance Criteria

- [ ] Learners can submit creator application with validation
- [ ] Users can view their application status
- [ ] Approved creators can access dashboard with stats and courses
- [ ] Navigation updates based on user role
- [ ] All error states handled gracefully
- [ ] Mobile-responsive on all screen sizes
- [ ] Passes accessibility audit (Lighthouse 90+)
- [ ] Zero TypeScript/ESLint errors
- [ ] Successful Next.js build

---

## Implementation Order

1. **Setup services** (`creatorService.ts`)
2. **Create validation utilities**
3. **Build application form page** with validation
4. **Build status page** with all three states
5. **Build creator dashboard page**
6. **Add navigation links** based on role
7. **Test all flows** (apply → pending → approved → dashboard)
8. **Mobile optimization**
9. **Accessibility audit**
10. **Error handling polish**

---

## Example User Flows

### Flow 1: First-time applicant (Happy Path)
1. Learner logs in
2. Sees "Become a Creator" in navigation
3. Clicks → Form page loads
4. Fills bio (150 chars), experience (80 chars), portfolio URL
5. Clicks Submit → Loading state → Success message
6. Redirected to status page showing PENDING
7. (Later) Admin approves
8. User checks status → sees APPROVED with approval date
9. Clicks "Go to Dashboard" → Creator dashboard loads with stats

### Flow 2: Rejected applicant reapplying
1. User checks status → sees REJECTED with reason
2. Reads feedback: "Insufficient teaching experience demonstrated"
3. Clicks "Apply Again"
4. Fills improved application with more details
5. Submits → New PENDING application created

### Flow 3: Existing creator checking stats
1. Creator logs in → Dashboard link in nav
2. Clicks Dashboard
3. Sees overview stats: 3 courses, 120 enrollments
4. Views course list with status badges
5. Clicks "Create New Course" → Course creation flow

---

**Start with:** Create the API service functions and application form, then test the submission flow end-to-end before building status and dashboard pages.

**Backend is already running at:** `http://localhost:4000` (or your production URL)

Good luck! 🚀
