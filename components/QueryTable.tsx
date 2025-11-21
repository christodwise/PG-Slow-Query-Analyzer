import React, { useState, useMemo } from 'react';
import { QueryStat, SortConfig, SortField } from '../types';

interface QueryTableProps {
  queries: QueryStat[];
  onAnalyze: (query: QueryStat) => void;
  mode: 'live' | 'monitoring' | 'daily-top';
}

const QueryTable: React.FC<QueryTableProps> = ({ queries, onAnalyze, mode }) => {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'mean_time',
    order: 'desc',
  });

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  };

  const filteredAndSortedQueries = useMemo(() => {
    let result = [...queries];

    // Filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((q) => q.query.toLowerCase().includes(lowerSearch));
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [queries, search, sortConfig]);

  const getSeverityColor = (meanTime: number) => {
    if (meanTime > 1000) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (meanTime > 200) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    return 'bg-green-500/10 text-green-400 border-green-500/20';
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <span className="ml-1 text-slate-600">↕</span>;
    return <span className="ml-1 text-blue-400">{sortConfig.order === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Search SQL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-400">
          Showing {filteredAndSortedQueries.length} queries
        </div>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700 bg-slate-800">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-1/2">
                Query Statement
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('mean_time')}
              >
                Mean Time <SortIcon field="mean_time" />
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('calls')}
              >
                Calls <SortIcon field="calls" />
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('rows')}
              >
                Rows <SortIcon field="rows" />
              </th>
              {mode === 'daily-top' && (
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Last Seen
                </th>
              )}
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-800">
            {filteredAndSortedQueries.map((query) => {
              const severityClass = getSeverityColor(query.mean_time);
              return (
                <tr key={query.queryid} className="hover:bg-slate-700/50 transition-colors">
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="font-mono text-xs text-slate-300 break-all line-clamp-2 hover:line-clamp-none cursor-help" title={query.query}>
                      {query.query === '<insufficient privilege>' ? (
                        <span className="text-yellow-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Insufficient Privilege (Try connecting as superuser)
                        </span>
                      ) : (
                        query.query
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityClass}`}>
                      {query.mean_time.toFixed(2)} ms
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                    {query.calls.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                    {query.rows.toLocaleString()}
                  </td>
                  {mode === 'daily-top' && (
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 font-mono text-xs">
                      {query.last_seen ? new Date(query.last_seen).toLocaleTimeString() : '-'}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                    <button
                      onClick={() => onAnalyze(query)}
                      className="text-purple-400 hover:text-purple-300 flex items-center space-x-1 text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-md border border-purple-500/20 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span>Analyze AI</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAndSortedQueries.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No queries found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryTable;