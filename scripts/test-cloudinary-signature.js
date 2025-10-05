import { generateUploadSignature } from '../config/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Test Cloudinary signature generation
 * Verifies that the signature matches what Cloudinary expects
 */

console.log('🧪 Testing Cloudinary Signature Generation\n');

// Test parameters
const testCourseId = '1da5cf68-cded-4739-bb02-a6d54182462d';
const testPublicId = `course_${testCourseId}_lesson_${Date.now()}`;
const testFolder = `courses/${testCourseId}/lessons`;

console.log('Test Parameters:');
console.log('- Public ID:', testPublicId);
console.log('- Folder:', testFolder);
console.log('');

try {
  // Generate credentials
  const credentials = generateUploadSignature(testPublicId, testFolder);
  
  console.log('✅ Credentials Generated:');
  console.log(JSON.stringify(credentials, null, 2));
  console.log('');
  
  // Verify signature manually
  const params = {
    timestamp: credentials.timestamp,
    public_id: credentials.public_id,
    folder: credentials.folder
  };
  
  // Sort parameters alphabetically (Cloudinary requirement)
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  console.log('📝 String to Sign (sorted):');
  console.log(sortedParams);
  console.log('');
  
  // Generate expected signature
  const expectedSignature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );
  
  console.log('🔐 Signature Verification:');
  console.log('Generated:', credentials.signature);
  console.log('Expected: ', expectedSignature);
  console.log('Match:    ', credentials.signature === expectedSignature ? '✅ YES' : '❌ NO');
  console.log('');
  
  // Frontend usage example
  console.log('📤 Frontend FormData Example:');
  console.log(`
const formData = new FormData();
formData.append('file', file);
formData.append('api_key', '${credentials.api_key}');
formData.append('timestamp', '${credentials.timestamp}');
formData.append('signature', '${credentials.signature}');
formData.append('folder', '${credentials.folder}');
formData.append('public_id', '${credentials.public_id}');

// IMPORTANT: Only send these 3 signed parameters:
// - folder
// - public_id  
// - timestamp
// Plus api_key, signature, and file

// Upload to: ${credentials.cloud_name}
fetch('https://api.cloudinary.com/v1_1/${credentials.cloud_name}/video/upload', {
  method: 'POST',
  body: formData
});
  `);
  
  console.log('✅ Signature test completed successfully!');
  console.log('');
  console.log('💡 Key Points:');
  console.log('1. Signature is calculated from: folder, public_id, timestamp');
  console.log('2. Frontend must send EXACTLY these parameters (plus file, api_key, signature)');
  console.log('3. Parameters are sorted alphabetically before signing');
  console.log('4. No resource_type, eager, or eager_async in the signature');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error);
  process.exit(1);
}
