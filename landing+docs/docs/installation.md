---
sidebar_position: 5
sidebar_label: Installation
---

# Installation Guide

## Prerequisites

Before installing TimeLord, ensure you have the following:

- **Node.js** version 20.0 or above (for the server)
- **Go** version 1.24 or above (for the agent)
- **PostgreSQL** database (version 12 or higher)
- **Docker** and **Docker Compose** (recommended for easy setup)

### Optional Requirements

- **HashiCorp Vault** (for secret management)
- **OIDC Provider** (for authentication - Google, GitHub, Okta, etc.)

## Quick Start with Docker Compose

The easiest way to get started is using Docker Compose:

```bash
git clone https://github.com/yourusername/timelord.git
cd timelord
docker-compose up -d
```

The server will start on `http://localhost:9988`.

## Manual Installation

### 1. Install the Server

```bash
cd server
npm install
# Configure environment variables (see Configuration page)
npm run dev
```

### 2. Set Up the Database

```bash
# Run migrations
npx prisma migrate dev
```

### 3. Install the UI

```bash
cd ui
npm install
npm run dev
```

The UI will be available at `http://localhost:3000`.

### 4. Install the Agent

See the [Agent Installation Guide](/agent/README.md) for detailed instructions on deploying agents to your machines.

## Configuration

Before running TimeLord, configure the required environment variables:

1. Copy the example configuration: `cp .env.example .env`
2. Update with your settings (see [Configuration](./configuration.md) page)
3. For OIDC authentication, set up your OAuth provider
4. (Optional) For Vault integration, configure your Vault server

## Verification

Once installed, verify everything is working:

1. Navigate to `http://localhost:9988`
2. Log in with your authentication provider
3. Register your first agent
4. Create and run a test job

## Next Steps

- [Configure your first agent](./agents.md)
- [Set up Git repositories](./git-configuration.md)
- [Create your first job](./jobs.md)
