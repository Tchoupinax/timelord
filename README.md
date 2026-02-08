# timelord

![frontend](https://img.shields.io/badge/frontend-Nuxt.js-green?style=for-the-badge)
![backend](https://img.shields.io/badge/backend-Node.js-purple?style=for-the-badge)
![agent](https://img.shields.io/badge/agent-Golang-blue?style=for-the-badge)

[![NodeJS](https://img.shields.io/badge/Node.js_v24-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](#)
[![Golang](https://img.shields.io/badge/Golang_v1.24-118293?style=for-the-badge&logo=go&logoColor=white)](#)

## Overview

**TimeLord** is your friendly task manager that helps you run jobs and commands across multiple machines. 🚀

Imagine you need to:
- Run backups on multiple servers at specific times
- Execute maintenance tasks across your infrastructure

TimeLord makes this easy! You just tell it what to do and when to do it through a nice web interface, and it takes care of executing these tasks on your behalf.

## Key Features

- 🎯 Schedule and manage jobs across multiple servers
- 🤖 Lightweight agents deployed on your infrastructure
- 🔒 Secure with OIDC authentication and Vault integration
- 📊 Real-time job monitoring and logging
- 🔧 Execute scripts directly from Git repositories

## 📚 Documentation

**All detailed documentation has been moved to the official docs site!** 

👉 **[Read the full documentation](./landing+docs/docs)** for:
- [Getting Started Guide](./landing+docs/docs/intro.md)
- [Installation Instructions](./landing+docs/docs/installation.md)
- [Configuration Reference](./landing+docs/docs/configuration.md)
- [Architecture & How It Works](./landing+docs/docs/architecture.md)
- [Features Overview](./landing+docs/docs/features.md)

## Quick Start

The fastest way to get started is with Docker Compose:

```bash
git clone https://github.com/Tchoupinax/timelord.git
cd timelord
docker-compose up -d
```

Then visit `http://localhost:9988` to access the dashboard.

For more detailed setup instructions, see the [Installation Guide](./landing+docs/docs/installation.md).

## Architecture

TimeLord consists of three main components:

1. **Server** (Node.js + TypeScript): Central control system
2. **UI** (Nuxt.js): Web dashboard for management
3. **Agent** (Go): Lightweight program running on your machines

## Project Structure

- **`server/`** - Node.js backend API
- **`ui/`** - Nuxt.js frontend dashboard
- **`agent/`** - Go-based agent for executing jobs
- **`landing+docs/`** - Docusaurus documentation site
- **`scripts/`** - Utility scripts for development and deployment

## Component Documentation

- [Agent Documentation](./agent/README.md)
- [Server Documentation](./server/README.md)
- [UI Documentation](./ui/README.md)

## Contributing

We welcome contributions! Please feel free to submit a pull request.

## License

[Add your license information here]

---

**Need help?** Check out the [documentation](./landing+docs/docs) or open an [issue on GitHub](https://github.com/Tchoupinax/timelord/issues).

