# ==========================================
# Multi-Stage Dockerfile for Homelab Cockpit
# Ultra-lightweight & Production Ready
# ==========================================

# Stage 1: Build Frontend SPA
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend Daemon
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production Minimal Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install production dependencies only
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy compiled backend & frontend assets
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist

# Expose Cockpit Web Port
EXPOSE 3000

# Run Server
WORKDIR /app/server
CMD ["node", "dist/index.js"]
