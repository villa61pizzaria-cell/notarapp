require('dotenv').config();
const express = require('express');
const http = require('http'); // Necessário para WebSockets
const { Server } = require('socket.io'); // Real-time
const cors = require('cors');
const multer = require('multer'); // Para processar upload de arquivos
const { GoogleGenAI } = require("@google/genai");
const db = require('./db');
const { uploadToStorage } = require('./storage'); // Abstração do S3/Firebase

const app = express();
const server = http.createServer(app); // Servidor HTTP acoplado
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT"]
  }
});

const PORT = process.env.PORT || 3001;

// Configuração do Multer (Upload temporário na memória antes de ir pro S3)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// --- WEBSOCKETS (Tempo Real) ---
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);
  socket.on('join_room', (room) => socket.join(room));
  socket.on('disconnect', () => console.log('Cliente desconectado'));
});

// --- ROTAS DA API ---

// 1. POST /api/notes/upload (Upload Inicial + OCR)
app.post('/api/notes/upload', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const imageUrl = await uploadToStorage(file);

    // Call OCR Service
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = "Analise esta imagem ou PDF. Extraia JSON { merchantName, totalAmount, date, cnpj }.";
    
    // Passa o mimetype correto (pode ser application/pdf ou image/...)
    const result = await model.generateContent([
        prompt, { inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype } }
    ]);
    
    // Parse result (Mocking safe parse here)
    const rawText = result.response.text();
    let ocrData = {};
    try {
        ocrData = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch(e) { ocrData = { rawText }; }

    // Save as Pending
    const newReceipt = await db.query(
      `INSERT INTO receipts (user_id, image_url, merchant_name, total_amount, status, ocr_data)
       VALUES ($1, $2, $3, $4, 'pending_confirmation', $5)
       RETURNING *`,
      [userId, imageUrl, ocrData.merchantName, ocrData.totalAmount, JSON.stringify(ocrData)]
    );

    res.json(newReceipt.rows[0]);

  } catch (error) {
    console.error("Erro upload:", error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// 2. PUT /api/notes/:id/confirm (Confirmação do Cliente)
app.put('/api/notes/:id/confirm', async (req, res) => {
    try {
        const { id } = req.params;
        const { merchantName, totalAmount, category, date, cnpj, notes, installments } = req.body;

        const result = await db.query(
            `UPDATE receipts 
             SET status = 'confirmed', 
                 merchant_name = $1, 
                 total_amount = $2, 
                 category = $3,
                 date_emission = $4,
                 cnpj = $5,
                 notes = $6,
                 installments = $7
             WHERE id = $8 RETURNING *`,
            [merchantName, totalAmount, category, date, cnpj, notes, JSON.stringify(installments), id]
        );

        // Notify Accountant Room
        io.to('accounting_office').emit('new_receipt_confirmed', result.rows[0]);

        // Auto-create chat message
        await db.query(
            `INSERT INTO messages (user_id, sender_role, content, receipt_id, type)
             VALUES ($1, 'system', 'Nota confirmada e enviada para análise.', $2, 'text')`,
            [result.rows[0].user_id, id]
        );

        res.json(result.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// 3. PUT /api/notes/:id/edit (Edição pelo Contador)
app.put('/api/notes/:id/edit', async (req, res) => {
    // Similar to confirm, but allows status change to 'processed'
    // Implementation omitted for brevity, follows same pattern
    res.json({ message: "Editado com sucesso" });
});

// 4. GET /api/notes (Filtros Avançados)
app.get('/api/notes', async (req, res) => {
    const { companyId, status, category, from, to } = req.query;
    // Build dynamic SQL query based on params
    // SELECT * FROM receipts WHERE ...
    res.json([]); // Mock response
});

// 5. POST /api/conversations/:id/messages (Chat Interno)
app.post('/api/conversations/:id/messages', async (req, res) => {
    const { content, senderId, type } = req.body;
    // Insert into messages table
    res.json({ success: true });
});

// 6. POST /api/ocr/parse (OCR avulso se necessário)
app.post('/api/ocr/parse', async (req, res) => {
    // Logic to re-run OCR on existing image URL
    res.json({ success: true });
});

// 7. POST /api/export/notes (Exportação)
app.post('/api/export/notes', async (req, res) => {
    // Logic to generate CSV/Excel and return download URL
    res.json({ downloadUrl: "https://..." });
});

server.listen(PORT, () => {
  console.log(`API Notar 2.0 rodando na porta ${PORT}`);
});