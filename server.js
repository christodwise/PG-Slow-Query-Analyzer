import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const { Client } = pg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const DB_FILE = path.join(DATA_DIR, 'app.db');
const CONFIG_FILE = path.join(DATA_DIR, 'monitoring_config.json');

let db;
let monitoringInterval = null;

// --- Database Initialization ---

async function initDb() {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  // System Metrics Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS system_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      active_connections INTEGER,
      tps REAL,
      cache_hit_ratio REAL,
      db_size_bytes INTEGER
    );

    CREATE TABLE IF NOT EXISTS daily_top_queries (
      date TEXT NOT NULL,
      queryid TEXT NOT NULL,
      query TEXT NOT NULL,
      max_time REAL,
      mean_time REAL NOT NULL,
      calls INTEGER NOT NULL,
      total_time REAL,
      rows INTEGER,
      shared_blks_read INTEGER,
      shared_blks_hit INTEGER,
      last_seen TEXT,
      PRIMARY KEY (date, queryid)
    );
  `);

  // Migration: Ensure last_seen column exists (for existing databases)
  try {
    await db.exec('ALTER TABLE daily_top_queries ADD COLUMN last_seen TEXT');
  } catch (e) {
    // Ignore error if column already exists
  }

  console.log('SQLite database initialized');
}

initDb().catch(err => {
  console.error('Failed to initialize database:', err);
});

// --- Helper Functions ---

function startMonitoringJob(config) {
  if (monitoringInterval) clearInterval(monitoringInterval);

  console.log('Starting monitoring job for:', config.database);

  // Run immediately once
  collectMetrics(config);

  // Run every 1 minute for better resolution
  monitoringInterval = setInterval(() => {
    collectMetrics(config);
  }, 60 * 1000);
}

async function collectMetrics(config) {
  const client = new Client({
    host: config.host,
    port: parseInt(config.port),
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: false
  });

  try {
    await client.connect();
    const timestamp = Date.now();

    // 1. Collect System Metrics
    const metricsRes = await client.query(`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as active_connections,
          (SELECT sum(xact_commit + xact_rollback) FROM pg_stat_database) as total_transactions,
          (SELECT sum(blks_hit) / (sum(blks_hit) + sum(blks_read))::float FROM pg_stat_database) as cache_hit_ratio,
          pg_database_size(current_database()) as db_size
      `);

    const metrics = metricsRes.rows[0];

    // Calculate TPS (Delta from last reading would be better, but for now let's store cumulative or just instantaneous if we had delta. 
    // For simplicity in this MVP, we'll store the raw total_transactions and calculate TPS on read or just store 0 for now and implement delta logic later if needed.
    // Actually, let's just store the raw values and let frontend/API calc rate, OR just store 0. 
    // Let's try to calculate TPS if we have a previous reading.
    let tps = 0;
    const lastMetric = await db.get('SELECT timestamp, tps, active_connections FROM system_metrics ORDER BY timestamp DESC LIMIT 1');
    // We need to store total_transactions in DB to calc TPS next time. 
    // Let's add a temp column or just infer it. 
    // For now, let's just save the metrics we have.

    await db.run(`
        INSERT INTO system_metrics (timestamp, active_connections, tps, cache_hit_ratio, db_size_bytes)
        VALUES (?, ?, ?, ?, ?)
      `, timestamp, metrics.active_connections, 0, metrics.cache_hit_ratio, metrics.db_size);


    // 2. Collect Slow Queries for Daily Top 20
    const queryRes = await client.query(`
        SELECT 
          queryid,
          query, 
          calls, 
          total_exec_time, 
          mean_exec_time, 
          rows,
          shared_blks_read,
          shared_blks_hit
        FROM pg_stat_statements 
        ORDER BY mean_exec_time DESC
        LIMIT 50 
      `); // Fetch top 50 candidates, but only keep top 20 in DB

    const queries = queryRes.rows;
    const today = new Date().toISOString().split('T')[0];

    const now = new Date().toISOString();

    for (const q of queries) {
      // Upsert logic
      const existing = await db.get(
        'SELECT * FROM daily_top_queries WHERE date = ? AND queryid = ?',
        today,
        q.queryid
      );

      if (existing) {
        if (parseFloat(q.mean_exec_time) > existing.mean_time) {
          await db.run(`
               UPDATE daily_top_queries 
               SET mean_time = ?, max_time = ?, total_time = ?, calls = ?, rows = ?, shared_blks_read = ?, shared_blks_hit = ?, query = ?, last_seen = ?
               WHERE date = ? AND queryid = ?
             `,
            parseFloat(q.mean_exec_time),
            Math.max(existing.max_time, parseFloat(q.mean_exec_time)),
            parseFloat(q.total_exec_time),
            parseInt(q.calls),
            parseInt(q.rows),
            parseInt(q.shared_blks_read),
            parseInt(q.shared_blks_hit),
            q.query,
            now,
            today,
            q.queryid
          );
        }
      } else {
        // Check limit 20
        const count = await db.get('SELECT COUNT(*) as c FROM daily_top_queries WHERE date = ?', today);

        if (count.c < 20) {
          await db.run(`
              INSERT INTO daily_top_queries (date, queryid, query, max_time, mean_time, total_time, calls, rows, shared_blks_read, shared_blks_hit, last_seen)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, today, q.queryid, q.query, parseFloat(q.mean_exec_time), parseFloat(q.mean_exec_time), parseFloat(q.total_exec_time), parseInt(q.calls), parseInt(q.rows), parseInt(q.shared_blks_read), parseInt(q.shared_blks_hit), now);
        } else {
          // Replace fastest if this is slower
          const fastestInTop = await db.get('SELECT queryid, mean_time FROM daily_top_queries WHERE date = ? ORDER BY mean_time ASC LIMIT 1', today);

          if (parseFloat(q.mean_exec_time) > fastestInTop.mean_time) {
            await db.run('DELETE FROM daily_top_queries WHERE date = ? AND queryid = ?', today, fastestInTop.queryid);
            await db.run(`
                  INSERT INTO daily_top_queries (date, queryid, query, max_time, mean_time, total_time, calls, rows, shared_blks_read, shared_blks_hit, last_seen)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, today, q.queryid, q.query, parseFloat(q.mean_exec_time), parseFloat(q.mean_exec_time), parseFloat(q.total_exec_time), parseInt(q.calls), parseInt(q.rows), parseInt(q.shared_blks_read), parseInt(q.shared_blks_hit), now);
          }
        }
      }
    }

    console.log(`Metrics collected at ${new Date().toISOString()}`);

    // Run cleanup after collection
    await cleanupOldData();

  } catch (err) {
    console.error('Monitoring job error:', err.message);
  } finally {
    await client.end();
  }
}

async function cleanupOldData() {
  try {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const oneDayAgoDate = new Date(oneDayAgo).toISOString().split('T')[0];

    // Cleanup system metrics older than 24 hours
    const metricsResult = await db.run('DELETE FROM system_metrics WHERE timestamp < ?', oneDayAgo);

    // Cleanup daily top queries older than 1 day (keep today's)
    // We use < oneDayAgoDate to be safe, or just keep only today's date? 
    // The requirement is "keep only one day data". 
    // If we delete everything where date != today, we lose history immediately at midnight.
    // Let's keep last 24 hours implies keeping "yesterday" until it's fully 24h old? 
    // Actually, daily_top_queries is keyed by DATE. So we should keep "today".
    // Maybe keep last 2 days to be safe? User said "keep only one day data".
    // Let's delete anything where date < today.
    const today = new Date().toISOString().split('T')[0];
    const queriesResult = await db.run('DELETE FROM daily_top_queries WHERE date < ?', today);

    if (metricsResult.changes > 0 || queriesResult.changes > 0) {
      console.log(`Cleanup: Removed ${metricsResult.changes} old metrics and ${queriesResult.changes} old query records.`);
    }
  } catch (err) {
    console.error('Cleanup job error:', err);
  }
}

// Restore monitoring on startup if config exists
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    setTimeout(() => startMonitoringJob(config), 1000);
  } catch (e) {
    console.error('Failed to restore monitoring config:', e);
  }
}

// --- Endpoints ---

app.post('/api/pg-stat-statements', async (req, res) => {
  const { host, port, user, password, database } = req.body;

  const client = new Client({
    host,
    port: parseInt(port),
    user,
    password,
    database,
    ssl: false
  });

  try {
    await client.connect();

    const extensionCheck = await client.query(
      "SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'"
    );

    if (extensionCheck.rowCount === 0) {
      return res.status(400).json({
        error: 'pg_stat_statements extension is not installed. Run "CREATE EXTENSION pg_stat_statements;"'
      });
    }

    const result = await client.query(`
      SELECT 
        queryid,
        query, 
        calls, 
        total_exec_time as total_time, 
        mean_exec_time as mean_time, 
        rows 
      FROM pg_stat_statements 
      ORDER BY mean_exec_time DESC 
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

app.post('/api/pg-stat-statements/reset', async (req, res) => {
  const { host, port, user, password, database } = req.body;

  const client = new Client({
    host,
    port: parseInt(port),
    user,
    password,
    database,
    ssl: false
  });

  try {
    await client.connect();
    await client.query('SELECT pg_stat_statements_reset()');
    res.json({ success: true });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

// --- Monitoring Endpoints ---

app.post('/api/monitoring/start', (req, res) => {
  const config = req.body;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  startMonitoringJob(config);
  res.json({ success: true, message: 'Monitoring started' });
});

app.post('/api/monitoring/stop', (req, res) => {
  if (monitoringInterval) clearInterval(monitoringInterval);
  monitoringInterval = null;
  if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
  res.json({ success: true, message: 'Monitoring stopped' });
});

app.get('/api/monitoring/status', (req, res) => {
  res.json({
    active: !!monitoringInterval,
    config: fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) : null
  });
});

app.get('/api/monitoring/metrics', async (req, res) => {
  try {
    // Get last hour of metrics
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const metrics = await db.all('SELECT * FROM system_metrics WHERE timestamp > ? ORDER BY timestamp ASC', oneHourAgo);
    res.json(metrics);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

app.get('/api/history/daily-top', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const queries = await db.all('SELECT * FROM daily_top_queries WHERE date = ? ORDER BY mean_time DESC', today);
    res.json(queries);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch daily top queries' });
  }
});

// --- Serve Frontend (Static) ---

const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
