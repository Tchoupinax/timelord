#!/bin/bash
#>> Timelord
#>> What: Backup gitea logs
i=1
while [ "$i" -le 20 ]; do
  echo "backup line $i"
  i=$((i + 1))
done
printf 'Transferred: 1%%\rTransferred: 100%%\n'
echo "backup finished"
