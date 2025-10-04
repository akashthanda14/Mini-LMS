import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Download video file from URL
 * @param {string} videoUrl - Cloudinary video URL
 * @returns {Promise<string>} Path to downloaded file
 */
const downloadVideo = async (videoUrl) => {
  const tempDir = path.join(__dirname, '..', 'temp');
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filename = `video_${Date.now()}.mp4`;
  const filepath = path.join(tempDir, filename);

  try {
    logger.info('Downloading video', { videoUrl, filepath });

    const response = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream',
      timeout: 60000 // 60 second timeout
    });

    const writer = fs.createWriteStream(filepath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        logger.info('Video downloaded successfully', { filepath });
        resolve(filepath);
      });
      writer.on('error', (error) => {
        logger.error('Error downloading video', { error: error.message });
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Failed to download video', { 
      videoUrl, 
      error: error.message 
    });
    throw new Error(`Video download failed: ${error.message}`);
  }
};

/**
 * Extract audio from video (or use video directly)
 * Note: Whisper API accepts video files directly
 * @param {string} filepath - Path to video file
 * @returns {Promise<string>} Path to audio/video file
 */
const extractAudio = async (filepath) => {
  // Whisper API supports video files directly, so we can skip extraction
  // If needed in the future, ffmpeg can be used here
  return filepath;
};

/**
 * Generate transcript using OpenAI Whisper API
 * @param {string} filepath - Path to audio/video file
 * @returns {Promise<string>} Generated transcript
 */
const generateTranscriptWithWhisper = async (filepath) => {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    logger.info('Calling OpenAI Whisper API', { filepath });

    const fileStream = fs.createReadStream(filepath);

    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      response_format: 'text',
      language: 'en' // Can be made configurable
    });

    logger.info('Transcription completed', { 
      length: transcription.length 
    });

    return transcription;
  } catch (error) {
    logger.error('OpenAI Whisper API error', { 
      error: error.message,
      status: error.response?.status 
    });
    throw new Error(`Whisper API failed: ${error.message}`);
  }
};

/**
 * Generate dummy transcript (fallback when OpenAI not configured)
 * @param {string} videoUrl - Video URL
 * @returns {Promise<string>} Dummy transcript
 */
const generateDummyTranscript = async (videoUrl) => {
  logger.warn('Using dummy transcript (OpenAI not configured)');

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const dummyTranscript = `[Auto-generated dummy transcript]

Welcome to this lesson. This is a demonstration transcript generated because OpenAI API is not configured.

In a production environment, this would be replaced with actual transcription from OpenAI Whisper API.

The video URL is: ${videoUrl}

Key points covered in this lesson:
- Introduction to the topic
- Main concepts and explanations
- Practical examples and demonstrations
- Summary and conclusion

To enable real transcription, please configure your OPENAI_API_KEY in the environment variables.

Thank you for watching this lesson.`;

  return dummyTranscript;
};

/**
 * Clean up temporary files
 * @param {string} filepath - Path to file to delete
 */
const cleanupFile = (filepath) => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info('Temporary file cleaned up', { filepath });
    }
  } catch (error) {
    logger.error('Error cleaning up file', { 
      filepath, 
      error: error.message 
    });
  }
};

/**
 * Main transcript generation function
 * @param {string} videoUrl - Cloudinary video URL
 * @returns {Promise<string>} Generated transcript
 */
export const generateTranscript = async (videoUrl) => {
  let downloadedFile = null;

  try {
    // Check if OpenAI is configured
    if (!openai) {
      logger.warn('OpenAI not configured, using dummy transcript');
      return await generateDummyTranscript(videoUrl);
    }

    // Download video from Cloudinary
    try {
      downloadedFile = await downloadVideo(videoUrl);
    } catch (downloadError) {
      // If download fails (404, network error, etc.), fall back to dummy transcript
      logger.warn('Video download failed, using dummy transcript', { 
        error: downloadError.message 
      });
      return await generateDummyTranscript(videoUrl);
    }

    // Check file size (Whisper has 25MB limit)
    const stats = fs.statSync(downloadedFile);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    logger.info('Video file size', { sizeMB: fileSizeMB.toFixed(2) });

    if (fileSizeMB > 25) {
      // File too large, use dummy transcript
      logger.warn('File too large for Whisper, using dummy transcript', { 
        sizeMB: fileSizeMB.toFixed(2) 
      });
      cleanupFile(downloadedFile);
      return await generateDummyTranscript(videoUrl);
    }

    // Extract audio (currently just returns the video file)
    const audioFile = await extractAudio(downloadedFile);

    // Generate transcript using Whisper
    const transcript = await generateTranscriptWithWhisper(audioFile);

    // Clean up
    cleanupFile(downloadedFile);

    return transcript;
  } catch (error) {
    // Clean up on error
    if (downloadedFile) {
      cleanupFile(downloadedFile);
    }

    // If OpenAI fails, fall back to dummy transcript
    if (error.message.includes('OpenAI') || error.message.includes('Whisper')) {
      logger.error('OpenAI failed, using dummy transcript', { 
        error: error.message 
      });
      return await generateDummyTranscript(videoUrl);
    }

    throw error;
  }
};

/**
 * Check if OpenAI is configured
 * @returns {boolean} True if OpenAI API key is set
 */
export const isOpenAIConfigured = () => {
  return !!openai;
};

export default {
  generateTranscript,
  isOpenAIConfigured
};
