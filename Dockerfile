# ===============================
# 🐳 DOCKERFILE - BGE Héroes de la Patria
# Multi-stage build para optimizar tamaño de imagen
# Semana 6 - DevOps & CI/CD - Tarea 2
# ===============================

# ===============================
# STAGE 1: BUILDER
# ===============================
FROM node:18-alpine AS builder

# Metadata
LABEL maintainer="BGE DevOps Team"
LABEL description="BGE Héroes de la Patria - Builder Stage"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy application files
COPY . .

# Build webpack bundles (if configured)
RUN npm run build:webpack || echo "Webpack build not configured, skipping..."

# ===============================
# STAGE 2: PRODUCTION
# ===============================
FROM node:18-alpine

# Metadata
LABEL maintainer="BGE DevOps Team"
LABEL description="BGE Héroes de la Patria - Production Image"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy backend code
COPY --from=builder /app/backend ./backend

# Copy public assets
COPY --from=builder /app/public ./public

# Copy configuration files
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/vercel.json ./vercel.json

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { if (r.statusCode !== 200) throw new Error('Health check failed') })"

# Environment variables (overrideable at runtime)
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["node", "backend/server.js"]
