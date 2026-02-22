# timelord

![frontend](https://img.shields.io/badge/frontend-Nuxt.js-green?style=for-the-badge)
![backend](https://img.shields.io/badge/backend-Node.js-purple?style=for-the-badge)
![agent](https://img.shields.io/badge/agent-Golang-blue?style=for-the-badge)

[![NodeJS](https://img.shields.io/badge/Node.js_v24-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](#)
[![Golang](https://img.shields.io/badge/Golang_v1.24-118293?style=for-the-badge&logo=go&logoColor=white)](#)

## Agent installation

```bash
curl -o- -s https://raw.githubusercontent.com/Tchoupinax/timelord/refs/heads/master/scripts/timelord-agent-installation.sh \
  | bash -s -- <token> https://my.domain.com/api
```

## Table of content

[FAQ: explain me how does it work](#heading-title)
[How jobs are performed?](#heading-title)

## Overview

TimeLord is your friendly task manager that helps you run jobs and commands across multiple machines.

### What does it do?

Imagine you need to:

- Run backups on multiple servers at specific times
- Execute maintenance tasks across your infrastructure

TimeLord makes this easy! You just tell it what to do and when to do it through a nice web interface, and it takes care of executing these tasks on your behalf.

### How does it work?

1. **Central Control**: A web dashboard where you manage everything
2. **Agents**: Small programs that run on your computers and execute the tasks
3. **Secure Communication**: Everything is authenticated and encrypted
4. **Smart Scheduling**: Run tasks once, on a schedule, or based on events

It's like having a reliable assistant that makes sure all your automated tasks run smoothly across your entire infrastructure.

## Features

## Configuration

| variable               | required?                | default | comment                                                                                                       |
| ---------------------- | ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------- |
| DISABLE_AUTHENTICATION | no                       | false   | If authentication is disabled, all API is opened and you have only one user because you access to everything. |
| OIDC_CLIENT_ID         | yes (if auth is enabled) |         |                                                                                                               |
| OIDC_CLIENT_SECRET     | yes (if auth is enabled) |         |                                                                                                               |
| OIDC_PROVIDER_NAME     | yes (if auth is enabled) |         |                                                                                                               |
| OIDC_PROVIDER_IMAGE    | yes (if auth is enabled) |         |                                                                                                               |

### Store password inside Vault backend

- VAULT_ADDR: `Address for Vault`
- VAULT_PATH: `{secret-engine-name}/data/{secret-name}`
- VAULT_TOKEN: `Token to access Vault API`

### How to install

[Install agent](/agent/README.md)

## FAQ: explain me how does it work

### Git configurations

```mermaid
sequenceDiagram
    User->>TimelordServer: Configure git configuration <br> (URL + Authentication)
    TimelordServer->>TimelordDatabase: Persist configuration + SSHKey
    TimelordDatabase-->>TimelordServer: OK
    TimelordServer-->>User: OK
    User->>User: Later
    TimelordServer->>Git: Clone repository request
    Git-->>TimelordServer: Write git content on disk
    User->>Git: Commit a script
    Git-->>User: OK
```

### How jobs are performed?

```mermaid
sequenceDiagram
  Agent->>Server: Do you have a job for me?
  Server-->>Agent: No
  Agent->>Agent: Waits a while
  Agent->>Server: Do you have a job for me?
  Server-->>Agent: Yes, take this job<br>(+ I tell you if you require assets)
  alt when not asset is required
    Agent->>Agent: Perfoms the job
  else when asset is required
    Agent->>Server: Request asset for this job
    Server->>Agent: return compressed asset
    Agent->>Agent: uncompress asset in the context
    Agent->>Agent: Perfoms the job in the same context <br>of extracted asset
  end
  Agent-->>Server: Streams logs...
  Agent->> Server: Job done
```

### Alternative project

- [CronMaster](https://github.com/fccview/cronmaster)
- [IronMount](https://github.com/nicotsx/ironmount)

gerer les erreurs quand une variabled d'env n'est pas trouvée et l'afficher sur la page pour l'user
