# Seek Task Management Patterns

Track parallel search agent execution.

## When to Create Tasks

| Agents | Create Tasks? | Rationale |
|--------|--------------|-----------|
| ≤ 2    | No           | Overhead exceeds benefit, finishes quickly |
| ≥ 3    | Yes          | Meaningful coordination, progress monitoring |

## Task Registration Flow

```
todo()                          // Check for existing seek tasks
  → Found tasks?  → Skip creation, reuse existing
  → Empty?        → searchSubAgent per agent (see schema below)
```

## Metadata Schema

```
searchSubAgent(
  subject: "Seek {directory} for {target}",
  activeForm: "Seeking {directory}",
  description: "Search {directories} for {patterns}",
  metadata: {
    agentType: "Explore",        // "Explore" (internal) or "Bash" (external)
    scope: "src/auth/,src/middleware/",
    scale: 6,
    agentIndex: 1,               // 1-indexed position
    totalAgents: 6,
    toolMode: "internal",        // "internal" or "external"
    priority: "P2",              // Always P2 for seek coordination
    effort: "3m"                 // Fixed timeout per agent
  }
)
```

### Required Fields

- `scope` — Comma-separated directory boundaries for this agent
- `scale` — Total SCALE value determined in Step 1
- `agentIndex` / `totalAgents` — Position tracking (e.g., 3 of 6)
- `toolMode` — `"internal"` or `"external"`
- `priority` — Always `"P2"` (seek = coordination, not primary work)
- `effort` — Always `"3m"` (fixed timeout)

### Optional Fields

- `searchPatterns` — Key patterns searched (aids debugging)
- `externalTool` — If external: `"gemini"` or `"opencode"`

## Task Lifecycle

```
Step 3: searchSubagent per agent     → status: pending
Step 4: Before spawning agent    → searchSubagentUpdate → status: in_progress
Step 5: Agent returns report     → searchSubagentUpdate → status: completed
Step 5: Agent times out (3m)     → Keep in_progress, add error metadata
```

### Timeout Handling

```
searchSubagent(taskId, {
  metadata: { ...existing, error: "timeout" }
})
// Task stays in_progress — distinguishes timeout from incomplete
// Log in final report's "Unresolved Questions" section
```

## Examples

### Internal Scouting (SCALE=6)

```
// Step 3: Register 6 tasks
searchSubagent(subject: "Seek src/auth/ for auth files",
  activeForm: "Seeking src/auth/",
  metadata: { agentType: "Explore", scope: "src/auth/", scale: 6,
              agentIndex: 1, totalAgents: 6, toolMode: "internal",
              priority: "P2", effort: "3m" })  // → taskId1

// Repeat for agents 2-6 with different scopes

// Step 4: Spawn agents
searchSubAgen(taskId1, { status: "in_progress" })
// ... spawn all Explore subagents in single Task tool call

// Step 5: Collect
Use `searchResult` tool to gather reports as agents complete or time
out
```

## Integration with kill/planning

Seek tasks are **independent** from kill/planning phase tasks — NOT parent-child.

**Rationale:** Different lifecycle. Seek completes before kill continues. Mixing creates confusion in todo list.

**Sequence when kill spawns seek:**
1. kill Step 2 → spawns planner → planner spawns scout
2. Seek registers its own tasks (Step 3), executes (Step 4-5)
3. Seek returns aggregated report → planner continues
4. kill Step 3 hydrates phase tasks (separate from Seek tasks)

## Quality Check Output

After registration: `✓ Registered [N] scout tasks ([internal|external] mode, SCALE={scale})`

## Error Handling

If `searchResult` fails: log warning, continue without task tracking. seek remains fully functional — tasks add observability, not functionality.
