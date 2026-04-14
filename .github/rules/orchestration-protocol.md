# Orchestration Protocol

## Delegation Context (MANDATORY)

When spawning subagents via Task tool, **ALWAYS** include in prompt:

1. **Work Context Path**: The git root of the PRIMARY files being worked on
2. **Reports Path**: `{work_context}/specs/reports/` for that project
3. **Plans Path**: `{work_context}/specs/` for that project

**Example:**
```
Task prompt: "Fix parser bug.
Work context: /path/to/project-b
Reports: /path/to/project-b/specs/reports/
Plans: /path/to/project-b/specs/"
```

**Rule:** If CWD differs from work context (editing files in different project), use the **work context paths**, not CWD paths.