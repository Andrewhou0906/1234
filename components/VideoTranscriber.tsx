import React, { useState, useRef } from 'react';
import { UploadIcon, LinkIcon, SpinnerIcon, CopyIcon } from './Icons';

type InputType = 'url' | 'file';

// Helper function to read a file and convert it to a Base64 string.
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};


const VideoTranscriber: React.FC = () => {
  const [inputType, setInputType] = useState<InputType>('url');
  const [urlValue, setUrlValue] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
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
    setIsCopied(false);

    try {
      let response: Response;

      if (inputType === 'url') {
        response = await fetch('/api/transcribe-youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlValue }),
        });
      } else { // 'file' input type
        if (!file) {
            throw new Error("請選擇一個檔案。");
        }
        // Vercel's Hobby plan has a 4.5MB request body limit. Check on client-side for better UX.
        if (file.size > 4.5 * 1024 * 1024) {
            throw new Error("檔案大小超過 4.5MB 限制，無法上傳。");
        }
        const fileData = await fileToBase64(file);
        response = await fetch('/api/transcribe-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileData, mimeType: file.type }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '從伺服器取得逐字稿時發生錯誤。');
      }
      setTranscript(data.transcript);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (errorMessage.includes('Failed to fetch')) {
        setError('無法連接到後端服務，請檢查網路連線或稍後再試。');
      } else {
        setError(`轉換失敗：${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
      if (transcript) {
          navigator.clipboard.writeText(transcript);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
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
      setIsCopied(false);
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
              <span className="text-xs mt-1">(支援常見影音格式，上限 4.5MB)</span>
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-white">轉換結果</h3>
            {transcript && (
              <button
                onClick={handleCopy}
                className="bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                aria-label="複製逐字稿"
              >
                <CopyIcon className="h-5 w-5" />
                <span>{isCopied ? '已複製！' : '複製'}</span>
              </button>
            )}
          </div>
          
          {isLoading && !transcript && (
              <div className="text-center py-8">
                  <SpinnerIcon className="h-12 w-12 mx-auto text-yellow-400"/>
                  <p className="mt-4 text-gray-400">AI 正在處理您的檔案，請稍候...</p>
                  <p className="text-sm text-gray-500 mt-1">處理時間依檔案大小而定，可能需要幾分鐘。</p>
              </div>
          )}
          {transcript && (
            <div className="bg-gray-900 p-6 rounded-lg whitespace-pre-wrap text-gray-300 font-mono leading-relaxed max-h-96 overflow-y-auto" role="document" aria-label="影片逐字稿">
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoTranscriber;