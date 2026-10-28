# Especificação - Document Management System

> Especificação funcional e técnica para orientar a implementação incremental do DMS.

## 1. Objetivo

Entregar uma aplicação web que permita enviar, listar e baixar documentos armazenados exclusivamente no filesystem local, com metadados mantidos em memória nesta fase.

## 2. Escopo

### Dentro do escopo

- Enviar um arquivo pela interface web.
- Listar os documentos disponíveis, mostrando nome original, tamanho e data do envio.
- Baixar um documento pelo identificador.
- Registrar um identificador de proprietário (`owner`) nos metadados como atribuição simples.
- Exibir estados de carregamento, lista vazia e erros nas operações do frontend.

### Fora do escopo

- Armazenamento em nuvem, bancos de dados ou provedores de armazenamento externos.
- Persistência dos metadados após reinício do processo.
- Versionamento, edição, compartilhamento ou exclusão de documentos.
- Autenticação e autorização. O campo `owner` nesta fase não é uma fronteira de segurança nem garante isolamento entre usuários.
- Allowlist de tipos de arquivo, antivírus ou análise do conteúdo enviado.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento pela interface. | Um arquivo enviado como `multipart/form-data`, no campo `file`, é gravado em `backend/storage`; a resposta contém seus metadados. |
| RF-02 | O sistema valida a presença do arquivo e o limite máximo configurado. | Requisição sem arquivo retorna `400`; arquivo acima do limite retorna `413`; nenhuma entrada inválida é registrada nos metadados. |
| RF-03 | O usuário pode listar os documentos registrados durante a execução atual. | A resposta contém os metadados disponíveis; uma lista sem documentos retorna sucesso com array vazio. |
| RF-04 | O usuário pode baixar um documento pelo identificador. | Um identificador existente retorna o conteúdo como anexo com o nome original; identificador inexistente retorna `404`. |
| RF-05 | A interface apresenta o resultado das operações. | Upload, listagem e download comunicam estados de carregamento e erros; a lista vazia tem estado próprio. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são gravados somente no filesystem local em `backend/storage`, usando Multer com `diskStorage`. |
| RNF-02 | Os metadados ficam em memória. Ao reiniciar o backend, a lista e o vínculo entre identificadores e arquivos deixam de existir; arquivos já gravados podem permanecer órfãos no diretório. |
| RNF-03 | A configuração operacional usa variáveis de ambiente, incluindo `PORT`, `MAX_FILE_SIZE` e `DMS_DEFAULT_OWNER`. |
| RNF-04 | O nome recebido do cliente não é usado como nome físico no filesystem. O arquivo é salvo com nome gerado pelo sistema para evitar colisões e traversal de diretório. |
| RNF-05 | Erros de entrada, limite e I/O são tratados nos limites HTTP e retornam respostas previsíveis sem expor caminhos internos ou stack traces. |
| RNF-06 | O backend é JavaScript CommonJS com Express e testes via `node:test`; o frontend é JavaScript ESM com React e Vite. |
| RNF-07 | A implementação segue SOLID, DRY, KISS, YAGNI e a Clean Architecture simples definida neste projeto. |

### Configuração

| Variável | Padrão | Semântica |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `MAX_FILE_SIZE` | `10485760` | Tamanho máximo por arquivo, em bytes (10 MiB). |
| `DMS_DEFAULT_OWNER` | `anonymous` | Valor atribuído ao campo `owner` enquanto não houver autenticação. Não identifica nem autentica uma pessoa. |

O diretório de armazenamento permanece fixo em `backend/storage`, conforme a restrição do projeto; não deve ser substituído por serviço ou provedor externo.

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | UUID gerado pelo backend e usado nas rotas de consulta/download. |
| `originalName` | string | Sim | Nome original fornecido pelo cliente, preservado como metadado e nome sugerido no download. Nunca é o nome físico do arquivo. |
| `size` | number | Sim | Tamanho do arquivo em bytes, informado pelo resultado do upload no servidor. |
| `uploadedAt` | string | Sim | Data e hora do recebimento bem-sucedido, em ISO 8601 UTC. |
| `owner` | string | Sim | Valor de `DMS_DEFAULT_OWNER`; metadado de atribuição, sem controle de acesso. |

Exemplo:

```json
{
  "id": "e82d6e1d-39b1-4efb-8c8a-8094763decd3",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-28T14:30:00.000Z",
  "owner": "anonymous"
}
```

O repositório mantém internamente o vínculo entre `id` e o caminho físico criado sob `backend/storage`; caminhos do filesystem não fazem parte das respostas da API. A listagem desta fase retorna todos os documentos registrados, pois não existe identidade autenticada para filtrar por usuário.

## 6. Contratos de API

As rotas do backend são definidas sem prefixo. Durante o desenvolvimento, o frontend usa o prefixo `/api`; o proxy do Vite remove esse prefixo antes de encaminhar a requisição ao backend.

| Operação | Rota backend | Rota usada pelo frontend |
| --- | --- | --- |
| Enviar | `POST /upload` | `POST /api/upload` |
| Listar | `GET /documents` | `GET /api/documents` |
| Baixar | `GET /documents/:id/download` | `GET /api/documents/:id/download` |

Respostas de erro usam o formato JSON abaixo, com mensagens em português:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

### `POST /upload`

- **Content-Type:** `multipart/form-data`.
- **Campo obrigatório:** `file`, contendo um arquivo. Qualquer tipo de arquivo é aceito nesta fase.
- **Limite:** `MAX_FILE_SIZE` bytes; padrão de 10 MiB.
- **Sucesso:** `201 Created`, corpo JSON com os metadados do documento criado.

```json
{
  "id": "e82d6e1d-39b1-4efb-8c8a-8094763decd3",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-28T14:30:00.000Z",
  "owner": "anonymous"
}
```

- `400 Bad Request`: campo ausente ou requisição multipart inválida (`FILE_REQUIRED` ou `INVALID_UPLOAD`).
- `413 Payload Too Large`: arquivo excede o limite (`FILE_TOO_LARGE`).
- `500 Internal Server Error`: falha ao gravar arquivo ou registrar metadados (`UPLOAD_FAILED`).

### `GET /documents`

- **Sucesso:** `200 OK`, corpo JSON com array `documents`; retorna `[]` quando não há documentos registrados.
- A ordem é da data de envio mais recente para a mais antiga.
- A resposta inclui somente os metadados públicos definidos na seção 5.

```json
{
  "documents": [
    {
      "id": "e82d6e1d-39b1-4efb-8c8a-8094763decd3",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-10-28T14:30:00.000Z",
      "owner": "anonymous"
    }
  ]
}
```

- `500 Internal Server Error`: falha inesperada ao consultar o repositório (`DOCUMENT_LIST_FAILED`).

### `GET /documents/:id/download`

- **Entrada:** `id` UUID do documento.
- **Sucesso:** `200 OK`, conteúdo binário como anexo, com `Content-Disposition` sugerindo `originalName` e `Content-Type: application/octet-stream`.
- O nome usado no cabeçalho deve ser codificado/sanitizado para impedir injeção de cabeçalhos; o caminho físico é resolvido pelo repositório a partir do ID, nunca a partir de entrada de caminho enviada pelo cliente.
- `400 Bad Request`: formato de ID inválido (`INVALID_DOCUMENT_ID`).
- `404 Not Found`: documento não registrado ou arquivo não encontrado (`DOCUMENT_NOT_FOUND`).
- `500 Internal Server Error`: falha de leitura do arquivo (`DOWNLOAD_FAILED`).

## 7. Decisões arquiteturais

### Backend

- Node.js, Express e CommonJS.
- Dependências seguem o fluxo `routes -> controllers -> services -> repositories`.
- `routes/`: registra endpoints e encaminha requisições.
- `controllers/`: interpreta entrada HTTP, valida o básico e traduz resultados/erros em respostas HTTP.
- `services/`: concentra regras de upload, listagem e download sem depender de Express ou Multer.
- `repositories/`: mantém metadados em memória e persiste os arquivos no filesystem local.
- Multer com `diskStorage` grava em `backend/storage`; o nome físico é gerado pelo backend a partir do identificador.
- O upload deve remover o arquivo recém-gravado caso o registro dos metadados falhe, evitando arquivo órfão nesse caminho de erro.
- `GET /health` permanece como endpoint de saúde existente.

### Frontend

- React com componentes funcionais e Hooks, organizado em `components/`, `pages/` e `services/`.
- Comunicação por `fetch` através de `/api`, usando o proxy configurado no Vite em desenvolvimento.
- A interface não é fonte de validação de segurança; as regras e limites são aplicados também no backend.

### Armazenamento e identidade

- Arquivos apenas no diretório local `backend/storage`, por meio de Multer `diskStorage`.
- Metadados apenas em memória nesta fase, sem promessa de persistência após reinício.
- Sem autenticação: `owner` é um placeholder configurável, não dado confiável fornecido pelo cliente. Não há isolamento de acesso por usuário.
- Não persistir arquivos em serviço externo nem introduzir banco de dados ou versionamento nesta fase.

## 8. Plano de execução

As etapas abaixo descrevem implementação futura; esta especificação não executa nem altera arquivos de backend ou frontend.

1. Definir e validar a configuração do backend (`PORT`, `MAX_FILE_SIZE`, `DMS_DEFAULT_OWNER`) e a criação/uso de `backend/storage`.
2. Implementar repositório de arquivos locais com Multer `diskStorage` e repositório de metadados em memória, incluindo geração de ID e tratamento de falha parcial.
3. Implementar serviços, controllers e rotas para upload, listagem e download, mantendo as responsabilidades das camadas.
4. Adicionar testes backend com `node:test` para sucesso, arquivo ausente, limite excedido, ID inválido/inexistente e falhas de persistência/leitura.
5. Implementar o serviço frontend com `fetch` e os componentes de upload, listagem e download, incluindo estados de carregamento, vazio e erro.
6. Integrar frontend e backend via proxy `/api`, validar o fluxo completo e executar os testes e o build do frontend.