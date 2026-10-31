FROM alpine:3.24.3

RUN apk add --no-cache bash ca-certificates curl jq

ARG TARGETPLATFORM

COPY $TARGETPLATFORM/timelord-agent /usr/bin/timelord

USER 1001:1001

CMD ["/usr/bin/timelord"]
