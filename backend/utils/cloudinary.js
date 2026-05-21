const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and deletes the local temporary file
 * @param {string} localFilePath - Path of the locally stored file
 * @param {string} folder - Folder name on Cloudinary (e.g. "college_erp/materials")
 * @returns {Promise<object|null>} - Cloudinary upload result object, or null on failure
 */
const uploadToCloudinary = async (localFilePath, folder) => {
  try {
    if (!localFilePath) return null;
    
    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: "auto",
    });
    
    // File has been uploaded successfully, remove local copy
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error: ", error);
    // Remove the locally saved temporary file as the upload operation failed
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error("Failed to delete local temporary file: ", err);
      }
    }
    return null;
  }
};

/**
 * Parses a Cloudinary URL to extract the public ID
 * @param {string} url - The secure Cloudinary URL
 * @returns {string|null} - The parsed public_id, or null if not a Cloudinary URL
 */
const extractPublicId = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    
    let publicIdParts = parts.slice(uploadIndex + 1);
    // If there's a version prefix (like v1612345678), remove it
    if (publicIdParts[0].startsWith("v") && !isNaN(publicIdParts[0].substring(1))) {
      publicIdParts = publicIdParts.slice(1);
    }
    
    const fullPublicId = publicIdParts.join("/");
    const lastDotIndex = fullPublicId.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return fullPublicId.substring(0, lastDotIndex);
    }
    return fullPublicId;
  } catch (error) {
    console.error("Error extracting public ID from Cloudinary URL: ", error);
    return null;
  }
};

/**
 * Deletes a file from Cloudinary given its secure URL
 * @param {string} url - The Cloudinary secure URL
 * @returns {Promise<boolean>} - True if deletion succeeded, false otherwise
 */
const deleteFromCloudinary = async (url) => {
  try {
    if (!url) return false;
    const publicId = extractPublicId(url);
    if (!publicId) return false;
    
    // Check if the URL has an image extension or is classified as raw file
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    const resourceType = isImage ? "image" : "raw";
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log(`Cloudinary Delete Result for public_id [${publicId}]: `, result);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary Delete Error: ", error);
    return false;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
};
