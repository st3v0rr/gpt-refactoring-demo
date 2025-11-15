FROM node:24-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (exclude server and mcp-server)
COPY src ./src
COPY index.html .
COPY vite.config.js .
COPY tailwind.config.js .
COPY postcss.config.js .

# Expose port
EXPOSE 3000

# Start dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
