import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';
import formatFileSize from '../services/formatFileSize.js';

export default function UploadComponent({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  function selectFile(event) {
    setFile(event.target.files?.[0] || null);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const uploadedDocument = await uploadDocument(file);
      setSuccess(`"${uploadedDocument.originalName}" enviado com sucesso.`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onUploadComplete();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="document-file">Arquivo</label>
      <input
        ref={inputRef}
        className="file-input"
        id="document-file"
        name="file"
        type="file"
        onChange={selectFile}
        disabled={isUploading}
      />
      {file && (
        <p className="selected-file" aria-live="polite">
          <span className="selected-file__name">{file.name}</span>
          <span>{formatFileSize(file.size)}</span>
        </p>
      )}
      <button className="primary-button" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      {error && <p className="form-message form-message--error" role="alert">{error}</p>}
      {success && <p className="form-message form-message--success" role="status">{success}</p>}
    </form>
  );
}