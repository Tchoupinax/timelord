FROM alpine:3.23.3

RUN addgroup -S -g 999 timelord && \
    adduser -S -u 999 -G timelord timelord

COPY main /usr/bin/timelord

RUN chown timelord:timelord /usr/bin/timelord

USER timelord

CMD ["/usr/bin/timelord"]
