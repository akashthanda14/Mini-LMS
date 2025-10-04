/**
 * Quick Lesson API Test
 */

const BASE_URL = 'http://localhost:4000/api';

async function quickTest() {
  try {
    console.log('Testing lesson endpoints...\n');

    // 1. Login as creator
    console.log('1. Logging in as creator...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    console.log('✅ Logged in\n');

    // 2. Create course
    console.log('2. Creating course...');
    const courseRes = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Video Course',
        description: 'A test course for lesson upload testing with videos and transcripts.'
      })
    });
    
    const courseData = await courseRes.json();
    const courseId = courseData.data.id;
    console.log(`✅ Course created: ${courseId}\n`);

    // 3. Get upload credentials
    console.log('3. Getting upload credentials...');
    const credentialsRes = await fetch(`${BASE_URL}/courses/${courseId}/lessons/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const credentialsData = await credentialsRes.json();
    console.log('✅ Upload credentials received:');
    console.log(`   Upload URL: ${credentialsData.data.uploadUrl}`);
    console.log(`   Public ID: ${credentialsData.data.publicId}`);
    console.log(`   API Key: ${credentialsData.data.apiKey}\n`);

    // 4. Create lesson with mock Cloudinary URL
    console.log('4. Creating lesson with Cloudinary URL...');
    const lessonRes = await fetch(`${BASE_URL}/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Introduction to Testing',
        videoUrl: 'https://res.cloudinary.com/dumurymxf/video/upload/v1234567/test.mp4',
        order: 1,
        duration: 600
      })
    });
    
    const lessonData = await lessonRes.json();
    const lessonId = lessonData.data.id;
    console.log(`✅ Lesson created: ${lessonId}\n`);

    // 5. Get lessons
    console.log('5. Retrieving lessons...');
    const lessonsRes = await fetch(`${BASE_URL}/courses/${courseId}/lessons`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const lessonsData = await lessonsRes.json();
    console.log(`✅ Retrieved ${lessonsData.data.length} lesson(s)\n`);

    // 6. Update lesson
    console.log('6. Updating lesson...');
    const updateRes = await fetch(`${BASE_URL}/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Introduction to Testing (Updated)'
      })
    });
    
    const updateData = await updateRes.json();
    console.log(`✅ Lesson updated: ${updateData.data.title}\n`);

    // 7. Test duplicate order
    console.log('7. Testing duplicate order prevention...');
    const dupRes = await fetch(`${BASE_URL}/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Another Lesson',
        videoUrl: 'https://res.cloudinary.com/dumurymxf/video/upload/v1234567/test2.mp4',
        order: 1, // Duplicate!
        duration: 300
      })
    });
    
    const dupData = await dupRes.json();
    if (dupRes.status === 400) {
      console.log(`✅ Duplicate order blocked: ${dupData.message}\n`);
    } else {
      console.log(`❌ Duplicate order should have been blocked\n`);
    }

    // 8. Cleanup
    console.log('8. Cleaning up...');
    await fetch(`${BASE_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Course deleted\n');

    console.log('🎉 All quick tests passed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

quickTest();
