---
name: verificar-integracao-api
description: 'Confere se um fluxo da API DMS está consistente entre especificação, backend, frontend e testes.'
argument-hint: 'Informe o endpoint ou fluxo a verificar, por exemplo: POST /upload.'
agent: agent
tools: ['read', 'search']
---

# Verificar integração da API DMS

Revise o fluxo `${input:fluxo:endpoint ou fluxo}` sem modificar arquivos.

1. Consulte `docs/specs/dms-spec.md` e as instruções do projeto para estabelecer o contrato esperado.
2. Rastreie o fluxo correspondente no backend (`routes`, `controllers`, `services`, `repositories`) e no cliente React em `frontend/src/services` e componentes envolvidos.
3. Compare método e caminho HTTP, prefixo `/api`, campo/formato da entrada, formato de sucesso, erros/status e comportamento visível na interface.
4. Consulte os testes existentes e indique comportamentos importantes sem cobertura. Não afirme que testes foram executados.
5. Reporte somente divergências ou lacunas com evidência em arquivos e linhas. Não proponha mudanças fora do escopo atual de armazenamento local e metadados em memória.

## Formato da resposta

- **Resultado:** consistente, divergente ou parcialmente coberto.
- **Fluxo rastreado:** caminho entre frontend e backend.
- **Achados:** cada item com severidade, referência de arquivo/linha, contrato esperado versus observado e sugestão mínima.
- **Lacunas de teste:** casos relevantes ausentes, se houver.
- Se não houver divergências, declare isso e identifique o que foi conferido.