FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy backend source code
COPY src ./src
COPY index.js ./
COPY swagger.yaml ./
COPY api-gateway-config.yaml ./


# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["node", "index.js"]
