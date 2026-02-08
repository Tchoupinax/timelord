#!/bin/bash

#>> Timelord
#>> What: Example timelord <= Assets folder MUST match this
#>> When: 0 */1 * * *
#>> KeepLast: 10

# Very important to throw error!
set -e

echo "Hey it's a test of timelord!"

echo "This script will be performed on machine B"

# I can use terraform because I provided terraform files as assets
terraform apply --auto-approve --no-color
