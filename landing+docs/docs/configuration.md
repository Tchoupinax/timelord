---
sidebar_position: 3
sidebar_label: Configuration
---

# Configuration

TimeLord uses environment variables for configuration. Below is a complete reference of all available options. They are foundable at `server/.env.example`

## 🤖 Agent variables

| Variable         | Required | Default                 | Description                                                                   |
| ---------------- | -------- | ----------------------- | ----------------------------------------------------------------------------- |
| `API_URL`        | No       | `http://localhost:9988` | Reachable URL of the TimeLord API server                                      |
| `AGENT_HOSTNAME` | No       | hostname of the machine | Name the agent will use when talking to the server, useful to know who is who |
| `AGENT_TOKEN`    | Yes      | -                       | Authentication of the agent from the server                                   |

## 💻 Server variables

### 🫆 Database

| Variable            | Required | Default     | Description                |
| ------------------- | -------- | ----------- | -------------------------- |
| `POSTGRES_HOSTNAME` | Yes      | `localhost` | PostgreSQL server hostname |
| `POSTGRES_PORT`     | Yes      | `5432`      | PostgreSQL server port     |
| `POSTGRES_DATABASE` | Yes      | `timelord`  | Database name              |
| `POSTGRES_USERNAME` | Yes      | `postgres`  | Database user              |
| `POSTGRES_PASSWORD` | Yes      | -           | Database password          |

### 🔐 Authentication configuration

#### Disable dashboard authentication

| Variable                 | Required | Default | Description                             |
| ------------------------ | -------- | ------- | --------------------------------------- |
| `DISABLE_AUTHENTICATION` | No       | `false` | Set to `true` to disable authentication |

:::warning
If you disable authentication, the dashboard is public and freely accessible
:::

#### OIDC configuration

When `DISABLE_AUTHENTICATION` is `false`, you must configure OIDC:

| Variable                 | Required              | Description                                                   |
| ------------------------ | --------------------- | ------------------------------------------------------------- |
| `OIDC_CLIENT_ID`         | yes (if auth enabled) | OAuth/OIDC client ID from your identity provider              |
| `OIDC_CLIENT_SECRET`     | yes (if auth enabled) | OAuth/OIDC client secret from your identity provider          |
| `OIDC_PROVIDER_NAME`     | yes (if auth enabled) | Name of your OIDC provider (e.g., "Google", "GitHub", "Okta") |
| `OIDC_PROVIDER_IMAGE`    | yes (if auth enabled) | Logo/image URL of your OIDC provider for UI display           |
| `OIDC_CONFIGURATION_URL` | yes (if auth enabled) | OIDC configuration/discovery URL                              |

### ☕️ Secret Storage with Vault

TimeLord supports HashiCorp Vault for secure secret management:

| Variable      | Required | Default                 | Description                                                    |
| ------------- | -------- | ----------------------- | -------------------------------------------------------------- |
| `VAULT_ADDR`  | No       | `http://localhost:8200` | Vault server address                                           |
| `VAULT_PATH`  | No       | `kv/data/timelord`      | Path to secret in Vault (e.g., `secret/data/timelord-secrets`) |
| `VAULT_TOKEN` | No       | -                       | Token to access Vault API                                      |

:::tip
Vault is optional. If not configured, TimeLord will store secrets in the database.
:::

### 🏠 Disk configuration

| Variable                 | Required | Default | Description                                                    |
| ------------------------ | -------- | ------- | -------------------------------------------------------------- |
| `GIT_CONFIGS_REPOSITORY` | No       | `/tmp`  | Directory to write Git configuration repositories when cloned  |
| `SSH_KEYS_REPOSITORY`    | No       | `/tmp`  | Directory to write SSH keys for Git authentication when cloned |

### 👁️ Complete Example Configuration

```bash
POSTGRES_USERNAME="postgres"
POSTGRES_PASSWORD="mysecret"
POSTGRES_HOSTNAME="localhost"
POSTGRES_PORT="5439"
POSTGRES_DATABASE="postgres"

OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_CONFIGURATION_URL=
OIDC_PROVIDER_IMAGE=
OIDC_PROVIDER_NAME=

UI_URL="http://localhost:3000"

VAULT_ADDR="http://localhost:8200"
VAULT_PATH="kv/data/timelord"
VAULT_TOKEN="root"
```
