# PG Slow Query Analyzer

A modern, real-time dashboard for analyzing PostgreSQL slow queries using `pg_stat_statements`.

## Features

### 📊 Real-time Analysis
View top slow queries sorted by execution time. The dashboard now **only** displays real data from your database, with all mock data fallback logic removed.

### 💾 Multiple Connections
Save, load, and delete multiple database connection profiles. Connections are persisted in your browser's local storage for easy access.

### 🧹 Reset Statistics
Clear query history to start a new analysis window. This executes `SELECT pg_stat_statements_reset()` on your database, serving as an alternative to "date range" filtering.

### 🔌 Disconnect Logic
Properly clear the active session and return to the connection form with a single click.

### 🤖 AI-Powered Insights
Analyze query performance and get optimization suggestions (requires Gemini API).

### 🔄 Auto-Refresh
Live monitoring of query performance with automatic updates.

## Prerequisites

### 1. PostgreSQL Configuration
Your PostgreSQL server must have the `pg_stat_statements` extension enabled and loaded.

**Edit `postgresql.conf`:**
Find your config file (usually `/etc/postgresql/14/main/postgresql.conf` or similar) and add/update:
```ini
shared_preload_libraries = 'pg_stat_statements'
```
*Note: You must restart your PostgreSQL server after changing this setting.*

**Enable Extension:**
Connect to your database and run:
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### 2. Permissions
To see the SQL text of queries executed by other users, you need specific permissions.

**Option A: Connect as Superuser** (easiest for local dev)
Use the `postgres` user.

**Option B: Grant Permissions** (Postgres 10+)
Grant the `pg_read_all_stats` role to your monitoring user:
```sql
GRANT pg_read_all_stats TO your_username;
```

## Installation & Running

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start the Backend Server**
    This server handles the database connection.
    ```bash
    npm run server
    ```
    *Runs on http://localhost:3001*

3.  **Start the Frontend**
    In a new terminal:
    ```bash
    npm run dev
    ```
    *Runs on http://localhost:3000*

4.  **Open App**
    Go to [http://localhost:3000](http://localhost:3000) and enter your database credentials.

### 5. Docker Support

You can also run the application using Docker.

1.  **Build the Image**
    ```bash
    docker build -t pg-slow-query-analyzer .
    ```

2.  **Run the Container**
    To persist your connection settings and query history, mount a volume to `/app/data`:
    ```bash
    docker run -p 3001:3001 -v $(pwd)/data:/app/data pg-slow-query-analyzer
    ```

3.  **Open App**
    Go to [http://localhost:3001](http://localhost:3001).

    *Note: If you are connecting to a PostgreSQL database running on your host machine, use `host.docker.internal` (Mac/Windows) or ensure network accessibility (Linux).*

### 6. Docker Compose

You can also use Docker Compose to run the application using the pre-built image.

1.  **Create `docker-compose.yml`**
    ```yaml
    version: '3.8'
    services:
      app:
        image: christoj/pg-slow-query-analyzer:1.0
        ports:
          - "3001:3001"
        volumes:
          - ./data:/app/data
        restart: unless-stopped
    ```

2.  **Start the Service**
    ```bash
    docker-compose up -d
    ```

2.  **Stop the Service**
    ```bash
    docker-compose down
    ```

## Troubleshooting

- **`<insufficient privilege>`**: You are not connected as a superuser or lack `pg_read_all_stats` permission.
- **`pg_stat_statements must be loaded via shared_preload_libraries`**: You missed step 1 in Prerequisites. Restart Postgres!
- **`Connection refused` / `ETIMEDOUT`**: Check if your database host/port is correct and accessible from the machine running the backend.
