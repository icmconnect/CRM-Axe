import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// CORS Middleware specifically for this endpoint
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { base64data, mimeType } = req.body;

    // 1. Validar se ambos os campos existem
    if (!base64data || !mimeType) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // 2. Chave de API de variável de ambiente
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    // 3. Inicializar o cliente do SDK oficial conforme as diretrizes
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // 4. Implementar timeout de 15 segundos para a chamada da API
    const apiCall = ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            data: base64data,
            mimeType: mimeType,
          },
        },
        {
          text: 'Extraia os seguintes dados deste comprovante de pagamento/transferência e retorne APENAS um JSON válido: {"valor": numero, "data": "YYYY-MM-DD", "descricao": "texto curto"}'
        }
      ],
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout de 15 segundos atingido na API do Gemini')), 15000);
    });

    // Corrida entre a chamada da API e o timeout
    const response = await Promise.race([apiCall, timeoutPromise]);

    const text = response.text || '';
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const parsedData = JSON.parse(cleanText);

      // Garantir tipagem e valores válidos
      const resultado = {
        valor: typeof parsedData.valor === 'number' ? parsedData.valor : Number(parsedData.valor) || 0,
        data: typeof parsedData.data === 'string' ? parsedData.data : '',
        descricao: typeof parsedData.descricao === 'string' ? parsedData.descricao : ''
      };

      return res.json(resultado);
    } catch (parseErr) {
      console.error('Erro ao fazer parse do JSON do Gemini:', cleanText, parseErr);
      return res.status(500).json({ error: 'Falha ao processar comprovante' });
    }

  } catch (err: any) {
    console.error('Erro no processamento de OCR:', err);
    return res.status(500).json({ error: 'Falha ao processar comprovante' });
  }
});

export default router;
