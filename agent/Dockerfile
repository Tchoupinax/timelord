FROM alpine:3.23.5

ARG TARGETPLATFORM

RUN apk add --no-cache bash && \
    addgroup -S -g 1001 timelord && \
    adduser -S -u 1001 -G timelord timelord

COPY $TARGETPLATFORM/timelord-agent /usr/bin/timelord

RUN chown timelord:timelord /usr/bin/timelord

USER timelord

CMD ["/usr/bin/timelord"]
