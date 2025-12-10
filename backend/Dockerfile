FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# --- DIAGNOSTIC STEP ---
# Print the contents of package.json to the build log
RUN echo "--- Verifying package.json contents ---" && cat package.json && echo "--- End of package.json ---"

# Clean npm cache and install dependencies
RUN npm cache clean --force
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
