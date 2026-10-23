# syntax=docker/dockerfile:1

# The whole game in one image: the NestJS backend, which also serves the built React frontend, so
# the TV and the phones only need one address and port. Postgres runs alongside it; see
# docker-compose.yml. Debian-based (slim) rather than Alpine: the build tools' native packages in
# the lockfiles are the glibc ones, for both x64 and ARM (e.g. most NAS boxes).

# Build the backend and the frontend.
FROM node:24-slim AS build
WORKDIR /src
COPY backend/package.json backend/package-lock.json backend/
COPY frontend/package.json frontend/package-lock.json frontend/
RUN npm ci --prefix backend && npm ci --prefix frontend
COPY backend backend
COPY frontend frontend
RUN npm run build --prefix backend && npm run build --prefix frontend

# Only what the backend needs at runtime.
FROM node:24-slim AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-slim
ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_DIR=/app/public
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY backend/package.json ./
COPY backend/drizzle drizzle
COPY --from=build /src/backend/dist dist
COPY --from=build /src/frontend/dist public
USER node
EXPOSE 3000
# On every start: bring the database up to date and load the question set (both are safe to
# repeat), then run the game.
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/db/seed.js && exec node dist/main.js"]
