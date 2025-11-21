import React from 'react';
import { ConnectionDetails } from '../types';

interface HeaderProps {
  connection: ConnectionDetails | null;
  onDisconnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ connection, onDisconnect }) => {
  return (
    <header className="glass-header sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
              PG Slow Query Analyzer
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Database Performance Monitor</p>
          </div>
        </div>

        {connection && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
              <span className="font-mono">{connection.user}@{connection.host}:{connection.port}/{connection.database}</span>
            </div>

            <button
              onClick={onDisconnect}
              className="text-sm font-semibold text-slate-400 hover:text-white transition-all duration-300 flex items-center gap-2 bg-slate-800/50 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent px-4 py-2 rounded-lg group"
            >
              <svg className="w-4 h-4 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;