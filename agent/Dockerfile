FROM alpine:3.23.5 AS deps

RUN apk add --no-cache bash ca-certificates

FROM scratch

ARG TARGETPLATFORM

COPY --from=deps /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=deps /bin/bash /bin/bash
COPY --from=deps /lib/ld-musl-*.so.1 /lib/
COPY --from=deps /usr/lib/libreadline.so.8 /usr/lib/libreadline.so.8
COPY --from=deps /usr/lib/libreadline.so.8.3 /usr/lib/libreadline.so.8.3
COPY --from=deps /usr/lib/libncursesw.so.6 /usr/lib/libncursesw.so.6
COPY --from=deps /usr/lib/libncursesw.so.6.5 /usr/lib/libncursesw.so.6.5
COPY --from=deps /usr/lib/bash/ /usr/lib/bash/

COPY $TARGETPLATFORM/timelord-agent /usr/bin/timelord

USER 1001:1001

CMD ["/usr/bin/timelord"]
