# Frontend Integration Guide - Learner Video Watching

## ✅ YES, Learners CAN Watch Videos!

Your backend has **full support** for learners to watch course videos. Here's everything you need to integrate:

---

## 🎯 Learner Video Workflow

### Step 1: Enroll in Course
First, the learner must enroll in a course.

**Endpoint:** `POST /api/courses/:id/enroll`

```javascript
const enrollInCourse = async (courseId) => {
  const response = await fetch(`/api/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  // Returns enrollment details
};
```

---

### Step 2: Check Enrollment Status
Verify if user is enrolled before showing video player.

**Endpoint:** `GET /api/courses/:id/enrollment`

```javascript
const checkEnrollment = async (courseId) => {
  const response = await fetch(`/api/courses/${courseId}/enrollment`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (data.success && data.enrollment) {
    console.log('User is enrolled!');
    console.log('Enrollment ID:', data.enrollment.id);
    return true;
  }
  return false;
};
```

---

### Step 3: Get Course Lessons
Fetch all lessons for the course (includes video URLs).

**Endpoint:** `GET /api/courses/:courseId/lessons`

```javascript
const getCourseLessons = async (courseId) => {
  const response = await fetch(`/api/courses/${courseId}/lessons`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data; // Array of lessons
  }
};
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lesson-uuid-1",
      "title": "Introduction to React",
      "description": "Learn the basics",
      "videoUrl": "https://res.cloudinary.com/xxx/video/upload/v1/courses/video.mp4",
      "duration": 1200,
      "order": 1,
      "transcript": "Video transcript here...",
      "createdAt": "2025-10-01T..."
    },
    {
      "id": "lesson-uuid-2",
      "title": "React Components",
      "videoUrl": "https://res.cloudinary.com/xxx/...",
      "duration": 1800,
      "order": 2,
      ...
    }
  ]
}
```

---

### Step 4: Display Video Player
Use the `videoUrl` from the lesson object to display the video.

```jsx
import React, { useState, useEffect } from 'react';

function VideoPlayer({ courseId, lessonId }) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchLesson() {
      try {
        // Get all lessons
        const response = await fetch(`/api/courses/${courseId}/lessons`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        if (data.success) {
          // Find the specific lesson
          const currentLesson = data.data.find(l => l.id === lessonId);
          setLesson(currentLesson);
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLesson();
  }, [courseId, lessonId]);
  
  if (loading) return <div>Loading video...</div>;
  if (!lesson) return <div>Lesson not found</div>;
  
  return (
    <div className="video-player">
      <h2>{lesson.title}</h2>
      
      {/* HTML5 Video Player */}
      <video 
        controls 
        width="100%" 
        src={lesson.videoUrl}
        poster={lesson.thumbnailUrl}
      >
        Your browser does not support the video tag.
      </video>
      
      {/* Or use a library like react-player */}
      {/* <ReactPlayer url={lesson.videoUrl} controls /> */}
      
      <div className="lesson-info">
        <p><strong>Duration:</strong> {Math.floor(lesson.duration / 60)} minutes</p>
        <p>{lesson.description}</p>
      </div>
      
      {lesson.transcript && (
        <div className="transcript">
          <h3>Transcript</h3>
          <p>{lesson.transcript}</p>
        </div>
      )}
      
      <button onClick={() => markLessonComplete(lesson.id)}>
        Mark as Complete
      </button>
    </div>
  );
}
```

---

### Step 5: Mark Lesson as Complete
When user finishes watching, mark the lesson as complete.

**Endpoint:** `POST /api/lessons/:id/complete`

```javascript
const markLessonComplete = async (lessonId) => {
  const response = await fetch(`/api/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Lesson marked as complete!');
    console.log('Progress:', data.progress);
    
    // Check if course is completed
    if (data.courseCompleted) {
      console.log('🎉 Course completed!');
      console.log('Certificate ID:', data.certificateId);
    }
  }
};
```

**Response Example:**
```json
{
  "success": true,
  "message": "Lesson marked as complete",
  "progress": {
    "lessonProgress": {
      "id": "progress-uuid",
      "completedAt": "2025-10-05T...",
      "lessonId": "lesson-uuid",
      "enrollmentId": "enrollment-uuid"
    },
    "courseProgress": 45.5
  },
  "courseCompleted": false
}
```

---

### Step 6: Track Progress
Get the user's progress for a specific course.

**Endpoint:** `GET /api/courses/:id/progress`

```javascript
const getCourseProgress = async (courseId) => {
  const response = await fetch(`/api/courses/${courseId}/progress`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Course Progress:', data.progress);
    console.log('Completed Lessons:', data.completedLessons);
    console.log('Total Lessons:', data.totalLessons);
  }
};
```

**Response Example:**
```json
{
  "success": true,
  "progress": {
    "enrollmentId": "enrollment-uuid",
    "courseId": "course-uuid",
    "progress": 45.5,
    "completedLessons": 5,
    "totalLessons": 11,
    "completedAt": null,
    "completedLessonsList": [
      {
        "lessonId": "lesson-uuid-1",
        "title": "Introduction",
        "completedAt": "2025-10-01T..."
      },
      {
        "lessonId": "lesson-uuid-2",
        "title": "Basics",
        "completedAt": "2025-10-02T..."
      }
    ]
  }
}
```

---

## 🎨 Complete React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player'; // npm install react-player

function CourseLearningPage({ courseId }) {
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    checkEnrollmentAndLoadLessons();
  }, [courseId]);
  
  const checkEnrollmentAndLoadLessons = async () => {
    try {
      // Check enrollment
      const enrollResponse = await fetch(`/api/courses/${courseId}/enrollment`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const enrollData = await enrollResponse.json();
      
      if (!enrollData.success || !enrollData.enrollment) {
        setIsEnrolled(false);
        setLoading(false);
        return;
      }
      
      setIsEnrolled(true);
      
      // Load lessons
      const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const lessonsData = await lessonsResponse.json();
      
      if (lessonsData.success) {
        setLessons(lessonsData.data);
        setCurrentLesson(lessonsData.data[0]); // Start with first lesson
      }
      
      // Load progress
      await loadProgress();
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadProgress = async () => {
    const response = await fetch(`/api/courses/${courseId}/progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      setProgress(data.progress);
    }
  };
  
  const markComplete = async (lessonId) => {
    const response = await fetch(`/api/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Lesson completed! 🎉');
      
      if (data.courseCompleted) {
        alert('Congratulations! You completed the course! 🏆');
      }
      
      // Reload progress
      await loadProgress();
      
      // Move to next lesson
      const currentIndex = lessons.findIndex(l => l.id === lessonId);
      if (currentIndex < lessons.length - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      }
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  if (!isEnrolled) {
    return (
      <div className="not-enrolled">
        <h2>You are not enrolled in this course</h2>
        <button onClick={enrollInCourse}>Enroll Now</button>
      </div>
    );
  }
  
  return (
    <div className="course-learning-page">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress?.progress || 0}%` }}>
          {progress?.progress?.toFixed(1)}% Complete
        </div>
      </div>
      
      <div className="learning-container">
        {/* Video Player */}
        <div className="video-section">
          {currentLesson && (
            <>
              <h2>{currentLesson.title}</h2>
              
              <ReactPlayer
                url={currentLesson.videoUrl}
                controls
                width="100%"
                height="500px"
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload'
                    }
                  }
                }}
              />
              
              <div className="lesson-details">
                <p>{currentLesson.description}</p>
                <p><strong>Duration:</strong> {Math.floor(currentLesson.duration / 60)} minutes</p>
                
                <button 
                  className="btn-complete"
                  onClick={() => markComplete(currentLesson.id)}
                >
                  Mark as Complete ✓
                </button>
              </div>
              
              {currentLesson.transcript && (
                <details className="transcript">
                  <summary>View Transcript</summary>
                  <pre>{currentLesson.transcript}</pre>
                </details>
              )}
            </>
          )}
        </div>
        
        {/* Lesson Playlist */}
        <div className="lessons-sidebar">
          <h3>Course Lessons ({lessons.length})</h3>
          
          <ul className="lesson-list">
            {lessons.map((lesson, index) => {
              const isCompleted = progress?.completedLessonsList?.some(
                cl => cl.lessonId === lesson.id
              );
              
              return (
                <li 
                  key={lesson.id}
                  className={`
                    lesson-item
                    ${currentLesson?.id === lesson.id ? 'active' : ''}
                    ${isCompleted ? 'completed' : ''}
                  `}
                  onClick={() => setCurrentLesson(lesson)}
                >
                  <span className="lesson-number">{index + 1}</span>
                  <span className="lesson-title">{lesson.title}</span>
                  {isCompleted && <span className="checkmark">✓</span>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CourseLearningPage;
```

---

## 🎯 Quick Integration Checklist

- [ ] Install video player library: `npm install react-player`
- [ ] Create enrollment check on course page
- [ ] Fetch lessons with `GET /api/courses/:courseId/lessons`
- [ ] Display video player with `lesson.videoUrl`
- [ ] Add "Mark Complete" button calling `POST /api/lessons/:id/complete`
- [ ] Show progress bar using `GET /api/courses/:id/progress`
- [ ] Handle course completion and certificate display

---

## 🔒 Important Notes

1. **Authentication Required:** All endpoints require Bearer token in Authorization header
2. **Enrollment Required:** Users must be enrolled to access lessons
3. **Published Courses Only:** Lessons are only accessible for PUBLISHED courses
4. **Video URLs:** Cloudinary URLs are permanent and can be used directly in video players
5. **Progress Tracking:** Automatically tracks which lessons are completed
6. **Certificate Generation:** Automatic when all lessons are completed

---

## 📹 Video Player Options

### Option 1: HTML5 Video (Simple)
```jsx
<video controls src={lesson.videoUrl} width="100%" />
```

### Option 2: React Player (Recommended)
```jsx
import ReactPlayer from 'react-player';

<ReactPlayer 
  url={lesson.videoUrl} 
  controls 
  width="100%"
  height="500px"
/>
```

### Option 3: Video.js (Advanced)
```jsx
import VideoPlayer from 'react-video-js-player';

<VideoPlayer
  src={lesson.videoUrl}
  width="720"
  height="420"
/>
```

---

## 🎓 Complete User Journey

1. **Browse Courses** → `GET /api/courses` (published only)
2. **View Course Details** → `GET /api/courses/:id`
3. **Enroll in Course** → `POST /api/courses/:id/enroll`
4. **Access Lessons** → `GET /api/courses/:courseId/lessons`
5. **Watch Videos** → Use `videoUrl` in video player
6. **Mark Complete** → `POST /api/lessons/:id/complete`
7. **Track Progress** → `GET /api/courses/:id/progress`
8. **Get Certificate** → Automatic when 100% complete

---

## ✅ Backend Status: READY

Your backend is **fully functional** for learners to watch videos. All endpoints are working and tested. You can start building the frontend video player immediately!

**Base URL:** `http://localhost:4000/api`

**Need help?** Check:
- `LEARNER_FRONTEND_API_GUIDE.md` - Complete API reference
- `FRONTEND_QUICK_REFERENCE.md` - Quick examples
- `scripts/test-enrollment-progress.js` - Test script example
