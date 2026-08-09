FROM alpine:3.23.5

ARG TARGETPLATFORM

RUN apk add --no-cache bash && \
    addgroup -S -g 1001 timelord && \
    adduser -S -u 1001 -G timelord timelord

COPY $TARGETPLATFORM/timelord-agent /usr/bin/timelord

COPY --from=deps /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=deps /bin/bash /bin/bash
COPY --from=deps /lib/ld-musl-*.so.1 /lib/
COPY --from=deps /usr/lib/libreadline.so.8 /usr/lib/libreadline.so.8
COPY --from=deps /usr/lib/libreadline.so.8.3 /usr/lib/libreadline.so.8.3
COPY --from=deps /usr/lib/libncursesw.so.6 /usr/lib/libncursesw.so.6
COPY --from=deps /usr/lib/libncursesw.so.6.5 /usr/lib/libncursesw.so.6.5
COPY --from=deps /usr/lib/bash/ /usr/lib/bash/

ARG TARGETPLATFORM

COPY $TARGETPLATFORM/timelord-agent /usr/bin/timelord

USER 1001:1001

CMD ["/usr/bin/timelord"]
