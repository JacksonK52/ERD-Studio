# syntax=docker/dockerfile:1

# ---- Build stage -----------------------------------------------------------
# Only this stage needs Node/npm; none of it ends up in the final image.
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies in their own layer so `npm ci` only reruns when
# package.json/package-lock.json actually change, not on every source edit.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----------------------------------------------------------
# nginx-unprivileged: same nginx, but listens on a high port (8080) and
# runs as a non-root user out of the box — no manual permission/user
# wrangling needed to avoid running the container as root.
FROM nginxinc/nginx-unprivileged:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Container health behavior (masterplan §22 Phase 8): a cheap, dedicated
# endpoint the container runtime can poll to know the app is actually
# serving, not just that the process exists.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
