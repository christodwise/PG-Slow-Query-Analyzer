import React, { useEffect, useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-600">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Performance Analysis
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Analyzing Query</h4>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-32">
              {queryStat.query}
            </div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-red-400 font-semibold">Mean Time: {queryStat.mean_time.toFixed(2)}ms</span>
              <span className="text-blue-400">Reads: {queryStat.shared_blks_read}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-purple-300 animate-pulse">Consulting Gemini AI Engine...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
               <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700/50">
                  <h4 className="text-purple-400 font-medium mb-4">Optimization Report</h4>
                  <div className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
                    {analysis}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;