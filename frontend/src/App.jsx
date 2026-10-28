import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      setIsLoading(true);
      setListError('');

      try {
        const result = await listDocuments();
        if (isCurrent) setDocuments(result);
      } catch (error) {
        if (isCurrent) setListError(error.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [refreshVersion]);

  function refreshDocuments() {
    setRefreshVersion((version) => version + 1);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand" href="/" aria-label="DMS, início">
            <span className="brand__mark" aria-hidden="true">D</span>
            <span className="brand__name">DMS</span>
          </a>
          <span className="storage-label">
            <span className="storage-label__dot" aria-hidden="true" />
            Armazenamento local
          </span>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">DOCUMENTOS / ESPAÇO DE TRABALHO</p>
            <h1>Document Management System</h1>
          </div>
          <span className="document-count" aria-live="polite">
            {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
          </span>
        </div>

        <div className="workspace-grid">
          <section className="upload-panel" aria-labelledby="upload-heading">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-heading">Enviar documento</h2>
            </div>
            <UploadComponent onUploadComplete={refreshDocuments} />
          </section>

          <section className="documents-panel" aria-labelledby="documents-heading">
            <div className="section-heading section-heading--list">
              <div className="section-heading__title">
                <span className="section-index">02</span>
                <h2 id="documents-heading">Documentos</h2>
              </div>
              <button
                className="text-button"
                type="button"
                onClick={refreshDocuments}
                disabled={isLoading}
              >
                Atualizar lista
              </button>
            </div>
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              error={listError}
              onRetry={refreshDocuments}
            />
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <span>DOCUMENT MANAGEMENT SYSTEM</span>
        <span>v1.0</span>
      </footer>
    </div>
  );
}
