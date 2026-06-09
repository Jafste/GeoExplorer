FROM node:22-alpine AS development

WORKDIR /workspace/src/frontend

COPY src/frontend/package.json ./package.json
COPY src/frontend/package-lock.json ./package-lock.json
RUN npm ci

COPY src/frontend ./
COPY src/database ../database

CMD ["sh", "-c", "npm ci && npm run dev -- --host 0.0.0.0 --port 5173"]

FROM node:22-alpine AS build

WORKDIR /workspace/src/frontend

COPY src/frontend/package.json ./package.json
COPY src/frontend/package-lock.json ./package-lock.json
RUN npm ci

COPY src/frontend ./
COPY src/database ../database

ARG VITE_DATA_MODE=api
ARG VITE_API_BASE_URL=/api
ENV VITE_DATA_MODE=${VITE_DATA_MODE}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine AS production

COPY src/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/src/frontend/dist /usr/share/nginx/html

EXPOSE 8080
