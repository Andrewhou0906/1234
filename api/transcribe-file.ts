import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Note: Vercel's Hobby plan has a default body size limit of 4.5MB for serverless functions.
// This function will fail for files larger than that.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fileData, mimeType } = req.body;

  if (!fileData || !mimeType) {
    return res.status(400).json({ error: '遺失檔案資料或 MIME 類型。' });
  }

  try {
    if (!process.env.API_KEY) {
      throw new Error('API_KEY environment variable is not set.');
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const audioOrVideoPart = {
      inlineData: {
        data: fileData,
        mimeType: mimeType,
      },
    };
    
    const prompt = "這是一段影音檔案，請將其內容完整地轉錄為繁體中文的逐字稿。請盡可能區分不同的說話者，例如使用 \"發言者1\"、\"發言者2\" 等標籤。";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{text: prompt}, audioOrVideoPart] },
    });

    const transcript = response.text;
    
    return res.status(200).json({ transcript });

  } catch (error) {
    console.error('[transcribe-file] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (errorMessage.toLowerCase().includes("api key") || errorMessage.includes('API_KEY')) {
        return res.status(500).json({ error: '伺服器 API 金鑰設定錯誤。'});
    }
    
    // This error can mean the file is too large for the Gemini API itself or the Vercel function payload limit was hit.
    if(errorMessage.toLowerCase().includes("resource has been exhausted") || errorMessage.toLowerCase().includes("request entity too large")){
         return res.status(413).json({ error: '檔案過大，無法處理。請上傳小於 4.5MB 的檔案。' });
    }

    return res.status(500).json({ error: '處理檔案時發生錯誤。', details: errorMessage });
  }
}