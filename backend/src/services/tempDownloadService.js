const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Temp Download Service
 * Downloads a file from URL to a temporary local path
 */
exports.downloadToTemp = async (url, extension = '.mp4') => {
  try {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `${uuidv4()}${extension}`;
    const filePath = path.join(tempDir, fileName);

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(filePath);
        }
      });
    });
  } catch (error) {
    console.error('Download to temp error:', error);
    throw error;
  }
};
