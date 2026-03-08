FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application files
COPY . .

# Expose port (80 can be used if requested, default to let's say 80 for proxy config)
EXPOSE 80

CMD ["node", "server.js"]
