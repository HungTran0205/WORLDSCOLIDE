---
name: tm:seek
description: "Fast codebase searching using parallel search Sub Agent. Use for file discovery, task context gathering, quick searches across directories."
metadata: version: 1.00
---

# Seek

Fast, token-efficient codebase seeking using parallel agents to find files needed for tasks.

## Arguments
- Default: Seek using built-in Explore subagents in parallel (`./references/agent-seeking.md`)

## When to Use

- Beginning work on feature spanning multiple directories
- User mentions needing to "find", "locate", or "search for" files
- Starting debugging session requiring file relationships understanding
- User asks about project structure or where functionality lives
- Before changes that might affect multiple codebase parts

## Quick Start

1. Analyze user prompt to identify search targets
2. Use a wide range of findSearch and textSearch patterns to find relevant files and estimate scale of the codebase
3. Spawn parallel agents with divided directories
4. Use `searchResult` to collect results into concise report

## Workflow

### 1. Analyze Task
- Parse user prompt for search targets
- Identify key directories, patterns, file types, lines of code
- Determine optimal SCALE value of subagents to spawn

### 2. Divide and Conquer
- Split codebase into logical segments per agent
- Assign each agent specific directories or patterns
- Ensure no overlap, maximize coverage

### 3. Register Search Tasks
- **Skip if:** Agent count ≤ 2 (overhead exceeds benefit)
- Check for existing search tasks in session
- If not found, `searchSubagent` per agent with scope metadata
- See `references/task-management-seeking.md` for patterns and examples

### 4. Spawn Parallel Agents
Load appropriate reference based on decision tree:
- **Internal (Default):** `references/agent-seeking.md` (search subagents)

**Notes:**
- Prompt detailed instructions for each subagent with exact directories or files it should read
- Remember that each subagent has less than 200K tokens of context window
- Amount of subagents to-be-spawned depends on the current system resources available and amount of files to be scanned
- Each subagent must return a detailed summary report to a main agent

### 5. Collect Results
- Timeout: 3 minutes per agent (skip non-responders)
- Aggregate findings into single report
- List unresolved questions at end

## Report Format

```markdown
# Scout Report
- `specs/{activefeature}/seek-report-{timestamp}.md`
## Relevant Files
- `path/to/file.ts` - Brief description
- ...

## Unresolved Questions
- Any gaps in findings
```

## References

- `references/agent-seeking.md` - Using Explore subagents for searching
- `references/task-management-seeking.md` - Claude Task patterns for scout coordination
