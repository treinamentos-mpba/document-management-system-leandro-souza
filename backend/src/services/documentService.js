const { owner } = require('../config/uploadConfig');

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class DocumentServiceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  async createDocument(file) {
    const metadata = {
      id: file.filename,
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
    };

    try {
      return this.documentRepository.create(metadata);
    } catch (error) {
      await this.documentRepository.removeUploadedFile(file.filename).catch(() => {});
      throw new DocumentServiceError(500, 'UPLOAD_FAILED', 'Não foi possível gravar o documento.');
    }
  }

  listDocuments() {
    return this.documentRepository.list();
  }

  getDocumentForDownload(id) {
    if (!uuidPattern.test(id)) {
      throw new DocumentServiceError(400, 'INVALID_DOCUMENT_ID', 'O identificador do documento é inválido.');
    }

    const document = this.documentRepository.findById(id);
    const filePath = this.documentRepository.getFilePath(id);

    if (!document || !filePath) {
      throw new DocumentServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    return { document, filePath };
  }
}

module.exports = { DocumentService, DocumentServiceError };