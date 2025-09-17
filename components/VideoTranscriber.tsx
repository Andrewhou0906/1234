
import React, { useState, useRef } from 'react';
import { UploadIcon, LinkIcon, SpinnerIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';

type InputType = 'url' | 'file';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read file as data URL"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  const data = await base64EncodedDataPromise;
  return {
    inlineData: { data, mimeType: file.type },
  };
};


const VideoTranscriber: React.FC = () => {
  const [inputType, setInputType] = useState<InputType>('file');
  const [urlValue, setUrlValue] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setTranscript('');
      setError('');
    }
  };

  const handleTranscribe = async () => {
    if ((inputType === 'url' && !urlValue.trim()) || (inputType === 'file' && !file)) {
      setError('請提供影片連結或上傳檔案。');
      return;
    }

    setIsLoading(true);
    setTranscript('');
    setError('');

    if (inputType === 'url') {
      setError('YouTube 連結轉換功能需要後端伺服器支援，目前暫不提供。請使用檔案上傳功能。');
      setIsLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      if (file) {
        const videoPart = await fileToGenerativePart(file);
        const prompt = "請將這段影片轉為逐字稿。如果可能，請標示出不同的發言者（例如：發言者A、發言者B）。";
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt}, videoPart] },
        });

        setTranscript(response.text);
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (errorMessage.toLowerCase().includes("api key")) {
        setError('轉換失敗：API 金鑰無效或未設定。請檢查您在 Vercel 上的環境變數設定。');
      } else {
        setError('轉換失敗，可能影片格式不支援或檔案過大，請稍後再試。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputTypeButtonClasses = "px-5 py-3 w-full text-center font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2";
  const activeInputTypeClasses = "bg-yellow-400 text-gray-900 shadow-lg";
  const inactiveInputTypeClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";

  const resetState = () => {
      setUrlValue('');
      setFile(null);
      setFileName('');
      setTranscript('');
      setError('');
  }

  const handleTypeChange = (type: InputType) => {
      setInputType(type);
      resetState();
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => handleTypeChange('url')} className={`${inputTypeButtonClasses} ${inputType === 'url' ? activeInputTypeClasses : inactiveInputTypeClasses}`}>
            <LinkIcon /> YouTube 連結
          </button>
          <button onClick={() => handleTypeChange('file')} className={`${inputTypeButtonClasses} ${inputType === 'file' ? activeInputTypeClasses : inactiveInputTypeClasses}`}>
            <UploadIcon /> 上傳檔案
          </button>
        </div>

        {inputType === 'url' ? (
          <input
            type="text"
            value={urlValue}
            onChange={(e) => { setUrlValue(e.target.value); setError(''); }}
            placeholder="請在此貼上 YouTube 影片連結"
            className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 transition duration-300"
          />
        ) : (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="video/*,audio/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg p-8 text-gray-400 hover:border-yellow-500 hover:text-yellow-500 transition duration-300 flex flex-col items-center justify-center"
            >
              <UploadIcon className="h-12 w-12 mb-2" />
              <span>{fileName || '點擊以選擇影片或音訊檔案'}</span>
              <span className="text-xs mt-1">(支援常見影音格式)</span>
            </button>
          </div>
        )}

        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        
        <div className="mt-6 text-center">
            <button
                onClick={handleTranscribe}
                disabled={isLoading}
                className="bg-yellow-400 text-gray-900 font-bold py-4 px-12 rounded-full text-lg hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 flex items-center justify-center mx-auto"
            >
                {isLoading ? (
                <>
                    <SpinnerIcon className="h-6 w-6 mr-3" />
                    轉換中...
                </>
                ) : (
                '開始轉換逐字稿'
                )}
            </button>
        </div>
      </div>

      {(isLoading || transcript) && (
        <div className="mt-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-4">轉換結果</h3>
          {isLoading && (
              <div className="text-center py-8">
                  <SpinnerIcon className="h-12 w-12 mx-auto text-yellow-400"/>
                  <p className="mt-4 text-gray-400">AI 正在處理您的檔案，請稍候...</p>
                  <p className="text-sm text-gray-500 mt-1">處理時間依檔案大小而定，可能需要幾分鐘。</p>
              </div>
          )}
          {transcript && (
            <div className="bg-gray-900 p-6 rounded-lg whitespace-pre-wrap text-gray-300 font-mono leading-relaxed max-h-96 overflow-y-auto">
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoTranscriber;
