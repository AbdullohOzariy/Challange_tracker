FROM node:20-bullseye-slim AS build

WORKDIR /app

# Copy package files and configs first (to leverage Docker cache)
COPY package*.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./

# Install dependencies including devDependencies so build tools (vite, plugins, tailwind) are available
RUN npm ci --include=dev

# Copy source code and components
COPY src ./src
COPY components ./components
COPY services ./services
COPY types.ts ./
COPY App.tsx ./
COPY index.tsx ./

# Build the production bundle
RUN npm run build

# Production stage: minimal image
FROM node:20-bullseye-slim

WORKDIR /app

# Install a lightweight static server
RUN npm install -g serve

# Copy built app from build stage
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Health check (uses curl if wget not present)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD (curl -f http://localhost:3000/ || exit 1)

# Start the static server
ENV NODE_ENV=production
CMD ["serve", "-s", "dist", "-l", "3000"]
