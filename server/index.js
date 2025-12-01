
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { handleWhatsAppWebhook, verifyWebhook } = require('./whatsappController');
const { processReceipt } = require('./geminiController');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// --- ROTAS PÚBLICAS ---

// Webhook para validação do WhatsApp (Meta)
app.get('/webhook', verifyWebhook);

// Webhook para receber mensagens do WhatsApp
app.post('/webhook', handleWhatsAppWebhook);

// --- ROTAS PRIVADAS (Simulação de Auth Middleware aqui) ---

// Listar Notas (Substitui mockBackend.getReceipts)
app.get('/api/receipts', async (req, res) => {
    try {
        const { role, userId } = req.query;
        let query = 'SELECT * FROM receipts ORDER BY created_at DESC';
        let params = [];

        if (role === 'business' && userId) {
            query = 'SELECT * FROM receipts WHERE user_id = $1 ORDER BY created_at DESC';
            params = [userId];
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar notas' });
    }
});

// Atualizar Nota
app.put('/api/receipts/:id', async (req, res) => {
    try {
        const { status, category } = req.body;
        const { id } = req.params;
        
        const result = await db.query(
            'UPDATE receipts SET status = COALESCE($1, status), category = COALESCE($2, category) WHERE id = $3 RETURNING *',
            [status, category, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar nota' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
