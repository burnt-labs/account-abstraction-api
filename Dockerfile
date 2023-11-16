# ---- Base Node ----
FROM node:lts-alpine as base
  WORKDIR /app
  COPY package.json package-lock.json ./
  RUN set -eux \
    && npm install

# ---- Build ----
FROM base AS build
  COPY . .
  RUN set -eux \
    && npm run build

# ---- Release ----
FROM node:lts-alpine AS release
  # Install pnpm
  WORKDIR /app
  COPY --from=build /app .
  RUN set -eux \
    && apk add --no-cache --virtual .build-deps \
      bash \
      curl \
      tini \
    && addgroup -S burnt && adduser -S burnt -G burnt \
    && chown -R burnt:burnt /app
  USER burnt
  CMD ["npm", "start"]
