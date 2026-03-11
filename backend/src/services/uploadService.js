const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Upload Service
 * Handles uploading local files to Cloudinary
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload video file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Destination folder (e.g., 'generated', 'temp')
 * @param {string} videoId - Optional Video ID to use as public_id
 * @returns {Promise<string>} - Secure URL of uploaded file
 */
exports.uploadVideo = async (filePath, folder = 'videos', videoId = null) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    console.log(`📤 Uploading to Cloudinary: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    const options = {
      resource_type: 'video',
      folder: `MAVEED/${folder}`,
      chunk_size: 6000000
    };

    if (videoId) {
      options.public_id = `maveed_${videoId.toString().slice(-12)}`;
      options.use_filename = false;
      options.unique_filename = false;
    } else {
      options.use_filename = true;
      options.unique_filename = true;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            return reject(error);
          }
          if (!result || (!result.secure_url && !result.url)) {
            console.error('❌ Cloudinary result missing URL:', result);
            return reject(new Error('Cloudinary upload returned no URL'));
          }
          const finalUrl = result.secure_url || result.url;
          console.log(`✅ Upload success: ${finalUrl}`);
          resolve(finalUrl);
        }
      );

      const readStream = fs.createReadStream(filePath);
      readStream.on('error', (err) => {
        console.error(`❌ Local file read stream error: ${err.message}`);
        reject(err);
      });

      readStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('❌ [uploadVideo] failed:', error.message);
    throw error;
  }
};

/**
 * Upload image (path or base64) to Cloudinary
 * @param {string} file - Local path or Base64 Data URI
 * @param {string} folder - Destination folder
 * @returns {Promise<string>} - Secure URL of uploaded file
 */
exports.uploadImage = async (file, folder = 'images') => {
  try {
    const isBase64 = typeof file === 'string' && file.startsWith('data:');
    console.log(`📤 Uploading image to Cloudinary (${isBase64 ? 'Base64' : 'File'})...`);

    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'image',
      folder: `MAVEED/${folder}`,
    });

    if (!result.secure_url) throw new Error('Cloudinary image upload returned no URL');
    console.log(`✅ Image Upload success: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary image upload error:', error);
    throw error;
  }
};

/**
 * Delete local file safely
 */
exports.deleteLocalFile = async (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log('🗑️ Local file deleted:', filePath);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('⚠️ File already deleted or moved:', filePath);
    } else {
      console.error('❌ Failed to delete local file:', error.message);
      // Don't throw, just log as it's a cleanup task
    }
  }
};

/**
 * Remux MP4 file for faststart (moving moov atom to front)
 */
exports.remuxForFaststart = async (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    console.log(`🎬 [FFMPEG] Remuxing for faststart: ${inputPath} -> ${outputPath}`);

    ffmpeg(inputPath)
      .outputOptions([
        '-c copy',
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`✅ [FFMPEG] Remux complete.`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`❌ [FFMPEG] Remux error: ${err.message}`);
        reject(err);
      })
      .run();
  });
};
