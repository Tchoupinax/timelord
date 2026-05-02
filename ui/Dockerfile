FROM node:25-alpine

RUN addgroup -S -g 999 timelord && \
    adduser -S -u 999 -G timelord timelord

WORKDIR /app

COPY .output /app/output

RUN chown -R timelord:timelord /app

USER timelord

CMD ["node", "output/server/index.mjs"]
