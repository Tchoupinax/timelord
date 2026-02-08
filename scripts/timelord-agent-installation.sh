# This is a script to install the agent on your machine
#
# Linux: It will create a service to run the agent
# MacOS: To be defined

AGENT_TOKEN=$1
if [[ $AGENT_TOKEN == "" ]]; then
  echo "⚠️ You must provide agent token as first argument"
  echo ""
  echo "usage: ./timelord.sh my-token-123 https://api.domain.com"
  exit 1
fi

API_URL=$2
if [[ $API_URL == "" ]]; then
  echo "⚠️ You must provide api url as second argument"
  echo ""
  echo "usage: ./timelord.sh my-token-123 https://api.domain.com"
  exit 1
fi

###########################################################################
###########################################################################

SYSTEMCTL_FILENAME="/etc/systemd/system/timelord.service"

ARCH=$(arch)
OS=$(uname)
if [[ $(uname) == "Darwin" ]]; then
  OS="Darwin"
fi
if [[ "$ARCH" = "aarch64" ]]; then
  ARCH="arm64"
fi

NAME="timelord_$OS""_$ARCH.tar.gz"

curl -L \
  "https://github.com/Tchoupinax/timelord/releases/latest/download/$NAME" \
  -o "$NAME"

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
Environment=API_URL=$API_URL
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
  AGENT_TOKEN=$AGENT_TOKEN API_URL=$API_URL timelord
fi
