import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Generate signed upload parameters for direct client-side upload
 * @param {string} publicId - The public ID for the video
 * @param {string} folder - The folder to upload to (optional)
 * @returns {object} Upload credentials including signature, timestamp, etc.
 */
export const generateUploadSignature = (publicId, folder = 'course-videos') => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    
    const params = {
      timestamp,
      public_id: publicId,
      folder,
      resource_type: 'video',
      eager: 'sp_hd/mp4', // Auto-generate HD MP4 version
      eager_async: true
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    logger.info('Generated Cloudinary upload signature', { publicId, folder });

    return {
      signature,
      timestamp,
      public_id: publicId,
      folder,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      resource_type: 'video',
      eager: 'sp_hd/mp4',
      eager_async: true
    };
  } catch (error) {
    logger.error('Error generating Cloudinary signature', { error: error.message });
    throw new Error('Failed to generate upload credentials');
  }
};

/**
 * Generate signed upload parameters for images (thumbnails)
 * @param {string} publicId
 * @param {string} folder
 * @returns {object}
 */
export const generateImageUploadSignature = (publicId, folder = 'course-thumbnails') => {
  try {
    const timestamp = Math.round(Date.now() / 1000);

    const params = {
      timestamp,
      public_id: publicId,
      folder,
      resource_type: 'image'
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    logger.info('Generated Cloudinary image upload signature', { publicId, folder });

    return {
      signature,
      timestamp,
      public_id: publicId,
      folder,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      resource_type: 'image'
    };
  } catch (error) {
    logger.error('Error generating Cloudinary image signature', { error: error.message });
    throw new Error('Failed to generate image upload credentials');
  }
};

/**
 * Delete a video from Cloudinary
 * @param {string} publicId - The public ID of the video to delete
 * @returns {Promise<object>} Deletion result
 */
export const deleteVideo = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
      invalidate: true
    });

    logger.info('Deleted video from Cloudinary', { publicId, result });
    return result;
  } catch (error) {
    logger.error('Error deleting video from Cloudinary', { 
      publicId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null if invalid
 */
export const extractPublicId = (url) => {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    // Extract public ID from URL
    // Format: https://res.cloudinary.com/{cloud_name}/video/upload/v{version}/{folder}/{public_id}.{format}
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    logger.error('Error extracting public ID from URL', { url, error: error.message });
    return null;
  }
};

/**
 * Validate if URL is from Cloudinary
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Cloudinary URL
 */
export const isCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  return url.includes('cloudinary.com') && url.includes('/video/');
};

export default cloudinary;
