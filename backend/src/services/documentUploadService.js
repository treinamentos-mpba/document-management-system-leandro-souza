const DocumentServiceError = require('./documentServiceError');

class DocumentUploadService {
  constructor(documentRepository, owner) {
    this.documentRepository = documentRepository;
    this.owner = owner;
  }

  async createDocument(file) {
    const metadata = {
      id: file.filename,
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: this.owner,
    };

    try {
      return this.documentRepository.create(metadata);
    } catch {
      await this.documentRepository.removeUploadedFile(file.filename).catch(() => {});
      throw new DocumentServiceError(500, 'UPLOAD_FAILED', 'Não foi possível gravar o documento.');
    }
  }
}

module.exports = DocumentUploadService;