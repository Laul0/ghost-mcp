# syntax=docker/dockerfile:1

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (production + dev needed for tsc)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
COPY types/ ./types/
RUN npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/build ./build

# The server communicates over stdio (MCP transport), so no port is exposed.
# Required environment variables:
#   GHOST_API_URL        – e.g. https://your-ghost-site.com
#   GHOST_ADMIN_API_KEY  – Ghost Admin API key (id:secret format)
#   GHOST_API_VERSION    – (optional) defaults to v5.0
#
# Optional runtime settings for MCP transport:
#   MCP_TRANSPORT        – http (default) or stdio
#   MCP_HOST             – default 0.0.0.0
#   MCP_PORT             – default 3000
#   MCP_HTTP_PATH        – default /

ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV MCP_HOST=0.0.0.0
ENV MCP_PORT=3000
ENV MCP_HTTP_PATH=/

EXPOSE 3000

CMD ["node", "build/server.js"]
