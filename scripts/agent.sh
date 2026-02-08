# This is a script to install the agent on your machine
#
# Linux: It will create a service to run the agent
# MacOS: To be defined

# First argument should be a valid Gitea token
AGENT_TOKEN=$1

SYSTEMCTL_FILENAME="/etc/systemd/system/timelord.service"

if [[ $AGENT_TOKEN == "" ]]; then
  echo "⚠️ You must provide Agent token as second argument"
  exit 1
fi

ARCH=$(arch)
OS=$(uname)
if [[ $(uname) == "Darwin" ]]; then
  OS="Darwin"
fi
if [[ "$ARCH" = "aarch64" ]]; then
  ARCH="arm64"
fi

NAME="timelord_$OS""_$ARCH.tar.gz"

curl -s -H "Authorization: token $TOKEN" \
  "https://github.com/Tchoupinax/timelord/releases/download/latest/$NAME" \
  --output $NAME

tar xvf $NAME
rm -rf $NAME

sudo mv timelord-agent /usr/local/bin/timelord

# On Linux, we start the program with a service
if [[ $OS = "Linux" ]]; then
  cat <<EOF >/tmp/timelord.service
[Unit]
Description=timelord-agent
After=network.target

[Service]
Type=simple
WorkingDirectory=/tmp
ExecStart=/usr/local/bin/timelord
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=TimelordAgent
User=root
Group=root
Environment=API_URL=https://crons.mysupercloud.dev/api
Environment=AGENT_TOKEN=$AGENT_TOKEN

[Install]
WantedBy=multi-user.target
EOF

  sudo mv /tmp/timelord.service $SYSTEMCTL_FILENAME

  sudo systemctl enable timelord
  sudo systemctl restart timelord

  # For debugging purpose
  # sudo systemctl status timelord
  # Show logs
  # sudo journalctl -u timelord.service -e
else
  AGENT_TOKEN=$AGENT_TOKEN API_URL=https://crons.mysupercloud.dev/api timelord
fi
