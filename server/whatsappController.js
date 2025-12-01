
const axios = require('axios');
const { GoogleGenAI } = require("@google/genai");
const db = require('./db');

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

// 1. Verificação do Webhook (Exigido pela Meta)
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
};

// 2. Recebimento de Mensagens
const handleWhatsAppWebhook = async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from; // Número do telefone do cliente

            // Se for imagem
            if (message.type === 'image') {
                try {
                    await sendWhatsAppMessage(from, "Recebi sua imagem! Processando com IA...");
                    
                    // A. Obter URL da imagem
                    const imageId = message.image.id;
                    const mediaUrl = await getMediaUrl(imageId);
                    
                    // B. Baixar Imagem
                    const imageBase64 = await downloadMedia(mediaUrl);

                    // C. Processar com Gemini (OCR)
                    const ocrData = await processWithGemini(imageBase64);

                    // D. Salvar no Banco (Status Pendente)
                    // Aqui você buscaria o user_id baseado no telefone (from)
                    // const userId = await getUserByPhone(from);
                    
                    const savedReceipt = await db.query(
                        `INSERT INTO receipts (image_url, merchant_name, total_amount, status) 
                         VALUES ($1, $2, $3, 'pending_confirmation') RETURNING id`,
                        ['whatsapp_image_id_' + imageId, ocrData.merchantName, ocrData.totalAmount]
                    );

                    // E. Pedir Confirmação
                    const msg = `Lido: ${ocrData.merchantName} - R$ ${ocrData.totalAmount}. Digite SIM para confirmar.`;
                    await sendWhatsAppMessage(from, msg);

                } catch (error) {
                    console.error("Erro no fluxo:", error);
                    await sendWhatsAppMessage(from, "Erro ao processar imagem.");
                }
            }
            
            // Se for Texto (Confirmação)
            else if (message.type === 'text') {
                const text = message.text.body.toLowerCase();
                if (text === 'sim' || text === 's') {
                    // Lógica para confirmar a última nota pendente deste número
                    await sendWhatsAppMessage(from, "Nota confirmada e enviada para contabilidade! ✅");
                    // Update DB status to 'confirmed'
                }
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
};

// --- Helpers ---

async function sendWhatsAppMessage(to, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                text: { body: text }
            },
            { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
        );
    } catch (e) {
        console.error("Erro envio zap:", e.response?.data || e.message);
    }
}

async function getMediaUrl(mediaId) {
    const response = await axios.get(
        `https://graph.facebook.com/v17.0/${mediaId}`,
        { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
    return response.data.url;
}

async function downloadMedia(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
    });
    return Buffer.from(response.data, 'binary').toString('base64');
}

async function processWithGemini(base64Image) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Reutilizar lógica do prompt do frontend aqui
    // ... Implementação simplificada ...
    return { merchantName: "Loja Exemplo", totalAmount: 100.00 }; 
}

module.exports = { verifyWebhook, handleWhatsAppWebhook };
