FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Note: We install sqlite3 specifically to ensure it's built for the container arch
RUN npm install && npm install sqlite3

# Copy source code
COPY . .

# Build frontend (assuming Vite)
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p data

# Expose ports
EXPOSE 3001
EXPOSE 5173

# Start the server
# We use a script to start both or just the backend? 
# For this setup, we'll assume we want to run the backend and serve the frontend static files.
# But for now, let's just run the backend as the entrypoint and assume frontend is served separately or we add a serve command.
# Let's update server.js to serve static files if we want a single container.
# For now, let's just run the backend.
CMD ["node", "server.js"]
