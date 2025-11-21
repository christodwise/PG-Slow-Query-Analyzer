import React, { useEffect, useState } from 'react';
import { ConnectionDetails, QueryStat, Snapshot } from '../types';
import { startMonitoring, stopMonitoring, getMonitoringStatus } from '../services/historyService';
import AnalysisModal from './AnalysisModal';
import QueryTable from './QueryTable';

interface DashboardProps {
  connection: ConnectionDetails;
  onDisconnect: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ connection, onDisconnect }) => {
  const [queries, setQueries] = useState<QueryStat[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedQuery, setSelectedQuery] = useState<QueryStat | null>(null);
  const [refreshTimer, setRefreshTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modes: Live, Monitoring, Daily Top
  const [mode, setMode] = useState<'live' | 'monitoring' | 'daily-top'>('live');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<any[]>([]); // Use SystemMetric type if imported

  // Initial Load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (connection) {
          const { fetchPgStatStatements } = await import('../services/pgService');
          console.log('Fetching real queries...');
          const realQueries = await fetchPgStatStatements(connection);
          console.log('Fetched queries:', realQueries);
          setQueries(realQueries);
        }
      } catch (err: any) {
        setError(`Failed to connect to database (${err.message}).`);
        setQueries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [connection]);

  // Auto-refresh timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTimer((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshTimer(60);
    setLastUpdated(new Date());
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (connection) {
          const { fetchPgStatStatements } = await import('../services/pgService');
          const realQueries = await fetchPgStatStatements(connection);
          setQueries(realQueries);
        }
      } catch (err: any) {
        setError(`Failed to refresh data (${err.message}).`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  // Check monitoring status on load
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getMonitoringStatus();
        setIsMonitoring(status.active);
      } catch (e) {
        console.error('Failed to check monitoring status');
      }
    };
    checkStatus();
  }, []);

  // Fetch data based on mode
  useEffect(() => {
    if (mode === 'monitoring') {
      loadMetrics();
    } else if (mode === 'daily-top') {
      loadDailyTop();
    }
  }, [mode]);

  const loadMetrics = async () => {
    try {
      const { getSystemMetrics } = await import('../services/historyService');
      const data = await getSystemMetrics();
      setSystemMetrics(data);
    } catch (e) {
      console.error(e);
      // Silent fail or toast
    }
  };

  const loadDailyTop = async () => {
    setLoading(true);
    try {
      const { getDailyTopQueries } = await import('../services/historyService');
      const data = await getDailyTopQueries();
      setQueries(data);
    } catch (e) {
      setError('Failed to load daily top queries');
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoring = async () => {
    try {
      if (isMonitoring) {
        await stopMonitoring();
        setIsMonitoring(false);
      } else {
        await startMonitoring(connection);
        setIsMonitoring(true);
        alert('Monitoring started! Snapshots will be taken every 5 minutes.');
      }
    } catch (e) {
      alert('Failed to toggle monitoring');
    }
  };





  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset statistics? This will clear all query history in pg_stat_statements.')) return;

    setLoading(true);
    try {
      const { resetPgStatStatements } = await import('../services/pgService');
      await resetPgStatStatements(connection);
      handleRefresh();
    } catch (err: any) {
      setError(`Failed to reset statistics (${err.message})`);
      setLoading(false);
    }
  };

  const stats = {
    totalQueries: queries.length,
    totalTime: queries.reduce((acc, q) => acc + q.total_time, 0),
    slowestQuery: Math.max(...queries.map(q => q.mean_time), 0),
    criticalCount: queries.filter(q => q.mean_time > 1000).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30">
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

          <div className="flex items-center gap-4">
            {/* Mode Switcher - Pill Style */}
            <div className="bg-slate-800/80 p-1 rounded-full border border-slate-700/50 flex relative">
              <button
                onClick={() => setMode('live')}
                className={`relative z-10 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${mode === 'live' ? 'text-white shadow-lg bg-gradient-to-r from-blue-600 to-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Live
              </button>
              <button
                onClick={() => setMode('monitoring')}
                className={`relative z-10 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${mode === 'monitoring' ? 'text-white shadow-lg bg-gradient-to-r from-purple-600 to-purple-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Monitoring
              </button>
              <button
                onClick={() => setMode('daily-top')}
                className={`relative z-10 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${mode === 'daily-top' ? 'text-white shadow-lg bg-gradient-to-r from-orange-600 to-orange-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Daily Top 20
              </button>
            </div>

            {mode === 'monitoring' && (
              <button
                onClick={toggleMonitoring}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${isMonitoring
                  ? 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]'}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full mr-2 ${isMonitoring ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                {isMonitoring ? 'Stop' : 'Start'}
              </button>
            )}

            <button
              onClick={onDisconnect}
              className="px-4 py-2 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-300 border border-transparent hover:border-slate-700"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl mb-8 animate-fade-in-up flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <div className="glass-card rounded-xl p-6 hover:scale-[1.02] transition-transform duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 p-3 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalQueries}</div>
            <div className="text-sm text-slate-400">Captured Queries</div>
          </div>

          <div className="glass-card rounded-xl p-6 hover:scale-[1.02] transition-transform duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-500/20 p-3 rounded-lg group-hover:bg-red-500/30 transition-colors">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Critical</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.criticalCount}</div>
            <div className="text-sm text-slate-400">Slow Queries (&gt;1s)</div>
          </div>

          <div className="glass-card rounded-xl p-6 hover:scale-[1.02] transition-transform duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-500/20 p-3 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Slowest</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.slowestQuery.toFixed(0)}<span className="text-lg text-slate-500 ml-1">ms</span></div>
            <div className="text-sm text-slate-400">Max Mean Time</div>
          </div>

          <div className="glass-card rounded-xl p-6 hover:scale-[1.02] transition-transform duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 p-3 rounded-lg group-hover:bg-green-500/30 transition-colors">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Refresh</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{refreshTimer}<span className="text-lg text-slate-500 ml-1">s</span></div>
            <div className="text-sm text-slate-400">Auto-update</div>
          </div>
        </div>

        {/* System Monitoring View */}
        {mode === 'monitoring' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in-up">
            <div className="glass-card p-6 rounded-xl border-l-4 border-blue-500">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Connections</h3>
              <p className="text-4xl font-bold text-white mt-3 tracking-tight">
                {systemMetrics.length > 0 ? systemMetrics[systemMetrics.length - 1].active_connections : '-'}
              </p>
            </div>
            <div className="glass-card p-6 rounded-xl border-l-4 border-purple-500">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cache Hit Ratio</h3>
              <p className="text-4xl font-bold text-white mt-3 tracking-tight">
                {systemMetrics.length > 0 ? (systemMetrics[systemMetrics.length - 1].cache_hit_ratio * 100).toFixed(2) + '%' : '-'}
              </p>
            </div>
            <div className="glass-card p-6 rounded-xl border-l-4 border-indigo-500">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">DB Size</h3>
              <p className="text-4xl font-bold text-white mt-3 tracking-tight">
                {systemMetrics.length > 0 ? (systemMetrics[systemMetrics.length - 1].db_size_bytes / 1024 / 1024).toFixed(0) + ' MB' : '-'}
              </p>
            </div>
            <div className="glass-card p-6 rounded-xl border-l-4 border-slate-500">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Last Updated</h3>
              <p className="text-xl font-medium text-white mt-4 font-mono">
                {systemMetrics.length > 0 ? new Date(systemMetrics[systemMetrics.length - 1].timestamp).toLocaleTimeString() : '-'}
              </p>
            </div>
          </div>
        )}

        {/* Main Content - Query Table */}
        {(mode === 'live' || mode === 'daily-top') && (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="px-8 py-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {mode === 'live' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      Live Query Performance
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Daily Top 20 Slowest
                    </>
                  )}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {mode === 'live'
                    ? 'Real-time analysis from pg_stat_statements'
                    : 'Historical record of the slowest queries today'
                  }
                </p>
              </div>
              {mode === 'live' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200"
                  >
                    Reset Stats
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh
                  </button>
                </div>
              )}
            </div>
            <div className="p-0">
              <QueryTable
                queries={queries}
                onAnalyze={setSelectedQuery}
                mode={mode}
              />
            </div>
            <div className="px-8 py-4 border-t border-slate-700/50 bg-slate-900/50 flex justify-between items-center">
              <div className="text-xs text-slate-500 font-mono">
                Last sync: {lastUpdated.toLocaleTimeString()}
              </div>
              <div className="text-xs text-slate-600">
                Showing {queries.length} queries
              </div>
            </div>
          </div>
        )}

        {selectedQuery && (
          <AnalysisModal
            queryStat={selectedQuery}
            onClose={() => setSelectedQuery(null)}
          />
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-slate-800/50 pt-8 text-center pb-8">
          <p className="text-slate-500 text-sm flex items-center justify-center gap-2 group cursor-default">
            <span>Made with</span>
            <svg className="w-4 h-4 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            <span>by</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold group-hover:scale-105 transition-transform duration-300">
              Lifetrenz DevOps Team
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;