export VAULT_ADDR="http://127.0.0.1:8200"
export VAULT_TOKEN="root"
vault secrets enable -path=kv kv-v2 &>/dev/null || true
vault kv put kv/timelord user=admin password=test TEST_SECRET="This is my secret"
