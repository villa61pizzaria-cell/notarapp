import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "../types";

// Helper to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result?.toString().replace(/^data:(.*,)?/, "");
      if (encoded && (encoded.length % 4) > 0) {
        encoded += '='.repeat(4 - (encoded.length % 4));
      }
      resolve(encoded || "");
    };
    reader.onerror = (error) => reject(error);
  });
};

const SYSTEM_PROMPT = `
  Você é um assistente especialista em contabilidade e OCR para o sistema NOTAR.
  Sua tarefa é analisar imagens ou PDFs de Notas Fiscais e gerar um objeto estruturado.
  
  ATENÇÃO AO PARCELAMENTO:
  - Procure explicitamente por tabelas de "Fatura", "Duplicatas", "Vencimentos" ou "Parcelas".
  - Se encontrar, extraia cada parcela com seu número, data de vencimento e valor.
  
  REGRAS DE EXTRAÇÃO:
  1. Extraia dados brutos para o objeto 'ocr'.
  2. Gere um resumo limpo para o objeto 'summary'.
  3. Sugira uma categoria contábil.
  4. Identifique o CNPJ do fornecedor.
  5. Calcule um score de confiança.
`;

export const analyzeReceipt = async (base64Data: string, mimeType: string = 'image/jpeg'): Promise<Partial<ReceiptData>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Analise esta nota fiscal. Se houver tabela de parcelas/vencimentos, extraia no array 'installments'."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            installments: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        number: { type: Type.STRING },
                        date: { type: Type.STRING },
                        amount: { type: Type.NUMBER }
                    }
                }
            },
            ocr: {
              type: Type.OBJECT,
              properties: {
                cnpjDetected: { type: Type.STRING },
                dateDetected: { type: Type.STRING },
                totalDetected: { type: Type.NUMBER },
                rawText: { type: Type.STRING }
              }
            },
            summary: {
              type: Type.OBJECT,
              properties: {
                cnpj: { type: Type.STRING },
                date: { type: Type.STRING },
                total: { type: Type.NUMBER },
                itemsCount: { type: Type.INTEGER },
                category: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      
      return {
        ocrConfidence: data.confidenceScore || 0.95,
        confidenceScore: data.confidenceScore || 0.95,
        merchantName: data.merchantName,
        totalAmount: data.summary?.total || data.ocr?.totalDetected,
        date: data.summary?.date || data.ocr?.dateDetected,
        cnpj: data.summary?.cnpj || data.ocr?.cnpjDetected,
        category: data.summary?.category || "Outros",
        installments: data.installments || [],
        ocr: data.ocr,
        summary: data.summary
      };
    }
    
    throw new Error("Não foi possível extrair dados.");

  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
};