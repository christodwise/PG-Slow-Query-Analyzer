import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { QueryStat } from '../types';
import { analyzeQuery } from '../services/geminiService';

interface AnalysisModalProps {
  queryStat: QueryStat;
  onClose: () => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ queryStat, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalysis = async () => {
      const result = await analyzeQuery(queryStat);
      if (isMounted) {
        setAnalysis(result);
        setLoading(false);
      }
    };

    fetchAnalysis();

    return () => {
      isMounted = false;
    };
  }, [queryStat]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              AI Performance Analysis
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 rounded-full transition-all duration-200 hover:rotate-90"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Target Query
            </h4>
            <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-700/50 font-mono text-sm text-blue-100 whitespace-pre-wrap overflow-x-auto max-h-40 shadow-inner">
              {queryStat.query}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-semibold">Mean Time: {queryStat.mean_time.toFixed(2)}ms</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 text-blue-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <span className="font-semibold">Reads: {queryStat.shared_blks_read}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-purple-300 font-medium animate-pulse flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                Consulting Gemini AI Engine...
              </p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none animate-fade-in-up">
              <div className={`p-6 rounded-xl border shadow-lg ${analysis?.includes('Error: API Key not found') ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
                <h4 className={`font-bold text-lg mb-4 flex items-center gap-2 ${analysis?.includes('Error: API Key not found') ? 'text-red-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400'}`}>
                  {analysis?.includes('Error: API Key not found') ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Configuration Error
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Optimization Report
                    </>
                  )}
                </h4>
                <div className="text-slate-300 text-sm leading-relaxed font-light tracking-wide">
                  <ReactMarkdown
                    components={{
                      h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 mb-4" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 mb-4" {...props} />,
                      li: ({ node, ...props }) => <li className="text-slate-300" {...props} />,
                      code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <div className="bg-slate-900 rounded-lg p-4 my-4 border border-slate-700 overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </div>
                        ) : (
                          <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-purple-300 font-mono text-xs" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {analysis || ''}
                  </ReactMarkdown>
                </div>
                {analysis?.includes('Error: API Key not found') && (
                  <div className="mt-4 pt-4 border-t border-red-500/20">
                    <p className="text-sm text-red-300 mb-2">Please configure your Gemini API Key in the settings.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex justify-end backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-white font-medium rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500 hover:shadow-lg"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;