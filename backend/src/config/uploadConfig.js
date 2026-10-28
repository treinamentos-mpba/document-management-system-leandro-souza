const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const maxFileSize = process.env.MAX_FILE_SIZE === undefined
  ? DEFAULT_MAX_FILE_SIZE
  : Number(process.env.MAX_FILE_SIZE);

if (!Number.isSafeInteger(maxFileSize) || maxFileSize < 1) {
  throw new Error('MAX_FILE_SIZE deve ser um inteiro positivo em bytes.');
}

module.exports = {
  maxFileSize,
  owner: process.env.DMS_DEFAULT_OWNER || 'anonymous',
  storageDirectory: path.resolve(__dirname, '../../storage'),
};