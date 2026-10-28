const { test } = require('node:test');
const assert = require('node:assert');
const documentRepository = require('../src/repositories/documentRepository');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function uploadTestDocument(baseUrl, filename = 'teste.txt', content = 'conteudo de teste') {
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/plain' }), filename);

  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(response.status, 201);
  return response.json();
}

test('faz upload e retorna os metadados do documento', async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let documentId;

  try {
    const uploadedDocument = await uploadTestDocument(baseUrl);
    documentId = uploadedDocument.id;
    assert.strictEqual(uploadedDocument.originalName, 'teste.txt');
    assert.strictEqual(uploadedDocument.size, Buffer.byteLength('conteudo de teste'));
    assert.strictEqual(uploadedDocument.owner, process.env.DMS_DEFAULT_OWNER || 'anonymous');
    assert.ok(Number.isFinite(Date.parse(uploadedDocument.uploadedAt)));
  } finally {
    await closeServer(server);
    if (documentId) await documentRepository.removeDocument(documentId);
  }
});

test('lista os documentos enviados', async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let documentId;

  try {
    const uploadedDocument = await uploadTestDocument(baseUrl);
    documentId = uploadedDocument.id;

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.strictEqual(listResponse.status, 200);
    const listBody = await listResponse.json();
    assert.ok(listBody.documents.some((document) => document.id === documentId));
    assert.ok(!JSON.stringify(listBody).includes('storageName'));
  } finally {
    await closeServer(server);
    if (documentId) await documentRepository.removeDocument(documentId);
  }
});

test('baixa um documento pelo identificador', async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let documentId;

  try {
    const uploadedDocument = await uploadTestDocument(baseUrl);
    documentId = uploadedDocument.id;

    const downloadResponse = await fetch(`${baseUrl}/documents/${documentId}/download`);
    assert.strictEqual(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /filename="?teste\.txt/);
    assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');
  } finally {
    await closeServer(server);
    if (documentId) await documentRepository.removeDocument(documentId);
  }
});

test('retorna erros previsíveis para upload ausente e documento inexistente', async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: new FormData(),
    });
    assert.strictEqual(uploadResponse.status, 400);
    assert.strictEqual((await uploadResponse.json()).error.code, 'FILE_REQUIRED');

    const malformedResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=broken' },
      body: '--broken\r\nContent-Disposition: form-data; name="file"; filename="incompleto.txt"\r\n\r\nsem fechamento',
    });
    assert.strictEqual(malformedResponse.status, 400);
    assert.strictEqual((await malformedResponse.json()).error.code, 'INVALID_UPLOAD');

    const invalidIdResponse = await fetch(`${baseUrl}/documents/not-a-uuid/download`);
    assert.strictEqual(invalidIdResponse.status, 400);
    assert.strictEqual((await invalidIdResponse.json()).error.code, 'INVALID_DOCUMENT_ID');

    const missingResponse = await fetch(
      `${baseUrl}/documents/00000000-0000-4000-8000-000000000000/download`,
    );
    assert.strictEqual(missingResponse.status, 404);
    assert.strictEqual((await missingResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
  } finally {
    await closeServer(server);
  }
});

test('rejeita arquivos acima do limite configurado', async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(documentRepository.maxFileSize + 1)]),
      'grande.bin',
    );

    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
    assert.strictEqual(response.status, 413);
    assert.strictEqual((await response.json()).error.code, 'FILE_TOO_LARGE');
  } finally {
    await closeServer(server);
  }
});
