
import React, { useState } from 'react';
import NewsViewer from './components/NewsViewer';
import VideoTranscriber from './components/VideoTranscriber';

type View = 'news' | 'transcriber';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('news');

  const navButtonClasses = "px-6 py-3 text-lg font-semibold rounded-t-lg transition-colors duration-300 focus:outline-none";
  const activeNavButtonClasses = "bg-gray-800 text-yellow-400";
  const inactiveNavButtonClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            記者<span className="text-yellow-400">萬事通</span>
          </h1>
          <p className="text-gray-400 mt-2 text-xl">您的全方位新聞工作輔助平台</p>
        </header>

        <nav className="flex justify-center border-b border-gray-700 mb-8">
          <button
            onClick={() => setCurrentView('news')}
            className={`${navButtonClasses} ${currentView === 'news' ? activeNavButtonClasses : inactiveNavButtonClasses}`}
          >
            新聞總覽
          </button>
          <button
            onClick={() => setCurrentView('transcriber')}
            className={`${navButtonClasses} ${currentView === 'transcriber' ? activeNavButtonClasses : inactiveNavButtonClasses}`}
          >
            影片轉逐字稿
          </button>
        </nav>

        <main>
          {currentView === 'news' && <NewsViewer />}
          {currentView === 'transcriber' && <VideoTranscriber />}
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} 記者萬事通. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
