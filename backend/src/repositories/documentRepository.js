const fs = require('node:fs/promises');
const path = require('node:path');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const { maxFileSize, storageDirectory } = require('../config/uploadConfig');

const documents = new Map();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    fs.mkdir(storageDirectory, { recursive: true })
      .then(() => callback(null, storageDirectory))
      .catch(callback);
  },
  filename: (_request, _file, callback) => {
    callback(null, randomUUID());
  },
});

function toPublicDocument(document) {
  const { storageName, ...metadata } = document;
  return metadata;
}

const documentRepository = {
  storage,
  maxFileSize,

  create(metadata) {
    const document = { ...metadata, storageName: metadata.id };
    documents.set(document.id, document);
    return toPublicDocument(document);
  },

  list() {
    return [...documents.values()]
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
      .map(toPublicDocument);
  },

  findById(id) {
    const document = documents.get(id);
    return document ? toPublicDocument(document) : null;
  },

  getFilePath(id) {
    const document = documents.get(id);
    return document ? path.join(storageDirectory, document.storageName) : null;
  },

  async removeUploadedFile(id) {
    if (!uuidPattern.test(id)) return;
    await fs.rm(path.join(storageDirectory, id), { force: true });
  },

  async removeDocument(id) {
    const document = documents.get(id);
    if (!document) return;
    documents.delete(id);
    await fs.rm(path.join(storageDirectory, document.storageName), { force: true });
  },
};

module.exports = documentRepository;