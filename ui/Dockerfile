FROM node:26.12.1-alpine

RUN addgroup -S -g 1001 timelord && \
    adduser -S -u 1001 -G timelord timelord

WORKDIR /app

COPY .output /app/output

RUN chown -R timelord:timelord /app

USER timelord

CMD ["node", "output/server/index.mjs"]
