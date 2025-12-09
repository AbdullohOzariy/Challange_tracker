FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and configs
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./

# Copy source code and components
COPY src ./src
COPY components ./components
COPY services ./services
COPY types.ts ./
COPY App.tsx ./
COPY index.tsx ./


# Install dependencies
RUN npm install

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the app
CMD ["serve", "-s", "dist", "-l", "3000"]
