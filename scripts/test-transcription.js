// scripts/test-transcription.js
// Test OpenAI Whisper transcription functionality

import dotenv from 'dotenv';
import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('='.repeat(60));
console.log('🎙️  OpenAI Whisper Transcription Test');
console.log('='.repeat(60));

// Test 1: Check if API key is configured
console.log('\n✓ Test 1: Check API Key Configuration');
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.log('❌ OPENAI_API_KEY not found in environment');
  process.exit(1);
}
console.log('✅ API Key found:', apiKey.substring(0, 15) + '...' + apiKey.slice(-4));

// Test 2: Initialize OpenAI client
console.log('\n✓ Test 2: Initialize OpenAI Client');
let openai;
try {
  openai = new OpenAI({ apiKey });
  console.log('✅ OpenAI client initialized');
} catch (error) {
  console.log('❌ Failed to initialize OpenAI client:', error.message);
  process.exit(1);
}

// Test 3: Download a small test video
console.log('\n✓ Test 3: Download Test Video');
const testVideoUrl = 'https://res.cloudinary.com/dmt4dj8ft/video/upload/v1759675772/Java_in_100_Seconds_cr6wur.mp4';
const tempDir = path.join(__dirname, '..', 'temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const testFilePath = path.join(tempDir, `test_transcription_${Date.now()}.mp4`);

console.log('📥 Downloading video from:', testVideoUrl);

try {
  const response = await axios({
    method: 'get',
    url: testVideoUrl,
    responseType: 'stream',
    timeout: 60000
  });

  const writer = fs.createWriteStream(testFilePath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const stats = fs.statSync(testFilePath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log('✅ Video downloaded successfully');
  console.log(`   File size: ${fileSizeMB} MB`);
  console.log(`   File path: ${testFilePath}`);

  // Check file size limit
  if (fileSizeMB > 25) {
    console.log('⚠️  WARNING: File exceeds Whisper 25MB limit');
    fs.unlinkSync(testFilePath);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Failed to download video:', error.message);
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
  process.exit(1);
}

// Test 4: Call OpenAI Whisper API
console.log('\n✓ Test 4: Call OpenAI Whisper API');
console.log('🔄 Transcribing video (this may take 10-30 seconds)...');

try {
  const startTime = Date.now();
  const fileStream = fs.createReadStream(testFilePath);

  const transcription = await openai.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-1',
    response_format: 'text',
    language: 'en'
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('✅ Transcription successful!');
  console.log(`   Duration: ${duration} seconds`);
  console.log(`   Transcript length: ${transcription.length} characters`);
  console.log('\n📝 Transcript Preview (first 500 chars):');
  console.log('-'.repeat(60));
  console.log(transcription.substring(0, 500));
  if (transcription.length > 500) {
    console.log('...(truncated)');
  }
  console.log('-'.repeat(60));

  // Save full transcript to file
  const transcriptPath = path.join(tempDir, `transcript_${Date.now()}.txt`);
  fs.writeFileSync(transcriptPath, transcription);
  console.log(`\n💾 Full transcript saved to: ${transcriptPath}`);

} catch (error) {
  console.log('❌ Transcription failed');
  console.log('   Error:', error.message);
  
  if (error.response) {
    console.log('   Status:', error.response.status);
    console.log('   Details:', error.response.data);
  }

  // Check for common errors
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    console.log('\n💡 TIP: Your API key might be invalid or expired');
    console.log('   Visit: https://platform.openai.com/api-keys');
  } else if (error.message.includes('429') || error.message.includes('quota')) {
    console.log('\n💡 TIP: You may have exceeded your API quota or rate limit');
    console.log('   Visit: https://platform.openai.com/usage');
  } else if (error.message.includes('billing')) {
    console.log('\n💡 TIP: Check your billing settings at OpenAI');
    console.log('   Visit: https://platform.openai.com/account/billing');
  }

  // Cleanup and exit
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
  process.exit(1);
}

// Cleanup
console.log('\n✓ Test 5: Cleanup');
if (fs.existsSync(testFilePath)) {
  fs.unlinkSync(testFilePath);
  console.log('✅ Temporary files cleaned up');
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests passed! OpenAI Whisper is working correctly.');
console.log('='.repeat(60));

process.exit(0);
