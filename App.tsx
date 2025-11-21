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
    <div className="min-h-screen bg-slate-900">
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