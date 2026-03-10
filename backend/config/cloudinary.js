const cloudinary = require("cloudinary").v2;

try {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  
  if (cloudinaryUrl) {
    // Parse cloudinary://api_key:api_secret@cloud_name
    const url = new URL(cloudinaryUrl);
    const apiKey = url.username;
    const apiSecret = url.password;
    const cloudName = url.hostname;
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
    
    console.log(`Cloudinary configured for cloud: ${cloudName}`);
  } else {
    console.warn("CLOUDINARY_URL environment variable not set");
  }
} catch (error) {
  console.error("Cloudinary configuration error:", error.message);
}

module.exports = cloudinary;