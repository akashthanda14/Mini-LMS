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
    
    // Only include parameters that will be sent in the upload request
    // These MUST match exactly what the frontend sends
    const params = {
      timestamp,
      public_id: publicId,
      folder
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    logger.info('Generated Cloudinary upload signature', { publicId, folder, timestamp });

    return {
      signature,
      timestamp,
      public_id: publicId,
      folder,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME
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

/**
 * Upload image buffer to Cloudinary (server-side)
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Folder to upload to (default: 'course-thumbnails')
 * @param {string} publicId - Optional public ID
 * @returns {Promise<object>} Upload result with secure_url
 */
export const uploadImageToCloudinary = (buffer, folder = 'course-thumbnails', publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1280, height: 720, crop: 'limit' }, // Max size
        { quality: 'auto:good' }, // Auto quality optimization
        { fetch_format: 'auto' } // Auto format (webp for modern browsers)
      ],
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error', { error: error.message });
          return reject(error);
        }
        logger.info('Image uploaded to Cloudinary', { 
          publicId: result.public_id,
          url: result.secure_url 
        });
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<object>} Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });

    logger.info('Deleted image from Cloudinary', { publicId, result });
    return result;
  } catch (error) {
    logger.error('Error deleting image from Cloudinary', { 
      publicId, 
      error: error.message 
    });
    throw error;
  }
};

export default cloudinary;
