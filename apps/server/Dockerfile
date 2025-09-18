FROM node:20-alpine

WORKDIR /app

# Copy root package files for turbo workspace
COPY ../package.json ../package-lock.json ../turbo.json ./

# Copy app package files
COPY package*.json ./

# Install all dependencies including turbo
RUN npm ci

# Copy source code from entire workspace
COPY ../ ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application from app directory
CMD ["npm", "run", "start"]