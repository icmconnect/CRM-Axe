/**
 * Converte um arquivo em Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

export interface DadosComprovante {
  valor: number;
  data: string;
  descricao: string;
}

/**
 * Envia a imagem do comprovante para o backend para extrair dados via Gemini
 */
export async function extrairDadosComprovante(file: File): Promise<DadosComprovante> {
  try {
    const base64data = await fileToBase64(file);
    const mimeType = file.type;

    const response = await fetch('/api/gemini/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64data, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao processar comprovante no servidor.');
    }

    const data = await response.json();
    return {
      valor: Number(data.valor) || 0,
      data: data.data || new Date().toISOString().split('T')[0],
      descricao: data.descricao || '',
    };
  } catch (error) {
    console.error('Erro na extração de comprovante:', error);
    throw error;
  }
}
