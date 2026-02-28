---
sidebar_position: 1
sidebar_label: Getting Started
---

# Getting Started with Timelord

Welcome to **Timelord** - your friendly task manager that helps you run jobs and commands across multiple computers! ⏰

## What is Timelord?

Timelord is a distributed task orchestration system that makes it easy to:

- 🎯 Schedule and manage CRON jobs across multiple servers
- 🤖 Deploy agents that execute tasks on your behalf
- 🔒 Keep your infrastructure secure with OIDC authentication
- 📊 Monitor task execution in real-time
- 🔧 Execute scripts directly from Git repositories

## Quick Start

### What you'll need

- **Node.js** version 20.0 or above for the server
- **Go** version 1.24 or above for the agent
- **PostgreSQL** database for data storage
- (Optional) **Vault** for secure secret management
- (Optional) **OIDC provider** for authentication

### Architecture Overview

Timelord consists of three main components:

1. **Server** (Node.js + TypeScript): The central control system
2. **UI** (Nuxt.js): Beautiful web dashboard for management
3. **Agent** (Go): Lightweight program that runs on your servers

## Installation

### 1. Start the Server

First, clone the repository and start the server:

```bash
git clone https://github.com/yourusername/timelord.git
cd timelord/server
```

The server will start on `http://localhost:9988`.

### 2. Launch the UI

In a new terminal, start the web interface:

```bash
cd timelord/ui
```

The UI will be available at `http://localhost:3000`.

### 3. Install an Agent

On the server where you want to run tasks:

```bash
# Download the agent
wget https://github.com/yourusername/timelord/releases/latest/download/timelord-agent_linux_amd64.tar.gz

# Extract
tar -xzf timelord-agent_linux_amd64.tar.gz

# Run the installation script
./install.sh
```

Follow the prompts to configure your agent with the server URL and authentication token.

## Configuration

### Server Environment Variables

| Variable                 | Required | Default | Description                               |
| ------------------------ | -------- | ------- | ----------------------------------------- |
| `DISABLE_AUTHENTICATION` | No       | `false` | Disable authentication (for testing only) |
| `OIDC_CLIENT_ID`         | Yes\*    | -       | OIDC client ID                            |
| `OIDC_CLIENT_SECRET`     | Yes\*    | -       | OIDC client secret                        |
| `OIDC_PROVIDER_NAME`     | Yes\*    | -       | OIDC provider name                        |
| `OIDC_PROVIDER_IMAGE`    | Yes\*    | -       | OIDC provider logo URL                    |
| `DATABASE_URL`           | Yes      | -       | PostgreSQL connection string              |

\*Required if authentication is enabled

### Vault Integration (Optional)

To store secrets securely in Vault:

- `VAULT_ADDR`: Vault server address
- `VAULT_PATH`: Path in format `{engine}/data/{secret-name}`
- `VAULT_TOKEN`: Token to access Vault API

### Script final state (TIMELORD_STATE)

Your scripts can report a final state (**Success**, **Warning**, or **Error**) by writing to the file path in the **`TIMELORD_STATE`** environment variable. This is optional; if you don’t use it, the job result is still based on the script’s exit code.

See [Script final state (TIMELORD_STATE)](./timelord-state.md) for details and examples.

## Next Steps

Now that you have Timelord set up, you can:

<!--- 📖 [Create your first job](./tutorial-basics/create-a-document.md)
- 🤖 [Manage agents](./tutorial-basics/create-a-page.md)
- 🔧 [Configure Git integration](./tutorial-basics/create-a-blog-post.md)
- 🔒 [Set up secrets management](./tutorial-basics/deploy-your-site.md)-->

## Need Help?

- 📚 Browse the [documentation](./intro)
- 🐛 Report issues on [GitHub](https://github.com/Tchoupinax/timelord/issues)
- 💬 Join our community discussions

---

**Happy orchestrating! 🎉**
