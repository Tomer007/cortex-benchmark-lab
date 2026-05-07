FROM node:20-slim AS builder

WORKDIR /app

# Install Node dependencies (all, including dev for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the frontend and server
RUN npm run build

# --- Production stage ---
FROM node:20-slim

# Install Python for the test runner
RUN apt-get update && apt-get install -y python3 python3-pip --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install only production Node dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Install Python dependencies if requirements.txt exists
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip3 install --break-system-packages -r requirements.txt; fi

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy Python test script and other runtime files
COPY test_prompt_system.py ./
COPY custom_context.json ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
