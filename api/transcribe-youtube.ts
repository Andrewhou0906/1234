import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import ytdl from 'ytdl-core';

const MAX_VIDEO_DURATION_SECONDS = 600; // 10 minutes

const streamToBuffer = (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (error) => reject(new Error(`Stream error: ${error.message}`)));
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url } = req.body;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: '無效或遺失 YouTube 連結' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const duration = parseInt(info.videoDetails.lengthSeconds, 10);
    
    if (duration > MAX_VIDEO_DURATION_SECONDS) {
        return res.status(400).json({ error: `影片長度超過 ${MAX_VIDEO_DURATION_SECONDS / 60} 分鐘限制。` });
    }

    const audioFormat = ytdl.chooseFormat(info.formats, { 
      filter: 'audioonly',
      quality: 'lowestaudio' 
    });

    if (!audioFormat) {
      return res.status(400).json({ error: '找不到此影片的音訊格式。' });
    }

    const audioStream = ytdl(url, { format: audioFormat });
    const audioBuffer = await streamToBuffer(audioStream);
    const audioBase64 = audioBuffer.toString('base64');

    if (!process.env.API_KEY) {
        throw new Error('API_KEY environment variable is not set.');
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const audioPart = {
      inlineData: {
        data: audioBase64,
        // ytdl-core often provides audio in an mp4 container. Mime type audio/mp4 is suitable.
        mimeType: 'audio/mp4',
      },
    };
    
    const prompt = "這是一段音訊，請將其內容完整地轉錄為繁體中文的逐字稿。請盡可能區分不同的說話者，例如使用 \"發言者1\"、\"發言者2\" 等標籤。";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{text: prompt}, audioPart] },
    });

    const transcript = response.text;
    
    return res.status(200).json({ transcript });

  } catch (error) {
    console.error('[transcribe-youtube] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (errorMessage.toLowerCase().includes("api key") || errorMessage.includes('API_KEY')) {
        return res.status(500).json({ error: '伺服器 API 金鑰設定錯誤。'});
    }
    
    if(errorMessage.toLowerCase().includes("resource has been exhausted")){
         return res.status(413).json({ error: '影片檔案過大，無法處理。' });
    }

    return res.status(500).json({ error: '處理 YouTube 影片時發生錯誤。', details: errorMessage });
  }
}