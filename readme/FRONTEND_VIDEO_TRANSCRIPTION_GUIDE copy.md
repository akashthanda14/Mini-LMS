# Frontend Integration Guide: Video Transcription Feature

## Overview
Integrate AI-powered video transcription (OpenAI Whisper) into your LMS frontend. Transcripts are automatically generated when creators upload video lessons and can be displayed to learners for accessibility and better learning experience.

---

## How It Works (Backend Flow)

```
Creator uploads video lesson
    ↓
POST /api/courses/:courseId/lessons (with videoUrl)
    ↓
Backend creates lesson + queues transcription job (BullMQ)
    ↓
Worker processes job asynchronously:
  - Downloads video from Cloudinary
  - Calls OpenAI Whisper API
  - Saves transcript to lesson.transcript field
    ↓
Frontend polls GET /api/lessons/:id/transcript-status
    ↓
When status: 'completed', display transcript
```

**Processing Time:** ~20-30 seconds for typical video  
**File Size Limit:** 25MB (Whisper API limit)  
**Fallback:** Dummy transcript if OpenAI unavailable or video too large

---

## Backend API Endpoints

### 1. Get Lesson Details (includes transcript if available)
```
GET /api/lessons/:id
```

**Access:** Private (Authenticated users who can access the course)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "lesson": {
    "id": "uuid",
    "title": "Introduction to Java",
    "description": "Learn Java basics in 100 seconds",
    "videoUrl": "https://res.cloudinary.com/.../video.mp4",
    "duration": 120,
    "order": 1,
    "transcript": "Java, a high-level, multi-paradigm programming language...",
    "courseId": "uuid",
    "course": {
      "id": "uuid",
      "title": "Java Programming Course",
      "creatorId": "uuid"
    }
  }
}
```

**Note:** `transcript` field will be:
- `null` if transcription not started or still processing
- `string` with full transcript text when completed

---

### 2. Get Transcript Status (for polling)
```
GET /api/lessons/:id/transcript-status
```

**Access:** Private (Authenticated users who can access the course)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response Scenarios:**

**Scenario A: Transcript completed**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "transcript": "Full transcript text here...",
    "lessonId": "uuid"
  }
}
```

**Scenario B: Transcription in progress**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "progress": 50,
    "jobId": "job-uuid",
    "lessonId": "uuid",
    "error": null,
    "attempts": 1
  }
}
```

**Scenario C: Transcription queued/waiting**
```json
{
  "success": true,
  "data": {
    "status": "waiting",
    "progress": 0,
    "jobId": "job-uuid",
    "lessonId": "uuid",
    "error": null,
    "attempts": 0
  }
}
```

**Scenario D: Transcription failed**
```json
{
  "success": true,
  "data": {
    "status": "failed",
    "progress": 0,
    "jobId": "job-uuid",
    "lessonId": "uuid",
    "error": "Video download failed: 404",
    "attempts": 3
  }
}
```

**Scenario E: Not queued yet**
```json
{
  "success": true,
  "data": {
    "status": "not_queued",
    "message": "No transcription job found for this lesson",
    "lessonId": "uuid"
  }
}
```

**Status values:**
- `completed` - Transcript ready, available in response
- `active` - Currently processing (downloading or transcribing)
- `waiting` - Queued, not started yet
- `failed` - Error occurred (see error field)
- `not_queued` - No transcription job exists
- `unknown` - Could not determine status

---

## Frontend Implementation

### 1. API Service Functions

Create `src/services/transcriptService.ts`:

```typescript
import apiClient from './api';

export interface TranscriptStatus {
  status: 'completed' | 'active' | 'waiting' | 'failed' | 'not_queued' | 'unknown';
  transcript?: string;
  progress?: number;
  jobId?: string;
  lessonId: string;
  error?: string | null;
  attempts?: number;
  message?: string;
}

export interface TranscriptStatusResponse {
  success: boolean;
  data: TranscriptStatus;
}

/**
 * Get transcript status for a lesson
 * Use this for polling while transcript is being generated
 */
export const getTranscriptStatus = async (lessonId: string): Promise<TranscriptStatusResponse> => {
  const response = await apiClient.get(`/api/lessons/${lessonId}/transcript-status`);
  return response.data;
};

/**
 * Get lesson details (includes transcript if available)
 * Use this to fetch lesson + transcript in one call
 */
export const getLessonWithTranscript = async (lessonId: string) => {
  const response = await apiClient.get(`/api/lessons/${lessonId}`);
  return response.data;
};
```

---

### 2. React Hook for Transcript Polling

Create `src/hooks/useTranscriptPolling.ts`:

```typescript
import { useState, useEffect, useRef } from 'react';
import { getTranscriptStatus, TranscriptStatus } from '@/services/transcriptService';

interface UseTranscriptPollingOptions {
  lessonId: string;
  enabled?: boolean; // Start polling immediately
  pollInterval?: number; // Milliseconds between polls
  maxAttempts?: number; // Max polling attempts before giving up
}

export const useTranscriptPolling = ({
  lessonId,
  enabled = true,
  pollInterval = 5000, // Poll every 5 seconds
  maxAttempts = 60, // Stop after 5 minutes (60 * 5s)
}: UseTranscriptPollingOptions) => {
  const [status, setStatus] = useState<TranscriptStatus | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const checkStatus = async () => {
    try {
      const response = await getTranscriptStatus(lessonId);
      const data = response.data;
      
      setStatus(data);
      setError(null);

      // Stop polling if completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling();
      }

      attemptsRef.current += 1;

      // Stop if max attempts reached
      if (attemptsRef.current >= maxAttempts) {
        stopPolling();
        setError('Transcription is taking longer than expected');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check transcript status');
      stopPolling();
    }
  };

  useEffect(() => {
    if (!isPolling || !lessonId) return;

    // Check immediately
    checkStatus();

    // Then poll at interval
    intervalRef.current = setInterval(checkStatus, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lessonId, isPolling, pollInterval]);

  return {
    status,
    isPolling,
    error,
    stopPolling,
    startPolling: () => {
      attemptsRef.current = 0;
      setIsPolling(true);
    },
  };
};
```

---

### 3. Transcript Display Component

Create `src/components/lesson/TranscriptViewer.tsx`:

```tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Copy, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';
import { useTranscriptPolling } from '@/hooks/useTranscriptPolling';

interface TranscriptViewerProps {
  lessonId: string;
  initialTranscript?: string | null;
  lessonTitle?: string;
}

export const TranscriptViewer = ({ 
  lessonId, 
  initialTranscript,
  lessonTitle 
}: TranscriptViewerProps) => {
  const [copied, setCopied] = useState(false);
  
  // Only poll if transcript not already available
  const shouldPoll = !initialTranscript;
  
  const { status, isPolling, error } = useTranscriptPolling({
    lessonId,
    enabled: shouldPoll,
    pollInterval: 5000,
  });

  const transcript = initialTranscript || status?.transcript;
  const transcriptStatus = status?.status;

  const handleCopy = async () => {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonTitle || 'lesson'}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show loading state while polling
  if (isPolling && !transcript) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Transcript
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription className="ml-2">
              {transcriptStatus === 'waiting' && 'Transcription queued...'}
              {transcriptStatus === 'active' && `Generating transcript... ${status?.progress || 0}%`}
              {!transcriptStatus && 'Checking transcript status...'}
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error || transcriptStatus === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error || status?.error || 'Failed to generate transcript'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show message if no transcript and not processing
  if (!transcript && transcriptStatus === 'not_queued') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Transcript not available yet. It will be generated automatically.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show transcript
  if (transcript) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Video Transcript
              <Badge variant="outline" className="ml-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={copied}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {transcript}
            </div>
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-4">
            This transcript was automatically generated using AI and may contain errors.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};
```

---

### 4. Integration in Lesson Player Page

Update your lesson detail/player page:

```tsx
// app/(learner)/courses/[courseId]/lessons/[lessonId]/page.tsx

import { TranscriptViewer } from '@/components/lesson/TranscriptViewer';

export default async function LessonPage({ params }) {
  const { lessonId } = params;
  
  // Fetch lesson data
  const lesson = await fetchLesson(lessonId);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Video Player */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <VideoPlayer videoUrl={lesson.videoUrl} />
      </div>

      {/* Lesson Info */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <p className="text-muted-foreground">{lesson.description}</p>
      </div>

      {/* Transcript Section */}
      <TranscriptViewer
        lessonId={lessonId}
        initialTranscript={lesson.transcript}
        lessonTitle={lesson.title}
      />

      {/* Other lesson content */}
    </div>
  );
}
```

---

### 5. Creator View - Transcript Status in Lesson List

For creators managing their courses:

```tsx
// components/creator/LessonListItem.tsx

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react';

interface LessonListItemProps {
  lesson: {
    id: string;
    title: string;
    transcript: string | null;
    // ... other fields
  };
}

export const LessonListItem = ({ lesson }: LessonListItemProps) => {
  const getTranscriptBadge = () => {
    if (lesson.transcript) {
      return (
        <Badge variant="outline" className="bg-green-50">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Transcript Ready
        </Badge>
      );
    }
    
    // Could add real-time status check here
    return (
      <Badge variant="outline" className="bg-yellow-50">
        <Clock className="h-3 w-3 mr-1" />
        Processing
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-medium">{lesson.title}</h3>
        <div className="flex gap-2 mt-2">
          {getTranscriptBadge()}
        </div>
      </div>
      {/* Actions */}
    </div>
  );
};
```

---

## UX Best Practices

### 1. Progressive Disclosure
- **Show loading indicator** while transcript is being generated
- **Don't block video playback** - let users watch while transcript generates
- **Notify when ready** - Toast notification when transcript completes

### 2. Polling Strategy
```typescript
// Start aggressive, then back off
const getPollingInterval = (attempts: number) => {
  if (attempts < 10) return 3000;  // 3s for first 30 seconds
  if (attempts < 30) return 5000;  // 5s for next 100 seconds
  return 10000;                     // 10s after that
};
```

### 3. Accessibility
- Transcript provides accessibility for deaf/hard of hearing
- Add ARIA labels to transcript controls
- Ensure transcript is keyboard navigable
- Support screen readers

```tsx
<ScrollArea 
  aria-label="Video transcript"
  role="region"
  aria-live="polite"
>
  {transcript}
</ScrollArea>
```

### 4. Mobile Optimization
- Collapsible transcript on mobile to save space
- Bottom sheet or modal for transcript on small screens
- Sticky "View Transcript" button while scrolling

```tsx
// Mobile: Use Sheet component
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" className="md:hidden">
      <FileText className="h-4 w-4 mr-2" />
      View Transcript
    </Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="h-[80vh]">
    <ScrollArea className="h-full">
      {transcript}
    </ScrollArea>
  </SheetContent>
</Sheet>

// Desktop: Inline card
<div className="hidden md:block">
  <TranscriptViewer {...props} />
</div>
```

---

## Advanced Features (Optional)

### 1. Searchable Transcript
```tsx
const [searchTerm, setSearchTerm] = useState('');

const highlightedTranscript = transcript?.replace(
  new RegExp(searchTerm, 'gi'),
  (match) => `<mark>${match}</mark>`
);
```

### 2. Timestamp Sync (Future Enhancement)
If using Whisper's `verbose_json` format (not currently implemented):
```typescript
// Backend would need to save timestamps
interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
}

// Click transcript to jump to video timestamp
```

### 3. Multi-language Support
Backend already supports language parameter:
```typescript
// In transcriptService.js
const transcription = await openai.audio.transcriptions.create({
  file: fileStream,
  model: 'whisper-1',
  language: 'en', // Make this dynamic based on course language
});
```

---

## Error Handling

### Common Error Scenarios

**1. Video file too large (>25MB)**
```tsx
<Alert variant="warning">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>
    This video is too large for automatic transcription. 
    A simplified transcript has been provided instead.
  </AlertDescription>
</Alert>
```

**2. OpenAI API error**
- Backend automatically falls back to dummy transcript
- Frontend displays whatever transcript is available

**3. Network timeout during polling**
```typescript
// In useTranscriptPolling hook
try {
  await getTranscriptStatus(lessonId);
} catch (err) {
  // Don't stop polling on network errors
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    console.log('Network timeout, will retry...');
    return; // Continue polling
  }
  // Stop on other errors
  stopPolling();
}
```

---

## Testing Checklist

- [ ] Transcript displays correctly when available
- [ ] Loading state shows while transcript is generating
- [ ] Polling starts automatically when transcript is null
- [ ] Polling stops when transcript is completed
- [ ] Copy button copies full transcript to clipboard
- [ ] Download button downloads .txt file
- [ ] Mobile responsive layout works
- [ ] Error states display appropriately
- [ ] Polling doesn't exceed max attempts (prevents infinite loop)
- [ ] Component unmounts cleanly (no memory leaks from intervals)

---

## Performance Optimization

### 1. Don't Poll if Transcript Already Exists
```typescript
const shouldPoll = !lesson.transcript;
```

### 2. Stop Polling When User Navigates Away
```typescript
useEffect(() => {
  return () => stopPolling(); // Cleanup on unmount
}, []);
```

### 3. Cache Transcript in React Query
```typescript
export const useLesson = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLessonWithTranscript(lessonId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
```

---

## Summary

**Key Integration Points:**
1. ✅ Fetch lesson → Check if `transcript` field exists
2. ✅ If null → Start polling `/api/lessons/:id/transcript-status`
3. ✅ Show loading UI while status is `waiting` or `active`
4. ✅ Display transcript when status is `completed`
5. ✅ Stop polling when completed, failed, or max attempts reached

**User Experience:**
- Video playback is never blocked
- Transcript appears automatically when ready (20-30 seconds typically)
- Users can watch video while waiting
- Transcript enhances accessibility and learning

**No Additional Backend Work Needed:**
- Transcription automatically triggers on lesson creation
- OpenAI Whisper is already configured and working ✅
- Endpoints are ready to use

Start with the basic `TranscriptViewer` component and add advanced features as needed! 🎬📝
