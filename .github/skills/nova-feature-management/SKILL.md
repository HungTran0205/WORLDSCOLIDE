---
name: tm:nova-feature-management
metadata: version: 1.00
description: Manages multi-feature workflows via Node.js scripts. Use for @feature commands and checking active feature context for Nova agents.
---

# Feature Management Skill

Deterministic feature creation, switching, listing, and status tracking for Nova agents.

## When to Use This Skill

- User invokes `@feature` commands (create, switch, list, status, help)
- Agent activation requires checking current feature context
- Working with features in the `specs/` directory

## Instructions

### Pre-Usage: CWD Safety Check (IMPORTANT)

Before running any `feature-cli.js` command, make sure the current working directory (CWD) is the workspace root that contains both `.nova/` and `specs/`.

If `.nova/` or `specs/` is missing in the current folder:
- Change directory to the correct workspace root (the one that should own Nova features).
- If that workspace root doesn’t have `.nova/` yet, run `gh nova init` from that workspace root.

Only after the CWD is correct, run the `feature-cli.js` command.

### Usage

Execute commands via:
```bash
node .github/skills/nova-feature-management/scripts/feature-cli.js <command> [args]
```

| Command | Usage | Description |
|---------|-------|-------------|
| `create` | `create <path>` | Create new feature, initialize requirements.md |
| `switch` | `switch <path>` | Switch to existing feature |
| `list` | `list [category]` | List features in tree view |
| `status` | `status` | Show current active feature |
| `help` | `help [command]` | Show command help |

**Path format:** lowercase letters, numbers, hyphens, underscores. Each segment must start with a lowercase letter. Use `/` for categories (e.g., `auth/login`).

**Output:** JSON with `{ "success": true/false, "data": {...} }` or `{ "error": "...", "code": "..." }`.

## Examples

### Create a feature
```bash
node .github/skills/nova-feature-management/scripts/feature-cli.js create auth/login
```
Map JSON to output: `data.feature`, `data.breadcrumb`, `data.feature` (for path)
```
✅ Feature Created: {data.feature}
📍 Location: {data.breadcrumb}
📄 Initialized: specs/{data.feature}/requirements.md
```

### Switch feature
```bash
node .github/skills/nova-feature-management/scripts/feature-cli.js switch dashboard
```
Map JSON to output: `data.feature`, `data.breadcrumb`
```
🔄 Switched to: {data.feature}
📍 Location: {data.breadcrumb}
```

### Check status (run on agent activation)
```bash
node .github/skills/nova-feature-management/scripts/feature-cli.js status
```
Check `data.hasActiveFeature` to determine which format:

**If `data.hasActiveFeature` is true:** use `data.activeFeature`, `data.breadcrumb`
```
🎯 Active Feature: {data.activeFeature}
📍 Location: {data.breadcrumb}
```

**If `data.hasActiveFeature` is false:**
```
📂 No active feature

🚀 Quick Actions:
• @feature create <name>              Create new feature
• @feature create <category>/<name>   Create in category
• @feature switch <path>              Switch to existing
• @feature list                       Show all features
```

### List features
```bash
node .github/skills/nova-feature-management/scripts/feature-cli.js list
```
Map JSON to output: `data.total`, iterate `data.features[].path`
```
📂 Features ({data.total}):
• {data.features[0].path}
• {data.features[1].path}
...
```

## Reference

**Feature detection:** A directory is a feature if it contains `requirements.md`, `design.md`, or `tasks.md`.

**Error codes:** `INVALID_PATH`, `FEATURE_EXISTS`, `FEATURE_NOT_FOUND`, `MISSING_DIRECTORIES`
