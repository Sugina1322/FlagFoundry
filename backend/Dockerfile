FROM node:22-bookworm-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install
COPY backend/src ./backend/src
COPY db ./db
RUN npm run prisma:generate
WORKDIR /app/backend
EXPOSE 4000
CMD ["npm", "start"]
