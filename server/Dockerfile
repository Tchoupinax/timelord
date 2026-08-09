# syntax=docker/dockerfile:1

# Build on the native host arch (BUILDPLATFORM) so pnpm/prisma do not run under QEMU.
# supportedArchitectures still pulls optional deps for TARGETARCH.
FROM --platform=$BUILDPLATFORM node:24-alpine AS builder

ARG TARGETARCH

WORKDIR /app

RUN corepack enable && corepack prepare pnpm --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/

# Docker TARGETARCH (amd64/arm64) -> Node/pnpm CPU (x64/arm64)
RUN case "$TARGETARCH" in \
      amd64) PNPM_CPU=x64 ;; \
      arm64) PNPM_CPU=arm64 ;; \
      *) PNPM_CPU="$TARGETARCH" ;; \
    esac \
 && printf '%s\n' \
      "supportedArchitectures.os=linux" \
      "supportedArchitectures.cpu=${PNPM_CPU}" \
      "supportedArchitectures.libc=musl" \
      > .npmrc \
 && pnpm install --frozen-lockfile --filter @timelord/server

COPY server/prisma server/prisma
COPY server/prisma.config.mts server/
COPY server/src server/src

WORKDIR /app/server

RUN pnpm generate

WORKDIR /app

RUN pnpm deploy --filter=@timelord/server --prod --legacy /deploy

FROM node:24-alpine AS runner

ARG TARGETARCH
ARG CI_COMMIT_SHA
ARG CI_PIPELINE_CREATED

ENV CI_COMMIT_SHA=$CI_COMMIT_SHA
ENV CI_PIPELINE_CREATED=$CI_PIPELINE_CREATED
ENV NODE_ENV=production

RUN apk add --no-cache ca-certificates git openssh-client \
    && addgroup -S -g 1001 timelord \
    && adduser -S -u 1001 -G timelord timelord

WORKDIR /app

COPY --from=builder --chown=timelord:timelord /deploy /app

USER root

RUN rm -rf \
      node_modules/.pnpm/@prisma+studio-core* \
      node_modules/.pnpm/@prisma+dev@* \
      node_modules/.pnpm/typescript@* \
      node_modules/.pnpm/react-dom@* \
      node_modules/.pnpm/react@* \
      node_modules/.pnpm/chart.js@* \
      node_modules/.pnpm/prisma@* \
      node_modules/.pnpm/@electric-sql+pglite@* \
      node_modules/.pnpm/effect@* \
    && case "$TARGETARCH" in \
         amd64) rm -rf node_modules/.pnpm/@esbuild+linux-arm64* node_modules/.pnpm/@esbuild+darwin* ;; \
         arm64) rm -rf node_modules/.pnpm/@esbuild+linux-x64* node_modules/.pnpm/@esbuild+darwin* ;; \
       esac \
    && find node_modules -type f \( -name "*.map" -o -name "*.md" \) -delete 2>/dev/null || true \
    && chown -R timelord:timelord /app

USER timelord

CMD ["node", "--import", "tsx", "src/index.mts"]
