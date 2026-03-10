const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Upload image to Cloudinary
exports.uploadImage = async (buffer, folder = 'aloe-vera-scans') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

// Generate thumbnail
exports.generateThumbnail = async (publicId) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 300, height: 300, crop: 'fill', quality: 'auto' }
    ]
  });
};

// Delete image from Cloudinary
exports.deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

