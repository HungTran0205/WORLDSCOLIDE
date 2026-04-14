---
name: tm:git-manager
metadata: version: 1.00
description: Stage, commit, and push code changes with conventional commits, branch management, and PR creation. Use when user says "commit", "push", "create PR", or finishes a feature/fix. Handles branch naming (feature/bugfix), security checks, commit splitting, and PR workflows.
---

# Git Manager

Manage Git operations for staging, committing, pushing changes, and creating pull requests with automated security checks and conventional commit standards.

## When to Use

- User requests to commit, push, or create PR
- User completes a feature or bug fix
- User asks to create or switch branches
- User needs to manage Git workflow with conventional commits

## Core Capabilities

1. **Branch Management**: Create and switch branches following configurable naming patterns
2. **Commit Operations**: Stage, validate, and commit with security checks and smart splitting
3. **PR Creation**: Generate and create pull requests with AI-assisted titles and descriptions
4. **Security**: Detect secrets before committing

## Configuration

Branch formats and Jira patterns are defined in [config.txt](config.txt).

**If JIRA_PATTERN is empty:**
1. Ask user: "What Jira ticket pattern do you use? (e.g., HTM-12345, PROJ-999)"
2. If user responds with format, update config.txt with extracted pattern (e.g., HTM-[0-9]+)
3. If user doesn't provide pattern, set default: `JIRA_PATTERN=AI-[0-9]+` in config.txt

**Default configuration:**
- Feature branches: `feature/{JIRA}`
- Bugfix branches: `bugfix/{JIRA}`
- Default Jira pattern: `AI-[0-9]+`

See [config.example.txt](config.example.txt) for customization examples.

## Quick Reference

### Branch Operations
- Always create branches from repository's default branch (main, release/CI_...)
- Never commit directly to protected branches (main, master, release*)
- Branch naming configured in [config.txt](config.txt)
- See [Branch Workflows](references/branch-workflows.md)

### Commit Operations
- Execute in 2-4 tool calls maximum
- Stage → Security Check → Commit → Push
- Auto-split commits when mixing types (feat+fix+docs) or multiple scopes
- Commit format configured in [config.txt](config.txt)
- See [Commit Workflows](references/commit-workflows.md)

### PR Operations
- Use REMOTE diff for PR content (not local)
- Fetch → Push → Analyze remote state → Generate PR
- See [PR Workflows](references/pr-workflows.md)

## Workflow Execution

For detailed step-by-step execution instructions:
- **Branch creation/switching**: [Branch Workflows](references/branch-workflows.md)
- **Committing changes**: [Commit Workflows](references/commit-workflows.md)
- **Creating pull requests**: [PR Workflows](references/pr-workflows.md)
- **Commit message standards**: [Commit Standards](references/commit-standards.md)

## Token Optimization

This skill delegates heavy analysis to Gemini Flash 2.5 (13x cheaper) while using efficient compound commands:
- Single commit: 2-3 tool calls, 5-8K tokens
- Multi commit: 3-4 tool calls, 8-12K tokens
- 68-81% cost reduction vs baseline

## Error Handling

Common errors and resolutions documented in [Commit Workflows](references/commit-workflows.md#error-handling).

## Output Format

**Single commit:**
```
✓ staged: 3 files (+45/-12 lines)
✓ security: passed
✓ commit: a3f8d92 HTM-1234 : add token refresh
✓ pushed: yes
```

**Multi commit:**
```
✓ staged: 12 files (+234/-89 lines)
✓ security: passed
✓ split: 3 logical commits
✓ commit 1: b4e9f21 HTM-1234 : update dependencies
✓ commit 2: f7a3c56 HTM-1234 : add login validation
✓ commit 3: d2b8e47 HTM-1234 : update API documentation
✓ pushed: yes (3 commits)
```

Keep output concise (<1k chars).
