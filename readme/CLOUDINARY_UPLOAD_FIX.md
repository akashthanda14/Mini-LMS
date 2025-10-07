# Cloudinary Video Upload - Frontend Integration Guide

## 🚨 **IMPORTANT: Signature Fix Applied**

**Date:** October 5, 2025  
**Issue:** 401 Unauthorized - Invalid Signature  
**Status:** ✅ FIXED

---

## Problem Summary

The error occurred because there was a mismatch between:
- **Parameters used to generate the signature** (backend)
- **Parameters sent in the upload request** (frontend)

Cloudinary requires that the signature be calculated using **ONLY** the parameters that will be included in the signed upload request.

---

## ✅ Fixed Backend Changes

### What Changed:
The backend now generates signatures using **only 3 parameters**:
- `timestamp`
- `public_id`
- `folder`

### API Response (Updated):
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://api.cloudinary.com/v1_1/{cloud_name}/video/upload",
    "signature": "...",
    "timestamp": 1759651502,
    "apiKey": "...",
    "publicId": "course_xxx_lesson_xxx",
    "cloudName": "...",
    "folder": "courses/{courseId}/lessons"
  }
}
```

**Removed fields:** `resourceType`, `eager`, `eagerAsync`

---

## 📝 Frontend Code Fix (LessonUploader.tsx)

### ❌ OLD CODE (INCORRECT):
```typescript
const handleUpload = async (file: File) => {
  // 1. Get credentials from backend
  const response = await fetch(`/api/courses/${courseId}/lessons/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const { data: credentials } = await response.json();

  // 2. Upload to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', credentials.folder);
  formData.append('public_id', credentials.publicId);
  formData.append('timestamp', credentials.timestamp);
  formData.append('signature', credentials.signature);
  formData.append('api_key', credentials.apiKey);
  formData.append('resource_type', credentials.resourceType);  // ❌ REMOVE
  formData.append('eager', credentials.eager);                  // ❌ REMOVE
  formData.append('eager_async', credentials.eagerAsync);       // ❌ REMOVE
  
  const uploadResponse = await fetch(credentials.uploadUrl, {
    method: 'POST',
    body: formData
  });
};
```

### ✅ NEW CODE (CORRECT):
```typescript
const handleUpload = async (file: File) => {
  try {
    // 1. Get credentials from backend
    const response = await fetch(`/api/courses/${courseId}/lessons/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get credentials: ${response.status}`);
    }
    
    const { data: credentials } = await response.json();
    
    // 2. Prepare upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    
    // ✅ CRITICAL: Send ONLY these signed parameters
    formData.append('api_key', credentials.apiKey);
    formData.append('timestamp', credentials.timestamp.toString());
    formData.append('signature', credentials.signature);
    formData.append('folder', credentials.folder);
    formData.append('public_id', credentials.publicId);
    
    // 3. Upload to Cloudinary
    const uploadResponse = await fetch(credentials.uploadUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.error('Cloudinary upload failed:', uploadResponse.status, error);
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadResult);
    
    // 4. Create lesson in backend
    const lessonResponse = await fetch(`/api/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: lessonTitle,
        videoUrl: uploadResult.secure_url,
        order: lessonOrder,
        duration: Math.round(uploadResult.duration)
      })
    });
    
    if (!lessonResponse.ok) {
      throw new Error('Failed to create lesson record');
    }
    
    const { data: lesson } = await lessonResponse.json();
    console.log('✅ Lesson created:', lesson);
    
    return lesson;
    
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
```

---

## 🔑 Key Points

### 1. **Parameter Order in FormData**
The order you append to FormData doesn't matter, but you MUST include exactly these fields:

```typescript
formData.append('file', file);               // The video file
formData.append('api_key', credentials.apiKey);
formData.append('timestamp', credentials.timestamp.toString());
formData.append('signature', credentials.signature);
formData.append('folder', credentials.folder);
formData.append('public_id', credentials.publicId);
```

### 2. **Do NOT Add Extra Parameters**
These will cause signature mismatch:
- ❌ `resource_type`
- ❌ `eager`
- ❌ `eager_async`
- ❌ Any custom metadata

### 3. **Timestamp Must Be String**
```typescript
// ✅ CORRECT
formData.append('timestamp', credentials.timestamp.toString());

// ❌ WRONG
formData.append('timestamp', credentials.timestamp); // May send as number
```

### 4. **Complete Upload Flow**
```
1. POST /api/courses/:courseId/lessons/upload
   ↓ Returns: signature, timestamp, publicId, folder, etc.

2. POST https://api.cloudinary.com/v1_1/{cloud_name}/video/upload
   ↓ Returns: secure_url, public_id, duration, etc.

3. POST /api/courses/:courseId/lessons
   ↓ Body: { title, videoUrl, order, duration }
   ↓ Returns: Lesson object with transcript queued
```

---

## 🧪 Testing

### Test the Upload:
1. Restart your backend server (to load the fixed code)
2. Clear browser cache
3. Try uploading a video again

### Expected Result:
- ✅ No 401 error
- ✅ Video uploads to Cloudinary
- ✅ Lesson created with videoUrl
- ✅ Transcript job queued in background

### Verify Upload:
```bash
# Check Cloudinary Media Library
https://console.cloudinary.com/console/media_library

# Check lesson in database
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/courses/{courseId}/lessons
```

---

## 🐛 Debugging

### If you still get 401:

1. **Check Environment Variables:**
   ```bash
   # Backend .env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

2. **Verify API Response:**
   ```typescript
   console.log('Credentials:', credentials);
   // Should have: signature, timestamp, publicId, folder, apiKey, cloudName
   // Should NOT have: resourceType, eager, eagerAsync
   ```

3. **Check FormData:**
   ```typescript
   // Log what you're sending
   for (let [key, value] of formData.entries()) {
     console.log(key, value);
   }
   ```

4. **Test Signature Manually:**
   ```bash
   # Run backend test
   cd /Users/work/Desktop/LMS
   node scripts/test-cloudinary-signature.js
   ```

### If you get other errors:

- **413 Payload Too Large:** File size > 100MB (upgrade Cloudinary plan)
- **400 Bad Request:** Check file is valid video format
- **403 Forbidden:** Check Cloudinary account status
- **500 Server Error:** Check backend logs

---

## 📚 Additional Resources

- [Cloudinary Signed Upload Docs](https://cloudinary.com/documentation/upload_videos#authenticated_uploads)
- [Video Upload Widget](https://cloudinary.com/documentation/video_upload_widget)
- [Upload API Reference](https://cloudinary.com/documentation/image_upload_api_reference)

---

## ✅ Checklist

Before deploying to production:

- [ ] Backend server restarted with new code
- [ ] Frontend updated with correct FormData parameters
- [ ] Environment variables configured
- [ ] Test upload works successfully
- [ ] Cloudinary account has sufficient storage
- [ ] Error handling implemented
- [ ] Loading states added to UI
- [ ] File size/type validation added

---

**Need Help?** Check the test script: `scripts/test-cloudinary-signature.js`
