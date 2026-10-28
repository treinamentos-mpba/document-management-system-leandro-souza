const DocumentServiceError = require('../services/documentServiceError');

function createDocumentController({ documentUploadService, documentQueryService }) {
  return {
    upload: async (request, response, next) => {
      if (!request.file) {
        return next(new DocumentServiceError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.'));
      }

      try {
        const document = await documentUploadService.createDocument(request.file);
        return response.status(201).json(document);
      } catch (error) {
        return next(error);
      }
    },

    list: (_request, response, next) => {
      try {
        return response.status(200).json({ documents: documentQueryService.listDocuments() });
      } catch (error) {
        return next(new DocumentServiceError(500, 'DOCUMENT_LIST_FAILED', 'Não foi possível listar os documentos.'));
      }
    },

    download: (request, response, next) => {
      let download;

      try {
        download = documentQueryService.getDocumentForDownload(request.params.id);
      } catch (error) {
        return next(error);
      }

      return response.download(
        download.filePath,
        download.document.originalName,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff',
          },
        },
        (error) => {
          if (!error) return;
          if (response.headersSent) return response.destroy(error);

          if (error.code === 'ENOENT') {
            return next(new DocumentServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.'));
          }

          return next(new DocumentServiceError(500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.'));
        },
      );
    },
  };
}

module.exports = createDocumentController;