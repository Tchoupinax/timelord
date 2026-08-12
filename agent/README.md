# timelord — `Agent`

## Installation script

```bash
export GITEA_TOKEN=""
export AGENT_TOKEN=""

curl -H "Authorization: token $GITEA_TOKEN" \
  https://github.com/Tchoupinax/timelord/raw/branch/master/scripts/agent.sh | bash -s -- $GITEA_TOKEN $AGENT_TOKEN
```

## Environement variables

- `AGENT_MASTER_TOKEN`: Token to authenticate any agent.
- `AGENT_TOKEN`: Token to identify the agent. This token is specific for only one agent.
- `API_URL`: http endpoint of the API (http://localhost:9988/job)
- `AGENT_AUTO_UPDATE`: optional, defaults to enabled. Set to `false` to disable the automatic agent self-update check.
- `TIMELORD_JOB_TIMEOUT`: optional, defaults to `30m`. Maximum duration of a job before the agent kills the whole script process group and reports the exit code `124`. Accepts a Go duration (`45m`, `2h`); `0` disables the timeout.
- `LOG_LEVEL`: optional, defaults to `info`. One of `trace`, `debug`, `info`, `warn`, `error`, `fatal`. Logs are emitted as JSON on stderr with Victoria Logs-compatible fields (`_msg`, `_time`, `level`).
