# Subagent Patterns

Standard patterns for spawning and using subagents in kill workflows.

## Task Tool Pattern
```
runSubagent(subagent_type="[type]", prompt="[task description]", description="[brief]")
```

## Research Phase
```
runSubagent(subagent_type="tm.researcher", prompt="Research [topic]. Report ≤150 lines.", description="Research [topic]")
```
- Use multiple researchers in parallel for different topics
- Keep reports ≤150 lines with citations

## Planning Phase
```
runSubagent(subagent_type="tm.planner", prompt="Create implementation plan based on reports: [reports]. Save to [path]", description="Plan [feature]")
```
- Input: researcher and scout reports
- Output: `plan.md` + `phase-XX-*.md` files

## UI Implementation
```
runSubagent(subagent_type="tm.ui-ux-designer", prompt="Implement [feature] UI per ./docs/design-guidelines.md", description="UI [feature]")
```
- For frontend work
- Follow design guidelines

## Code Review
```
runSubagent(subagent_type="tm.code-reviewer", prompt="Review changes for [phase]. Check security, performance, YAGNI/KISS/DRY. Return score (X/10), critical, warnings, suggestions.", description="Review [phase]")
```

## Documentation
```
runSubagent(subagent_type="tm.technical-doc", prompt="Update docs for [phase]. Changed files: [list]", description="Update docs")
```

## Git Operations
```
runSubagent(subagent_type="tm.gitmanager", prompt="Stage and commit changes with conventional commit message", description="Commit changes")
```

## Parallel Execution
```
runSubagent(subagent_type="tm.developer", prompt="Implement [phase-file] with file ownership: [files]", description="Implement phase [N]")
```
- Launch multiple for parallel phases
- Include file ownership boundaries
