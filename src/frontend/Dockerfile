FROM node:22-alpine

WORKDIR /workspace/src/frontend

COPY src/frontend/package.json ./package.json
COPY src/frontend/package-lock.json ./package-lock.json
RUN npm ci

COPY src/frontend ./
COPY src/database ../database

CMD ["sh", "-c", "npm ci && npm run dev -- --host 0.0.0.0 --port 5173"]
