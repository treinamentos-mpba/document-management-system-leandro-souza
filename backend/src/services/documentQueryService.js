const { isValidDocumentId } = require('../utils/documentId');
const DocumentServiceError = require('./documentServiceError');

class DocumentQueryService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  listDocuments() {
    return this.documentRepository.list();
  }

  getDocumentForDownload(id) {
    if (!isValidDocumentId(id)) {
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

module.exports = DocumentQueryService;