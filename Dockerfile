# ---- Base Node ----
FROM node:lts-alpine as base
  WORKDIR /app
  COPY package.json package-lock.json ./
  RUN set -eux \
    && npm install

# ---- Build ----
FROM base AS build
  ENV NEXT_TELEMETRY_DISABLED 1
  COPY . .
  RUN set -eux \
    && npm run build

# ---- Release ----
FROM node:lts-alpine AS release
  # Install pnpm
  WORKDIR /app
  COPY --from=build /app .
  # At this point, the app is built and ready to run
  CMD ["npm", "start"]
