import React from 'react';
import { ConnectionDetails } from '../types';

interface HeaderProps {
  connection: ConnectionDetails | null;
  onDisconnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ connection, onDisconnect }) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">PG Slow Query Analyzer</h1>
            {connection && (
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>{connection.user}@{connection.host}:{connection.port}/{connection.database}</span>
              </div>
            )}
          </div>
        </div>
        
        {connection && (
          <button 
            onClick={onDisconnect}
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Disconnect</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;