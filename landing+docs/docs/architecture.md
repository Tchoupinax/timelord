---
sidebar_position: 4
sidebar_label: How It Works
---

# How It Works

## Architecture Overview

TimeLord is built on a distributed architecture with three main components:

1. **Server** : The central control system that manages jobs, configurations, and agents
2. **Web application** : Web dashboard for managing everything
3. **Agent**: Lightweight program that runs on your machines and executes tasks

## Git Configuration Flow

When you configure a Git repository in TimeLord, here's how it works:

```mermaid
sequenceDiagram
    User->>Timelord Server: Configure git configuration <br> (URL + Authentication)
    Timelord Server->>Timelord Database: Persist configuration + SSHKey
    Timelord Database-->>Timelord Server: OK
    Timelord Server-->>User: OK
    User->>User: Later
    Timelord Server->>Timelord Database: List repositories
    Timelord Database-->>Timelord Server: Configurations + SSHKeys
    Timelord Server->>Git: Clone repository request
    Git-->>Timelord Server: Write git content on disk
```

**Key Points:**
- Credentials and SSH keys are stored in the database
- The server can clone repositories on-demand

:::danger
Private keys are stored in clear in the database. We recommend to use **READ-ONLY** deploy key in this case.
:::

## Job Execution Flow

This diagram shows how jobs are executed by agents:

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
    Agent->>Server: Request assets for this job
    Server->>Agent: return compressed assets
    Agent->>Agent: uncompresss asset in the context
    Agent->>Agent: Perfoms the job in the same context <br>of extracted assets
  end
  Agent-->>Server: Streams logs in live
  Agent->> Server: Job done
```

**Key Points:**
- Agents poll the server for available jobs. This is customizable
- Agents stream logs back to the server in real-time. You can see them in the dashboard
- Jobs can use assets directly in the same folder (like `cat myfile.txt`)
