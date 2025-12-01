
# Notar - Sistema de Gestão de Notas

## Estrutura do Projeto
- `/src` - Frontend React (Dashboard Cliente e Contabilidade)
- `/server` - Backend Node.js (API e Webhook WhatsApp)

## Como rodar o Frontend (Simulador)
Este modo usa `localStorage` e simula o WhatsApp no navegador.
1. `npm install`
2. `npm start`

## Como rodar o Backend (Produção)
Para receber mensagens reais do WhatsApp e persistir dados:

1. Configure o banco de dados PostgreSQL usando o schema em `src/pages/ArchitectureDocs.tsx`.
2. Renomeie `server/.env.example` para `server/.env` e preencha as chaves.
3. Instale as dependências do servidor:
   ```bash
   cd server
   npm install express pg cors dotenv axios @google/genai
   ```
4. Inicie o servidor:
   ```bash
   node index.js
   ```
5. Use o **Ngrok** para expor sua porta 3001 localmente para a internet (para o WhatsApp enviar o webhook):
   ```bash
   ngrok http 3001
   ```
6. Copie a URL gerada pelo Ngrok e configure no Painel da Meta em "Webhook URL".

## Integração Gemini AI
A chave de API deve ser configurada tanto no `.env` do servidor (para o fluxo via WhatsApp) quanto no ambiente do frontend (se continuar usando o upload manual via web).
