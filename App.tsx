import React, { useState } from 'react';

import ConnectionForm from './components/ConnectionForm';
import Dashboard from './components/Dashboard';
import { ConnectionDetails } from './types';

const App: React.FC = () => {
  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = (details: ConnectionDetails) => {
    setConnection(details);
  };

  const handleDisconnect = () => {
    setConnection(null);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200">
      <main>
        {!connection ? (
          <ConnectionForm onConnect={handleConnect} loading={loading} />
        ) : (
          <Dashboard connection={connection} onDisconnect={handleDisconnect} />
        )}
      </main>
    </div>
  );
};

export default App;