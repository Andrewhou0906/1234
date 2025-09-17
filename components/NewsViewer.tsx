
import React, { useState, useMemo } from 'react';
import { NEWS_CHANNELS, MOCK_NEWS_DATA } from '../constants';
import type { NewsArticle } from '../types';
import { SearchIcon } from './Icons';

const NewsViewer: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredNews = useMemo(() => {
    let news = activeChannel === 'all'
      ? MOCK_NEWS_DATA
      : MOCK_NEWS_DATA.filter(article => article.channelId === activeChannel);

    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      news = news.filter(article =>
        article.title.toLowerCase().includes(lowercasedQuery) ||
        article.content.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    return news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeChannel, searchQuery]);

  const renderHighlightedText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-300 text-black px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };
  
  const getChannelName = (id: string) => {
      return NEWS_CHANNELS.find(c => c.id === id)?.name || '未知來源';
  }

  return (
    <div className="animate-fade-in">
      {/* Search and Filter Section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋新聞標題或內文關鍵字..."
            className="w-full bg-gray-700 border-2 border-gray-600 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 transition duration-300"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setActiveChannel('all')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${activeChannel === 'all' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              全部
            </button>
          {NEWS_CHANNELS.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${activeChannel === channel.id ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {channel.name}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid Section */}
      {filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map(article => (
            <div key={article.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-xl hover:shadow-yellow-400/20 transform hover:-translate-y-2 transition-all duration-300 flex flex-col">
              <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover" />
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider bg-yellow-400 text-gray-900 px-2 py-1 rounded-full">{getChannelName(article.channelId)}</span>
                    <span className="ml-3 text-sm text-gray-400">{article.date}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 flex-grow">
                  {renderHighlightedText(article.title, searchQuery)}
                </h3>
                <p className="text-gray-400 text-sm">
                  {renderHighlightedText(article.content.substring(0, 100) + '...', searchQuery)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
         <div className="text-center py-16 bg-gray-800 rounded-lg">
            <p className="text-2xl text-gray-400">找不到相關新聞</p>
            <p className="text-gray-500 mt-2">請嘗試更換篩選條件或搜尋關鍵字。</p>
        </div>
      )}
    </div>
  );
};

export default NewsViewer;
