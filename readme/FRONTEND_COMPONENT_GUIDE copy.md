# 🎨 Learner Frontend Component Architecture

Visual guide for building your LMS learner frontend.

---

## 📁 Recommended Folder Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   ├── OTPInput.jsx
│   │   ├── CompleteProfileForm.jsx
│   │   └── ForgotPasswordForm.jsx
│   ├── courses/
│   │   ├── CourseCard.jsx
│   │   ├── CourseGrid.jsx
│   │   ├── CourseDetails.jsx
│   │   ├── CourseFilters.jsx
│   │   └── CourseLessonList.jsx
│   ├── lessons/
│   │   ├── VideoPlayer.jsx
│   │   ├── LessonProgress.jsx
│   │   ├── LessonListItem.jsx
│   │   └── TranscriptViewer.jsx
│   ├── dashboard/
│   │   ├── DashboardStats.jsx
│   │   ├── EnrollmentCard.jsx
│   │   ├── ProgressChart.jsx
│   │   └── RecentActivity.jsx
│   ├── certificates/
│   │   ├── CertificateCard.jsx
│   │   ├── CertificateViewer.jsx
│   │   ├── CertificateGallery.jsx
│   │   └── CertificateVerification.jsx
│   ├── profile/
│   │   ├── ProfileInfo.jsx
│   │   ├── ProfileEditForm.jsx
│   │   ├── ChangeEmailForm.jsx
│   │   └── ChangePhoneForm.jsx
│   ├── creator/
│   │   ├── CreatorApplicationForm.jsx
│   │   └── ApplicationStatusCard.jsx
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   └── Layout.jsx
│   └── common/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Card.jsx
│       ├── Badge.jsx
│       ├── ProgressBar.jsx
│       ├── Loader.jsx
│       ├── Toast.jsx
│       └── Modal.jsx
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── VerifyOTPPage.jsx
│   │   ├── CompleteProfilePage.jsx
│   │   └── ForgotPasswordPage.jsx
│   ├── courses/
│   │   ├── CourseCatalogPage.jsx
│   │   ├── CourseDetailsPage.jsx
│   │   └── LessonPlayerPage.jsx
│   ├── dashboard/
│   │   ├── DashboardPage.jsx
│   │   └── MyProgressPage.jsx
│   ├── certificates/
│   │   ├── MyCertificatesPage.jsx
│   │   └── VerifyCertificatePage.jsx
│   ├── profile/
│   │   ├── ProfilePage.jsx
│   │   └── SettingsPage.jsx
│   ├── creator/
│   │   ├── BecomeCreatorPage.jsx
│   │   └── ApplicationStatusPage.jsx
│   └── LandingPage.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useCourses.js
│   ├── useEnrollment.js
│   ├── useProgress.js
│   └── useCertificates.js
├── store/
│   ├── authSlice.js
│   ├── courseSlice.js
│   ├── enrollmentSlice.js
│   ├── certificateSlice.js
│   └── store.js
├── api/
│   ├── authAPI.js
│   ├── courseAPI.js
│   ├── enrollmentAPI.js
│   ├── certificateAPI.js
│   ├── profileAPI.js
│   └── axiosConfig.js
├── utils/
│   ├── validators.js
│   ├── formatters.js
│   └── constants.js
└── App.jsx
```

---

## 🧩 Component Hierarchy

```
App
├── Layout
│   ├── Navbar (with auth state)
│   ├── Main Content
│   │   ├── Router
│   │   │   ├── LandingPage
│   │   │   ├── LoginPage
│   │   │   ├── DashboardPage
│   │   │   │   ├── DashboardStats
│   │   │   │   ├── EnrollmentCard (multiple)
│   │   │   │   │   ├── ProgressBar
│   │   │   │   │   └── Button
│   │   │   │   └── RecentActivity
│   │   │   ├── CourseCatalogPage
│   │   │   │   ├── CourseFilters
│   │   │   │   └── CourseGrid
│   │   │   │       └── CourseCard (multiple)
│   │   │   │           ├── Badge (category, level)
│   │   │   │           └── Button
│   │   │   ├── CourseDetailsPage
│   │   │   │   ├── CourseInfo
│   │   │   │   ├── EnrollButton
│   │   │   │   └── CourseLessonList
│   │   │   │       └── LessonListItem (multiple)
│   │   │   ├── LessonPlayerPage
│   │   │   │   ├── VideoPlayer
│   │   │   │   ├── TranscriptViewer
│   │   │   │   ├── LessonProgress
│   │   │   │   └── CompleteButton
│   │   │   ├── MyCertificatesPage
│   │   │   │   └── CertificateGallery
│   │   │   │       └── CertificateCard (multiple)
│   │   │   ├── ProfilePage
│   │   │   │   ├── ProfileInfo
│   │   │   │   └── ProfileEditForm
│   │   │   └── BecomeCreatorPage
│   │   │       ├── CreatorApplicationForm
│   │   │       └── ApplicationStatusCard
│   │   └── Toast Notifications
│   └── Footer
└── ProtectedRoute Wrapper
```

---

## 🎨 Component Examples

### 1. CourseCard Component

```jsx
// components/courses/CourseCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../common/Badge';
import Button from '../common/Button';

const CourseCard = ({ course }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <div className="course-card">
      <img 
        src={course.thumbnail} 
        alt={course.title}
        className="course-thumbnail"
      />
      <div className="course-content">
        <h3 className="course-title">{course.title}</h3>
        <p className="course-creator">by {course.creator.name}</p>
        
        <div className="course-badges">
          <Badge color="blue">{course.category}</Badge>
          <Badge color="green">{course.level}</Badge>
        </div>

        <div className="course-stats">
          <span>🎓 {course.enrollmentCount} students</span>
          <span>📚 {course.lessonCount} lessons</span>
          <span>⏱️ {formatDuration(course.duration)}</span>
        </div>

        <Button onClick={handleViewDetails} variant="primary">
          View Details
        </Button>
      </div>
    </div>
  );
};

export default CourseCard;
```

---

### 2. EnrollmentCard Component

```jsx
// components/dashboard/EnrollmentCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';

const EnrollmentCard = ({ enrollment }) => {
  const navigate = useNavigate();
  const { course, progress, completedLessons, certificate } = enrollment;

  const handleContinueLearning = () => {
    navigate(`/courses/${course.id}/learn`);
  };

  const handleViewCertificate = () => {
    navigate(`/certificates/${certificate.id}`);
  };

  return (
    <div className="enrollment-card">
      <img 
        src={course.thumbnail} 
        alt={course.title}
        className="enrollment-thumbnail"
      />
      
      <div className="enrollment-info">
        <h4>{course.title}</h4>
        <p>by {course.creator.name}</p>

        {progress < 100 ? (
          <>
            <ProgressBar 
              value={progress} 
              max={100}
              label={`${progress}% Complete`}
            />
            <p className="lessons-complete">
              {completedLessons} / {course.lessonCount} lessons completed
            </p>
            <Button onClick={handleContinueLearning}>
              Continue Learning
            </Button>
          </>
        ) : (
          <>
            <div className="completion-badge">
              ✅ Completed
            </div>
            {certificate && (
              <Button onClick={handleViewCertificate} variant="success">
                View Certificate
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EnrollmentCard;
```

---

### 3. OTPInput Component

```jsx
// components/auth/OTPInput.jsx
import React, { useState, useRef } from 'react';

const OTPInput = ({ length = 6, onComplete }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Call onComplete when all digits entered
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...new Array(length - newOtp.length).fill('')]);
    
    if (newOtp.length === length) {
      onComplete(newOtp.join(''));
    }
  };

  return (
    <div className="otp-input-container">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="otp-digit"
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
};

export default OTPInput;
```

---

### 4. VideoPlayer Component

```jsx
// components/lessons/VideoPlayer.jsx
import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';

const VideoPlayer = ({ videoUrl, onProgress, onEnded }) => {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProgress = (state) => {
    setProgress(state.played * 100);
    onProgress?.(state.played);
  };

  const handleEnded = () => {
    onEnded?.();
  };

  return (
    <div className="video-player-container">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={playing}
        controls
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onEnded={handleEnded}
      />
      
      <div className="video-progress">
        <div 
          className="video-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
```

---

### 5. ProgressBar Component

```jsx
// components/common/ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ value, max = 100, label, color = 'blue' }) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="progress-bar-container">
      {label && <div className="progress-label">{label}</div>}
      
      <div className="progress-bar-bg">
        <div 
          className={`progress-bar-fill progress-bar-${color}`}
          style={{ width: `${percentage}%` }}
        >
          {percentage}%
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
```

---

### 6. CertificateCard Component

```jsx
// components/certificates/CertificateCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

const CertificateCard = ({ certificate }) => {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/certificates/${certificate.id}`);
  };

  const handleDownload = () => {
    window.open(
      `/api/enrollments/${certificate.enrollmentId}/certificate/download`,
      '_blank'
    );
  };

  return (
    <div className="certificate-card">
      <img 
        src={certificate.imageUrl} 
        alt={`Certificate for ${certificate.enrollment.course.title}`}
        className="certificate-image"
      />
      
      <div className="certificate-info">
        <h4>{certificate.enrollment.course.title}</h4>
        <p className="certificate-serial">{certificate.serialNumber}</p>
        <p className="certificate-date">
          Issued on {new Date(certificate.issuedAt).toLocaleDateString()}
        </p>

        <div className="certificate-actions">
          <Button onClick={handleView} variant="primary">
            View
          </Button>
          <Button onClick={handleDownload} variant="secondary">
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;
```

---

## 🔐 Custom Hooks

### useAuth Hook

```jsx
// hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser, clearUser } from '../store/authSlice';
import { authAPI } from '../api/authAPI';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useSelector(state => state.auth);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      dispatch(setUser({ user: response.user, token: response.token }));
      localStorage.setItem('token', response.token);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    dispatch(clearUser());
    localStorage.removeItem('token');
    navigate('/login');
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    register
  };
};
```

---

### useCourses Hook

```jsx
// hooks/useCourses.js
import { useState, useEffect } from 'react';
import { courseAPI } from '../api/courseAPI';

export const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseAPI.getAllCourses();
      setCourses(response.courses);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCourseById = async (id) => {
    setLoading(true);
    try {
      const response = await courseAPI.getCourseDetails(id);
      setError(null);
      return response.course;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return {
    courses,
    loading,
    error,
    refreshCourses: fetchCourses,
    getCourseById
  };
};
```

---

### useEnrollment Hook

```jsx
// hooks/useEnrollment.js
import { useState } from 'react';
import { enrollmentAPI } from '../api/enrollmentAPI';
import { toast } from 'react-toastify';

export const useEnrollment = () => {
  const [loading, setLoading] = useState(false);

  const enroll = async (courseId) => {
    setLoading(true);
    try {
      const response = await enrollmentAPI.enrollInCourse(courseId);
      toast.success('Successfully enrolled in course!');
      return { success: true, enrollment: response.data.enrollment };
    } catch (error) {
      toast.error(error.message || 'Failed to enroll');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async (lessonId) => {
    setLoading(true);
    try {
      const response = await enrollmentAPI.markLessonComplete(lessonId);
      
      if (response.data.courseProgress.isCompleted) {
        toast.success('🎉 Course completed! Certificate generated!');
      } else {
        toast.success('Lesson marked as complete!');
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      toast.error(error.message || 'Failed to mark lesson complete');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    enroll,
    completeLesson
  };
};
```

---

## 🎯 Page Examples

### Dashboard Page

```jsx
// pages/dashboard/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { enrollmentAPI } from '../../api/enrollmentAPI';
import DashboardStats from '../../components/dashboard/DashboardStats';
import EnrollmentCard from '../../components/dashboard/EnrollmentCard';
import Loader from '../../components/common/Loader';

const DashboardPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await enrollmentAPI.getUserProgress();
      setEnrollments(response.enrollments);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const inProgress = enrollments.filter(e => e.progress < 100);
  const completed = enrollments.filter(e => e.progress === 100);

  return (
    <div className="dashboard-page">
      <h1>My Learning Dashboard</h1>
      
      <DashboardStats 
        total={enrollments.length}
        inProgress={inProgress.length}
        completed={completed.length}
      />

      <section className="in-progress-section">
        <h2>Continue Learning</h2>
        <div className="enrollment-grid">
          {inProgress.map(enrollment => (
            <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      </section>

      <section className="completed-section">
        <h2>Completed Courses</h2>
        <div className="enrollment-grid">
          {completed.map(enrollment => (
            <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
```

---

### Course Catalog Page

```jsx
// pages/courses/CourseCatalogPage.jsx
import React, { useState } from 'react';
import { useCourses } from '../../hooks/useCourses';
import CourseGrid from '../../components/courses/CourseGrid';
import CourseFilters from '../../components/courses/CourseFilters';
import Loader from '../../components/common/Loader';

const CourseCatalogPage = () => {
  const { courses, loading } = useCourses();
  const [filters, setFilters] = useState({
    category: 'All',
    level: 'All',
    search: ''
  });

  const filteredCourses = courses.filter(course => {
    const matchesCategory = filters.category === 'All' || 
                           course.category === filters.category;
    const matchesLevel = filters.level === 'All' || 
                        course.level === filters.level;
    const matchesSearch = course.title.toLowerCase()
                               .includes(filters.search.toLowerCase());
    
    return matchesCategory && matchesLevel && matchesSearch;
  });

  if (loading) return <Loader />;

  return (
    <div className="course-catalog-page">
      <h1>Browse Courses</h1>
      
      <CourseFilters filters={filters} onFilterChange={setFilters} />
      
      <p className="results-count">
        {filteredCourses.length} courses found
      </p>

      <CourseGrid courses={filteredCourses} />
    </div>
  );
};

export default CourseCatalogPage;
```

---

### Lesson Player Page

```jsx
// pages/courses/LessonPlayerPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../api/courseAPI';
import { useEnrollment } from '../../hooks/useEnrollment';
import VideoPlayer from '../../components/lessons/VideoPlayer';
import TranscriptViewer from '../../components/lessons/TranscriptViewer';
import Button from '../../components/common/Button';

const LessonPlayerPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { completeLesson } = useEnrollment();
  
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchLesson();
    fetchLessons();
  }, [lessonId]);

  const fetchLesson = async () => {
    // Fetch current lesson details
    const response = await courseAPI.getCourseDetails(courseId);
    const currentLesson = response.course.lessons.find(l => l.id === lessonId);
    setLesson(currentLesson);
  };

  const fetchLessons = async () => {
    const response = await courseAPI.getCourseLessons(courseId);
    setLessons(response.lessons);
  };

  const handleMarkComplete = async () => {
    const result = await completeLesson(lessonId);
    if (result.success) {
      setCompleted(true);
    }
  };

  const handleNextLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  if (!lesson) return <div>Loading...</div>;

  return (
    <div className="lesson-player-page">
      <div className="lesson-header">
        <h1>{lesson.title}</h1>
        <Button onClick={() => navigate(`/courses/${courseId}`)}>
          Back to Course
        </Button>
      </div>

      <div className="lesson-content">
        <div className="video-section">
          <VideoPlayer 
            videoUrl={lesson.videoUrl}
            onEnded={handleMarkComplete}
          />
        </div>

        <div className="transcript-section">
          <TranscriptViewer transcript={lesson.transcript} />
        </div>
      </div>

      <div className="lesson-actions">
        {!completed && (
          <Button onClick={handleMarkComplete} variant="success">
            Mark as Complete
          </Button>
        )}
        
        <Button onClick={handleNextLesson} variant="primary">
          Next Lesson →
        </Button>
      </div>
    </div>
  );
};

export default LessonPlayerPage;
```

---

## 🎨 CSS Examples

### Course Card Styles

```css
/* styles/CourseCard.css */
.course-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.course-thumbnail {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.course-content {
  padding: 16px;
}

.course-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1a1a;
}

.course-creator {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.course-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.course-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}
```

---

### Progress Bar Styles

```css
/* styles/ProgressBar.css */
.progress-bar-container {
  width: 100%;
}

.progress-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.progress-bar-bg {
  width: 100%;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  transition: width 0.3s ease;
}

.progress-bar-blue {
  background: linear-gradient(90deg, #4CAF50, #45a049);
}

.progress-bar-green {
  background: linear-gradient(90deg, #2196F3, #1976D2);
}
```

---

## 📱 Responsive Design

```css
/* styles/Responsive.css */

/* Mobile First */
.course-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 20px;
}

/* Tablet */
@media (min-width: 768px) {
  .course-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .course-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .course-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 🚀 Implementation Priority

### Week 1: Authentication
- LoginPage, RegisterPage, OTPInput
- Auth API integration
- Protected routes

### Week 2: Course Browsing
- CourseCatalogPage, CourseCard, CourseGrid
- CourseDetailsPage
- Course API integration

### Week 3: Learning
- LessonPlayerPage, VideoPlayer
- Progress tracking
- Enrollment API integration

### Week 4: Dashboard & Certificates
- DashboardPage, EnrollmentCard
- MyCertificatesPage, CertificateCard
- Profile management

### Week 5: Polish
- Creator application
- Notifications
- Error handling
- Testing

---

**Your component structure is ready! Start building! 🎨**
