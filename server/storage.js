// Este arquivo abstrai o salvamento de arquivos.
// Em produção, você deve usar AWS SDK ou Firebase Admin SDK.

const uploadToStorage = async (file) => {
    // --- MODO REAL (Exemplo AWS S3) ---
    /*
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3();
    const uploadResult = await s3.upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `receipts/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
    }).promise();
    return uploadResult.Location;
    */

    // --- MODO MOCK (Para fins didáticos neste código gerado) ---
    // Em um servidor real sem S3 configurado, isso não funcionaria para persistência a longo prazo.
    console.log(`[STORAGE] Simulando upload do arquivo: ${file.originalname} (${file.size} bytes)`);
    
    // Retornamos uma URL falsa para o banco de dados aceitar
    return `https://fake-storage.com/uploads/${Date.now()}_receipt.jpg`;
};

module.exports = { uploadToStorage };
