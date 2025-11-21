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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-8">
        <div className="relative max-w-md w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-blue-400">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-700/50 rounded-xl leading-5 bg-slate-800/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 sm:text-sm transition-all duration-300 shadow-inner"
            placeholder="Search SQL queries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-400 font-medium bg-slate-800/30 px-3 py-1 rounded-lg border border-slate-700/30">
          Showing <span className="text-white font-bold">{filteredAndSortedQueries.length}</span> queries
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700/50">
          <thead className="bg-slate-800/50">
            <tr>
              <th scope="col" className="py-4 pl-8 pr-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-1/2">
                Query Statement
              </th>
              <th
                scope="col"
                className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-400 transition-colors group"
                onClick={() => handleSort('mean_time')}
              >
                <div className="flex items-center gap-1">
                  Mean Time <SortIcon field="mean_time" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-400 transition-colors group"
                onClick={() => handleSort('calls')}
              >
                <div className="flex items-center gap-1">
                  Calls <SortIcon field="calls" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-400 transition-colors group"
                onClick={() => handleSort('rows')}
              >
                <div className="flex items-center gap-1">
                  Rows <SortIcon field="rows" />
                </div>
              </th>
              {mode === 'daily-top' && (
                <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Last Seen
                </th>
              )}
              <th scope="col" className="px-3 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider pr-8">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30 bg-transparent">
            {filteredAndSortedQueries.map((query, index) => {
              const severityClass = getSeverityColor(query.mean_time);
              return (
                <tr
                  key={query.queryid}
                  className={`hover:bg-slate-700/30 transition-colors duration-200 ${index % 2 === 0 ? 'bg-slate-800/10' : 'bg-transparent'}`}
                >
                  <td className="py-4 pl-8 pr-3 text-sm">
                    <div className="font-mono text-xs text-slate-300 break-all line-clamp-2 hover:line-clamp-none cursor-help transition-all duration-200" title={query.query}>
                      {query.query === '<insufficient privilege>' ? (
                        <span className="text-yellow-500 flex items-center gap-2 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 w-fit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Insufficient Privilege
                        </span>
                      ) : (
                        query.query
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm ${severityClass}`}>
                      {query.mean_time.toFixed(2)} ms
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 font-mono">
                    {query.calls.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 font-mono">
                    {query.rows.toLocaleString()}
                  </td>
                  {mode === 'daily-top' && (
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 font-mono text-xs">
                      {query.last_seen ? new Date(query.last_seen).toLocaleTimeString() : '-'}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right pr-8">
                    <button
                      onClick={() => onAnalyze(query)}
                      className="group flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-4 py-2 rounded-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-0.5 ml-auto"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Analyze</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAndSortedQueries.length === 0 && (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center">
            <div className="bg-slate-800/50 p-4 rounded-full mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium">No queries found</p>
            <p className="text-sm mt-1">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryTable;