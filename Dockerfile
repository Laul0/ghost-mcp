# syntax=docker/dockerfile:1

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (production + dev needed for tsc)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/build ./build

# The server communicates over stdio (MCP transport), so no port is exposed.
# Required environment variables:
#   GHOST_API_URL        – e.g. https://your-ghost-site.com
#   GHOST_ADMIN_API_KEY  – Ghost Admin API key (id:secret format)
#   GHOST_API_VERSION    – (optional) defaults to v5.0

ENV NODE_ENV=production

CMD ["node", "build/server.js"]
