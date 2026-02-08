FROM node:24-alpine

ARG CI_COMMIT_SHA
ARG CI_PIPELINE_CREATED
ENV CI_COMMIT_SHA=$CI_COMMIT_SHA
ENV CI_PIPELINE_CREATED=$CI_PIPELINE_CREATED

RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

WORKDIR /app

RUN apk add --update --no-cache openssh git

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY --chown=node:node server/package.json /app/server/package.json

RUN pnpm install --frozen-lockfile

COPY --chown=node:node server/src /app/server/src
COPY --chown=node:node server/prisma /app/server/prisma
COPY --chown=node:node server/prisma.config.mts /app/server/prisma.config.mts
COPY --chown=node:node server/tsconfig.json /app/server/tsconfig.json

USER node

WORKDIR /app/server

CMD pnpm start
