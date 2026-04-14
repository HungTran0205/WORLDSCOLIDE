---
name: requesting-code-review
description: General process for requesting code reviews from tm.code-reviewer agent. For scenario-specific details, see file-review.md, plan-review.md, or pr-review.md.
---

# Requesting Code Review

Invoke tm.code-reviewer agent to catch issues before they cascade.

**Core principle:** Review early, review often.

## Auto-Detection

Agent automatically detects review type from input:
- **File path** → File review (details: `file-review.md`)
- **JIRA code/plan folder** → Plan review (details: `plan-review.md`)
- **PR URL** → Pull request review (details: `pr-review.md`)

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature or plan implementation
- Before merge to main or creating PR

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bugs
- When unsure about code quality

## How to Invoke

Use `runSubagent` tool with tm.code-reviewer agent:

```
runSubagent(
  agentName: "tm.code-reviewer",
  prompt: "[file path | JIRA code | PR URL]",
  description: "Code review"
)
```

**Input Examples:**
- File: `Review OrderService.java`
- Plan: `Review HTM-34445 implementation`
- PR: `Review https://github.com/hansen-technologies/cis-hu-tm-java/pull/1192`
- With tests: `Review HTM-34445 implementation and run tests`

## Agent Response

**Returns:** Comprehensive markdown report with:
- Review type and scope
- Overall assessment
- Issues by severity (Critical, High, Medium, Low)
- Positive observations
- Recommended actions with code examples
- Metrics and completion status (plan reviews)

## Taking Action

**Priority Levels:**
- **Critical:** Fix immediately - blocks merge/deployment
- **High/Important:** Fix before proceeding to next task
- **Medium:** Address before PR or note for later
- **Low:** Optional improvements

**When to Push Back:**
- Reviewer lacks context
- Feedback technically incorrect
- Conflicts with architectural decisions
- Use technical reasoning, reference working code

## Workflow Integration

**Subagent-Driven Development:**
- Review after EACH task completion
- Fix issues before next task

**Plan Execution:**
- Review after phase implementation
- Validate against requirements
- Ensure TODO items completed

**Pull Request Workflow:**
- Review before requesting human reviewer
- Fix automated findings first

**Ad-Hoc Development:**
- Review before committing
- Review when stuck
- Review after bug fixes

## Scenario-Specific Details

For detailed processes per scenario:
- **File review:** See `file-review.md`
- **Plan review:** See `plan-review.md`
- **PR review:** See `pr-review.md`