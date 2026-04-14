---
name: tm:create-flowchart
metadata: version: 1.00
description: |
  Skill for creating flowchart and graph diagrams using Mermaid syntax. Use this when asked to create architecture diagrams, component relationship diagrams, or process flowcharts.
---

# Create Flowchart/Graph Diagram Skill

## Purpose
Create flowchart and graph diagrams using Mermaid syntax to visualize component relationships, architecture overviews, and process flows.

## When to Use
- User asks to create an architecture diagram
- User wants to show component relationships
- User needs a process flowchart
- User asks to visualize system structure

## Syntax Reference

### Basic Structure
```mermaid
graph TD
    A[Node A] --> B[Node B]
    B --> C[Node C]
```

### Direction Options
- `TD` or `TB` = Top to Down/Bottom
- `LR` = Left to Right
- `RL` = Right to Left
- `BT` = Bottom to Top

### Node Shapes
| Syntax | Shape | Use For |
|--------|-------|---------|
| `[text]` | Rectangle | Standard nodes, processes |
| `(text)` | Rounded | Start/end, decisions |
| `[(text)]` | Cylinder | Database, storage |
| `{text}` | Diamond | Decision points |
| `>text]` | Flag | Async processes |
| `((text))` | Circle | Events, triggers |

### Connection Types
| Syntax | Line Type |
|--------|-----------|
| `-->` | Arrow |
| `---` | Line (no arrow) |
| `-.->` | Dotted arrow |
| `==>` | Thick arrow |
| `--text-->` | Arrow with label |

### Subgraphs
```mermaid
graph TD
    subgraph "Service Layer"
        A[API Gateway]
        B[Auth Service]
    end
    subgraph "Data Layer"
        C[(Database)]
    end
    A --> B
    B --> C
```

## Step-by-Step Process

### 1. Identify Components
- List all entities/components to include
- Determine their types (service, database, client, etc.)
- Map relationships between components

### 2. Choose Direction
- `LR` for horizontal flows (API calls, data pipelines)
- `TD` for hierarchical structures (org charts, layered architecture)

### 3. Organize with Subgraphs
Group related components:
- By layer (presentation, business, data)
- By domain (auth, billing, users)
- By environment (client, server, external)

### 4. Create the Diagram
```mermaid
graph TD
    subgraph Client
        A[Web App]
        B[Mobile App]
    end

    subgraph "Backend Services"
        C[API Gateway]
        D[User Service]
        E[Order Service]
    end

    subgraph "Data Layer"
        F[(PostgreSQL)]
        G[(Redis Cache)]
    end

    A --> C
    B --> C
    C --> D
    C --> E
    D --> F
    E --> F
    D --> G
```

## Quality Standards
- Quote labels with special characters: `["Label (info)"]`
- Use meaningful node IDs
- Keep diagrams focused (max 15-20 nodes)
- Use subgraphs for organization
- Add descriptive edge labels for clarity

## Example Usage

### Architecture Overview
User: "Create a diagram of our microservices architecture"

```mermaid
graph LR
    subgraph "API Layer"
        GW[API Gateway]
    end

    subgraph "Core Services"
        AUTH[Auth Service]
        USER[User Service]
        ORDER[Order Service]
    end

    subgraph "Data"
        DB[(PostgreSQL)]
        CACHE[(Redis)]
    end

    GW --> AUTH
    GW --> USER
    GW --> ORDER
    AUTH --> DB
    USER --> DB
    ORDER --> DB
    AUTH --> CACHE
```
