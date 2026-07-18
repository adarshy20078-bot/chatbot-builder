FROM node:18-slim

# Install Chromium and necessary headless browser dependencies
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates procps libxss1 chromium fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set up Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROME_PATH=/usr/bin/chromium

WORKDIR /app

# Install node dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

CMD ["npm", "start"]
