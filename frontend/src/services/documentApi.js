const API_PREFIX = '/api';

async function getErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function requestJson(path, options) {
  const response = await fetch(`${API_PREFIX}${path}`, options);
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export async function listDocuments() {
  const result = await requestJson('/documents');
  return result.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  return requestJson('/upload', { method: 'POST', body: formData });
}

function getDownloadFilename(contentDisposition) {
  if (!contentDisposition) return 'documento';

  const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedName) {
    try {
      return decodeURIComponent(encodedName.replace(/^"|"$/g, ''));
    } catch {
      return 'documento';
    }
  }

  return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || 'documento';
}

export async function downloadDocument(id) {
  const response = await fetch(`${API_PREFIX}/documents/${encodeURIComponent(id)}/download`);
  if (!response.ok) throw new Error(await getErrorMessage(response));

  return {
    blob: await response.blob(),
    filename: getDownloadFilename(response.headers.get('Content-Disposition')),
  };
}