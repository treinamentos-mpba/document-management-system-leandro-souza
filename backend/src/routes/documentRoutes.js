const express = require('express');
const multer = require('multer');
const documentRepository = require('../repositories/documentRepository');
const { owner } = require('../config/uploadConfig');
const DocumentServiceError = require('../services/documentServiceError');
const DocumentQueryService = require('../services/documentQueryService');
const DocumentUploadService = require('../services/documentUploadService');
const createDocumentController = require('../controllers/documentController');

const router = express.Router();
const documentController = createDocumentController({
  documentUploadService: new DocumentUploadService(documentRepository, owner),
  documentQueryService: new DocumentQueryService(documentRepository),
});
const parseUpload = uploadMiddleware();

function uploadMiddleware() {
  return multer({
    storage: documentRepository.storage,
    limits: {
      fileSize: documentRepository.maxFileSize,
      files: 1,
      fields: 0,
    },
  }).single('file');
}

router.post('/upload', (request, response, next) => {
  parseUpload(request, response, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) return next(error);
    if (!error.code && !error.status) {
      return next(new DocumentServiceError(400, 'INVALID_UPLOAD', 'O envio do arquivo é inválido.'));
    }
    return next(new DocumentServiceError(500, 'UPLOAD_FAILED', 'Não foi possível gravar o documento.'));
  });
}, documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;