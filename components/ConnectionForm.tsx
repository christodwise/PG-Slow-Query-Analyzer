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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/lifetrenz_logo.png" alt="Lifetrenz Logo" className="h-16 w-auto drop-shadow-lg" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Database Connection</h2>
          <p className="text-slate-400 text-sm">
            Connect to your PostgreSQL instance to analyze <code>pg_stat_statements</code>.
          </p>
        </div>

        {showSaved ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Saved Connections</h3>
              <button
                onClick={() => setShowSaved(false)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Back to Form
              </button>
            </div>
            {savedConnections.length === 0 ? (
              <div className="text-center text-slate-500 py-8">No saved connections</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedConnections.map(conn => (
                  <div
                    key={conn.id}
                    onClick={() => handleLoad(conn)}
                    className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors border border-slate-600"
                  >
                    <div>
                      <div className="font-medium text-white">{conn.name}</div>
                      <div className="text-xs text-slate-400">{conn.user}@{conn.host}:{conn.port}/{conn.database}</div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(conn.id!, e)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {status && (
              <div className="text-center text-xs text-blue-400 mb-2">{status}</div>
            )}
            {typeof error === 'string' && error && (
              <div className="text-center text-xs text-red-400 mb-2">{error}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Connection Name (Optional)</label>
              <input
                type="text"
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="My Production DB"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Host</label>
                <input
                  type="text"
                  name="host"
                  value={form.host}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="localhost"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Port</label>
                <input
                  type="text"
                  name="port"
                  value={form.port}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="5432"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">User</label>
                <input
                  type="text"
                  name="user"
                  value={form.user}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="postgres"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Database</label>
                <input
                  type="text"
                  name="database"
                  value={form.database}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="mydb"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4">
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2 px-3 border border-slate-600 rounded-lg text-xs text-slate-200 bg-slate-700 hover:bg-slate-600"
                >
                  Save Connection
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaved(true)}
                  className="flex-1 py-2 px-3 border border-slate-600 rounded-lg text-xs text-slate-200 bg-slate-700 hover:bg-slate-600"
                >
                  Load Saved ({savedConnections.length})
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
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
            </div>
          </form>
        )}

        {/* Demo mode warning removed. Real DB connections are now supported via backend. */}
      </div>
    </div>
  );
}

export default ConnectionForm;