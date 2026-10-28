const multer = require('multer');

function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    return response.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
        message: tooLarge
          ? 'O arquivo excede o tamanho máximo permitido.'
          : 'O envio do arquivo é inválido.',
      },
    });
  }

  if (request.method === 'POST' && request.path === '/upload' && !error.code && !error.status) {
    return response.status(400).json({
      error: {
        code: 'INVALID_UPLOAD',
        message: 'O envio do arquivo é inválido.',
      },
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const message = status < 500 ? error.message : 'Ocorreu um erro interno no servidor.';

  return response.status(status).json({ error: { code, message } });
}

module.exports = errorHandler;