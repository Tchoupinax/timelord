FROM node:24-alpine

ARG CI_COMMIT_SHA
ARG CI_PIPELINE_CREATED
ENV CI_COMMIT_SHA=$CI_COMMIT_SHA
ENV CI_PIPELINE_CREATED=$CI_PIPELINE_CREATED

RUN corepack enable && corepack prepare pnpm --activate

RUN addgroup -S -g 1001 timelord && \
    adduser -S -u 1001 -G timelord timelord

WORKDIR /app

RUN apk add --update --no-cache openssh git

COPY --chown=timelord:timelord package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY --chown=timelord:timelord server/package.json /app/server/package.json

RUN pnpm install --frozen-lockfile

COPY --chown=timelord:timelord server/src /app/server/src
COPY --chown=timelord:timelord server/prisma /app/server/prisma
COPY --chown=timelord:timelord server/prisma.config.mts /app/server/prisma.config.mts
COPY --chown=timelord:timelord server/tsconfig.json /app/server/tsconfig.json

USER timelord

WORKDIR /app/server

CMD ["pnpm", "start"]
