import { ConnectionDetails, QueryStat } from '../types';

// This function would call your backend API to fetch real query stats
export async function fetchPgStatStatements(details: ConnectionDetails): Promise<QueryStat[]> {
  // Example: POST to /api/pg-stat-statements with connection details
  const response = await fetch('/api/pg-stat-statements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch query stats');
  }
  return await response.json();
}

export async function resetPgStatStatements(details: ConnectionDetails): Promise<void> {
  const response = await fetch('/api/pg-stat-statements/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to reset statistics');
  }
}
