# Course Image Upload - Frontend Implementation Guide

## Overview
The backend has been updated to accept **actual file uploads** instead of image URLs for course thumbnails. This guide covers all frontend changes needed to implement the new multipart/form-data upload flow.

---

## Backend Changes Summary

### What Changed:
- **Before**: Courses accepted `thumbnail` as a URL string
- **After**: Courses accept `thumbnail` as a file upload (multipart/form-data)

### Updated Endpoints:

#### 1. Create Course
```
POST /api/courses
Content-Type: multipart/form-data

Fields:
- title (string, required)
- description (string, required)
- thumbnail (file, optional) - Image file (jpeg/jpg/png/webp/gif, max 5MB)
- category (string, optional)
- level (string, optional) - BEGINNER | INTERMEDIATE | ADVANCED
```

#### 2. Update Course
```
PATCH /api/courses/:id
Content-Type: multipart/form-data

Fields:
- title (string, optional)
- description (string, optional)
- thumbnail (file, optional) - New image file will replace old one
- category (string, optional)
- level (string, optional)
```

### File Constraints:
- **Allowed formats**: JPEG, JPG, PNG, WebP, GIF
- **Max size**: 5 MB
- **Auto-optimization**: Images are automatically resized (max 1280x720) and optimized for web

---

## Frontend Implementation

### 1. Update Course Creation Form

#### TypeScript Interface Updates

```typescript
// types/course.ts

// OLD - Remove or deprecate
interface CreateCoursePayload {
  title: string;
  description: string;
  thumbnail?: string; // URL string
  category?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

// NEW - Use FormData instead
interface CreateCourseFormData {
  title: string;
  description: string;
  thumbnailFile?: File; // Actual file object
  category?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
```

#### React Component Example (TypeScript + React Hook Form)

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';

// Validation schema
const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

export function CreateCourseForm() {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      return;
    }

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF.');
      e.target.value = ''; // Clear input
      return;
    }

    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      e.target.value = ''; // Clear input
      return;
    }

    // Set file and create preview
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    // Reset file input
    const fileInput = document.getElementById('thumbnail') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Submit handler
  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      
      if (data.category) {
        formData.append('category', data.category);
      }
      
      if (data.level) {
        formData.append('level', data.level);
      }
      
      // Append file if selected
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      // Make API request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`, {
        method: 'POST',
        headers: {
          // DO NOT set Content-Type - browser will set it with boundary
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create course');
      }

      const result = await response.json();
      toast.success('Course created successfully!');
      
      // Reset form
      reset();
      setThumbnailFile(null);
      setThumbnailPreview(null);
      
      // Redirect or refresh
      // router.push(`/creator/courses/${result.data.id}`);
      
    } catch (error: any) {
      console.error('Create course error:', error);
      toast.error(error.message || 'Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Introduction to React"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe what students will learn..."
          rows={4}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          {...register('category')}
          placeholder="e.g., Programming, Design, Business"
        />
      </div>

      {/* Level */}
      <div>
        <Label htmlFor="level">Difficulty Level</Label>
        <select
          id="level"
          {...register('level')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select level</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>

      {/* Thumbnail Upload */}
      <div>
        <Label htmlFor="thumbnail">Course Thumbnail</Label>
        <div className="mt-2 space-y-4">
          {/* File Input */}
          {!thumbnailPreview && (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="thumbnail"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WebP or GIF (MAX. 5MB)
                  </p>
                </div>
                <input
                  id="thumbnail"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {/* Image Preview */}
          {thumbnailPreview && (
            <div className="relative">
              <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-300">
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={handleRemoveImage}
              >
                Remove Image
              </Button>
              {thumbnailFile && (
                <p className="text-sm text-gray-500 mt-2">
                  {thumbnailFile.name} ({(thumbnailFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Optional. Recommended size: 1280x720px or 16:9 aspect ratio
        </p>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Course'}
      </Button>
    </form>
  );
}
```

---

### 2. Update Course Edit Form

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface EditCourseFormProps {
  courseId: string;
  initialData: {
    title: string;
    description: string;
    thumbnail?: string; // Existing thumbnail URL
    category?: string;
    level?: string;
  };
}

export function EditCourseForm({ courseId, initialData }: EditCourseFormProps) {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData.thumbnail || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: initialData.title,
      description: initialData.description,
      category: initialData.category,
      level: initialData.level as any,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF.');
      e.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      e.target.value = '';
      return;
    }

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveNewImage = () => {
    setThumbnailFile(null);
    setThumbnailPreview(initialData.thumbnail || null);
    const fileInput = document.getElementById('thumbnail') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Only append changed fields
      if (data.title !== initialData.title) {
        formData.append('title', data.title);
      }
      
      if (data.description !== initialData.description) {
        formData.append('description', data.description);
      }
      
      if (data.category && data.category !== initialData.category) {
        formData.append('category', data.category);
      }
      
      if (data.level && data.level !== initialData.level) {
        formData.append('level', data.level);
      }
      
      // Append new thumbnail file if selected
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            // DO NOT set Content-Type
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update course');
      }

      const result = await response.json();
      toast.success('Course updated successfully!');
      
      // Update preview with new URL if returned
      if (result.data.thumbnail) {
        setThumbnailPreview(result.data.thumbnail);
      }
      
    } catch (error: any) {
      console.error('Update course error:', error);
      toast.error(error.message || 'Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Same form fields as Create form */}
      
      <div>
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          {...register('title')}
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={4}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" {...register('category')} />
      </div>

      <div>
        <Label htmlFor="level">Difficulty Level</Label>
        <select
          id="level"
          {...register('level')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select level</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>

      {/* Thumbnail Upload with existing image */}
      <div>
        <Label htmlFor="thumbnail">Course Thumbnail</Label>
        <div className="mt-2 space-y-4">
          {/* Current/Preview Image */}
          {thumbnailPreview && (
            <div className="relative">
              <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-300">
                <Image
                  src={thumbnailPreview}
                  alt="Course thumbnail"
                  fill
                  className="object-cover"
                />
              </div>
              {thumbnailFile && (
                <>
                  <p className="text-sm text-green-600 mt-2">
                    New image selected: {thumbnailFile.name}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveNewImage}
                  >
                    Cancel New Image
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Change Image Button */}
          <div>
            <label
              htmlFor="thumbnail"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              {thumbnailPreview ? 'Change Thumbnail' : 'Upload Thumbnail'}
            </label>
            <input
              id="thumbnail"
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Upload a new image to replace the current thumbnail. Max 5MB.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Updating...' : 'Update Course'}
      </Button>
    </form>
  );
}
```

---

### 3. API Service/Hook Updates

```typescript
// lib/api/courses.ts

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string; // URL string returned from API
  category?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new course with optional thumbnail upload
 */
export async function createCourse(data: {
  title: string;
  description: string;
  thumbnailFile?: File;
  category?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}): Promise<Course> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  
  if (data.category) formData.append('category', data.category);
  if (data.level) formData.append('level', data.level);
  if (data.thumbnailFile) formData.append('thumbnail', data.thumbnailFile);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      // DO NOT set Content-Type - browser handles it
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create course');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update an existing course with optional thumbnail upload
 */
export async function updateCourse(
  courseId: string,
  data: {
    title?: string;
    description?: string;
    thumbnailFile?: File;
    category?: string;
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  }
): Promise<Course> {
  const formData = new FormData();
  
  if (data.title) formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.category) formData.append('category', data.category);
  if (data.level) formData.append('level', data.level);
  if (data.thumbnailFile) formData.append('thumbnail', data.thumbnailFile);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        // DO NOT set Content-Type
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update course');
  }

  const result = await response.json();
  return result.data;
}

function getAuthToken(): string {
  // Implement your token retrieval logic
  return localStorage.getItem('token') || '';
}
```

---

### 4. React Hook (Optional - for cleaner component logic)

```typescript
// hooks/useCourseForm.ts

import { useState } from 'react';
import { toast } from 'sonner';

interface UseCourseFormOptions {
  onSuccess?: (course: any) => void;
  onError?: (error: Error) => void;
}

export function useCourseImageUpload(options?: UseCourseFormOptions) {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateAndSetFile = (file: File | null): boolean => {
    if (!file) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      return false;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF.');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return false;
    }

    setThumbnailFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    return true;
  };

  const clearImage = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  return {
    thumbnailFile,
    thumbnailPreview,
    isUploading,
    setIsUploading,
    validateAndSetFile,
    clearImage,
  };
}
```

---

## Important Notes

### ✅ DO's:

1. **Use FormData** for all course create/update requests
2. **Don't set Content-Type header** - browser automatically sets it with the correct boundary
3. **Validate files client-side** before upload (type, size)
4. **Show image preview** before submission
5. **Handle loading states** during upload
6. **Clear file inputs** after submission or cancellation

### ❌ DON'Ts:

1. **Don't send JSON** with file uploads (it won't work)
2. **Don't manually set `Content-Type: multipart/form-data`** (browser handles it)
3. **Don't forget Authorization header** (still required)
4. **Don't skip client-side validation** (improves UX)
5. **Don't leave old URL-based code** that conflicts with new upload flow

---

## Error Handling

### Backend Error Responses:

```typescript
// File too large
{
  "success": false,
  "message": "File too large. Max size: 5MB",
  "error": "LIMIT_FILE_SIZE"
}

// Invalid file type
{
  "success": false,
  "message": "Invalid file type. Only images allowed (jpeg, jpg, png, webp, gif)",
  "error": "INVALID_FILE_TYPE"
}

// Upload failed
{
  "success": false,
  "message": "Image upload failed",
  "error": "UPLOAD_FAILED"
}

// No file but other validation errors
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "Title is required",
    "description": "Description must be at least 10 characters"
  }
}
```

### Frontend Error Handling:

```typescript
try {
  const response = await fetch(url, { method, body: formData, headers });
  
  if (!response.ok) {
    const error = await response.json();
    
    // Handle specific error types
    switch (error.error) {
      case 'LIMIT_FILE_SIZE':
        toast.error('File is too large. Please choose an image under 5MB.');
        break;
      case 'INVALID_FILE_TYPE':
        toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
        break;
      case 'UPLOAD_FAILED':
        toast.error('Failed to upload image. Please try again.');
        break;
      default:
        toast.error(error.message || 'An error occurred');
    }
    
    return;
  }
  
  const result = await response.json();
  toast.success('Course saved successfully!');
  
} catch (error) {
  console.error('Upload error:', error);
  toast.error('Network error. Please check your connection.');
}
```

---

## Testing Checklist

### Create Course:
- [ ] Create course without thumbnail (should work)
- [ ] Create course with valid image (JPEG, PNG, WebP, GIF)
- [ ] Try uploading file >5MB (should show error)
- [ ] Try uploading non-image file (should show error)
- [ ] Check uploaded image displays correctly in course list
- [ ] Verify image is optimized (check network tab for reduced size)

### Update Course:
- [ ] Update course text without changing thumbnail
- [ ] Update course with new thumbnail (old should be deleted)
- [ ] Update course and remove thumbnail
- [ ] Check that thumbnail preview shows current image
- [ ] Verify old images are deleted from Cloudinary

### Edge Cases:
- [ ] Cancel upload mid-process
- [ ] Upload very small images (should still work)
- [ ] Upload images with special characters in filename
- [ ] Test with slow network (loading states)
- [ ] Test with network failure (error handling)

---

## Migration Strategy

### If you have existing courses with URL thumbnails:

**Option 1: Keep both systems**
- Backend already supports both file uploads and URL strings
- Gradually migrate old courses to use uploaded files
- Keep `thumbnail` field as string in database

**Option 2: Migrate all at once**
- Fetch all course thumbnails from current URLs
- Re-upload them to your Cloudinary via backend
- Update database records with new Cloudinary URLs

**Recommended**: Option 1 (gradual migration, less risk)

---

## Additional Features to Consider

### 1. Image Cropping
Use a library like `react-image-crop` for aspect ratio control:
```bash
npm install react-image-crop
```

### 2. Drag & Drop
Use `react-dropzone` for better UX:
```bash
npm install react-dropzone
```

### 3. Multiple Images
If you want to support multiple course images (gallery):
```typescript
// Backend already supports this with uploadMultipleImages
formData.append('images', file1);
formData.append('images', file2);
formData.append('images', file3);
```

---

## Questions or Issues?

If you encounter any problems:

1. **Check Network Tab**: Verify `Content-Type: multipart/form-data; boundary=...` is set automatically
2. **Check FormData**: Use `console.log([...formData.entries()])` to debug
3. **Check File Size**: Use `(file.size / 1024 / 1024).toFixed(2)` to check MB
4. **Check Backend Logs**: Server will log upload attempts and errors
5. **Test with Postman**: Use Postman to test the endpoint independently

---

## Summary

**What changed:**
- Course creation/update now accepts **file uploads** instead of URL strings
- Use `FormData` instead of JSON
- Don't set `Content-Type` header manually
- Backend automatically optimizes and stores images in Cloudinary

**What to update:**
1. Form components (add file input, preview, validation)
2. API service functions (use FormData)
3. Type definitions (optional File field)
4. Error handling (new error types)

**What stays the same:**
- Course data structure (thumbnail is still a URL string in responses)
- Authentication flow (JWT token in Authorization header)
- Other course fields (title, description, etc.)

The backend is ready! Just update your frontend components as shown above and you're good to go. 🚀
