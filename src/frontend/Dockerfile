FROM node:22-alpine

WORKDIR /workspace/src/frontend

COPY src/frontend/package.json ./package.json
RUN npm install

COPY src/frontend ./
COPY src/database ../database

CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0 --port 5173"]
