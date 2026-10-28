import DownloadButton from './DownloadButton.jsx';
import formatFileSize from '../services/formatFileSize.js';

function formatUploadedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  if (isLoading) {
    return <p className="list-state" role="status">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-state list-state--error" role="alert">
        <p>{error}</p>
        <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__index" aria-hidden="true">00</span>
        <p>Nenhum documento disponível.</p>
      </div>
    );
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-row" key={document.id}>
          <div className="document-row__details">
            <span className="document-row__name" title={document.originalName}>
              {document.originalName}
            </span>
            <span className="document-row__meta">
              {formatFileSize(document.size)} <span aria-hidden="true">/</span> {formatUploadedAt(document.uploadedAt)}
            </span>
          </div>
          <DownloadButton document={document} />
        </li>
      ))}
    </ul>
  );
}