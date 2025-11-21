import React, { useState } from 'react';
import { ConnectionDetails } from '../types';

interface ConnectionFormProps {
  onConnect: (details: ConnectionDetails) => void;
  loading: boolean;
  error?: string | null;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect, loading, error }) => {
  const [savedConnections, setSavedConnections] = useState<ConnectionDetails[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState<ConnectionDetails>({
    host: 'localhost',
    port: '5432',
    user: 'postgres',
    password: '',
    database: 'production_db'
  });

  React.useEffect(() => {
    const saved = localStorage.getItem('pgConnections');
    if (saved) {
      setSavedConnections(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      onConnect(form);
      setStatus('Connecting...');
    } catch (err: any) {
      setStatus('Failed to connect');
    }
  };

  const handleSave = () => {
    if (!form.name) {
      setStatus('Please provide a name for this connection');
      return;
    }
    const newConnection = { ...form, id: Date.now().toString() };
    const updated = [...savedConnections, newConnection];
    setSavedConnections(updated);
    localStorage.setItem('pgConnections', JSON.stringify(updated));
    setStatus('Connection saved!');
  };

  const handleLoad = (connection: ConnectionDetails) => {
    setForm(connection);
    setShowSaved(false);
    setStatus(`Loaded ${connection.name}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedConnections.filter(c => c.id !== id);
    setSavedConnections(updated);
    localStorage.setItem('pgConnections', JSON.stringify(updated));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full glass-card rounded-2xl shadow-2xl p-8 border border-slate-700/50 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                <img src="/lifetrenz_logo.png" alt="Lifetrenz Logo" className="h-12 w-auto drop-shadow-lg" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Connect to Database</h2>
            <p className="text-slate-400 text-sm">
              Analyze your PostgreSQL performance with <span className="text-blue-400 font-medium">pg_stat_statements</span>
            </p>
          </div>

          {showSaved ? (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Saved Connections</h3>
                <button
                  onClick={() => setShowSaved(false)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Back to Form
                </button>
              </div>
              {savedConnections.length === 0 ? (
                <div className="text-center text-slate-500 py-8 bg-slate-800/30 rounded-xl border border-slate-700/30 border-dashed">
                  No saved connections
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {savedConnections.map(conn => (
                    <div
                      key={conn.id}
                      onClick={() => handleLoad(conn)}
                      className="flex justify-between items-center p-3 bg-slate-800/40 hover:bg-slate-700/60 rounded-xl cursor-pointer transition-all border border-slate-700/30 hover:border-blue-500/30 group"
                    >
                      <div>
                        <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{conn.name}</div>
                        <div className="text-xs text-slate-500 group-hover:text-slate-400">{conn.user}@{conn.host}:{conn.port}/{conn.database}</div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(conn.id!, e)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
              {status && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center text-xs text-blue-400 mb-2 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  {status}
                </div>
              )}
              {typeof error === 'string' && error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center text-xs text-red-400 mb-2 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Connection Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Production DB"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Host</label>
                  <input
                    type="text"
                    name="host"
                    value={form.host}
                    onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                    placeholder="localhost"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Port</label>
                  <input
                    type="text"
                    name="port"
                    value={form.port}
                    onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                    placeholder="5432"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">User</label>
                  <input
                    type="text"
                    name="user"
                    value={form.user}
                    onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                    placeholder="postgres"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Database</label>
                  <input
                    type="text"
                    name="database"
                    value={form.database}
                    onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                    placeholder="mydb"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    'Connect & Analyze'
                  )}
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 py-2.5 px-3 border border-slate-600/50 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 hover:text-white transition-all"
                  >
                    Save Connection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSaved(true)}
                    className="flex-1 py-2.5 px-3 border border-slate-600/50 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 hover:text-white transition-all"
                  >
                    Load Saved ({savedConnections.length})
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectionForm;