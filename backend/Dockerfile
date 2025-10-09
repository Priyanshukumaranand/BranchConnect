# Backend Dockerfile for BranchBase
# Uses Node 18 (slim) for compatibility with native modules
FROM node:18-bullseye-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies (only production by default)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production --no-progress --no-audit --silent

# Copy app source
COPY . .

# Expose default port used by the app
ENV PORT=8080
EXPOSE 8080

# Use non-root user for better security
USER node

# Start the application
CMD ["node", "src/index.js"]
