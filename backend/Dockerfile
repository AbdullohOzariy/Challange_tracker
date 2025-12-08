FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build
RUN npm run build

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]

