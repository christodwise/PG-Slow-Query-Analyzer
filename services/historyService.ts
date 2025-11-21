import { ConnectionDetails, Snapshot, HistoryDiff, QueryStat } from '../types';

export async function startMonitoring(config: ConnectionDetails): Promise<void> {
    const response = await fetch('/api/monitoring/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Failed to start monitoring');
}

export async function stopMonitoring(): Promise<void> {
    const response = await fetch('/api/monitoring/stop', { method: 'POST' });
    if (!response.ok) throw new Error('Failed to stop monitoring');
}

export async function getMonitoringStatus(): Promise<{ active: boolean; config: ConnectionDetails | null }> {
    const response = await fetch('/api/monitoring/status');
    if (!response.ok) throw new Error('Failed to get monitoring status');
    return await response.json();
}

export async function getSnapshots(): Promise<Snapshot[]> {
    const response = await fetch('/api/history/snapshots');
    if (!response.ok) throw new Error('Failed to fetch snapshots');
    return await response.json();
}

export async function getHistoryDiff(start: number, end: number): Promise<HistoryDiff[]> {
    const response = await fetch(`/api/history/diff?start=${start}&end=${end}`);
    if (!response.ok) throw new Error('Failed to fetch history diff');
    return await response.json();
}

export async function getDailyTopQueries(): Promise<QueryStat[]> {
    const response = await fetch('/api/history/daily-top');
    if (!response.ok) throw new Error('Failed to fetch daily top queries');
    return await response.json();
}

export async function getSystemMetrics(): Promise<any[]> {
    const response = await fetch('/api/monitoring/metrics');
    if (!response.ok) throw new Error('Failed to fetch system metrics');
    return await response.json();
}
