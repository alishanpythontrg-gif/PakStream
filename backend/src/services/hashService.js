const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculate SHA-256 hash of a file using streaming for memory efficiency
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Hexadecimal hash string (lowercase)
 */
async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      const hashHex = hash.digest('hex').toLowerCase();
      resolve(hashHex);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Calculate SHA-256 hash from a buffer (for uploaded files)
 * @param {Buffer} buffer - File buffer
 * @returns {string} - Hexadecimal hash string (lowercase)
 */
function calculateBufferHash(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex').toLowerCase();
}

module.exports = {
  calculateFileHash,
  calculateBufferHash
};

