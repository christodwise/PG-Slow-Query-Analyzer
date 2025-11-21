export interface ConnectionDetails {
  id?: string;
  name?: string;
  host: string;
  port: string;
  user: string;
  password?: string;
  database: string;
}

export interface QueryStat {
  queryid: string;
  query: string;
  calls: number;
  total_time: number; // in ms
  mean_time: number; // in ms
  rows: number;
  shared_blks_read: number;
  shared_blks_hit: number;
  last_seen?: string;
}

export type SortField = 'mean_time' | 'calls' | 'total_time' | 'rows';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export interface Snapshot {
  timestamp: number;
  queryCount: number;
}

export interface HistoryDiff extends QueryStat {
  // Inherits all from QueryStat
}

export interface SystemMetric {
  timestamp: number;
  active_connections: number;
  tps: number;
  cache_hit_ratio: number;
  db_size_bytes: number;
}