---
name: tm:code-review
description: Review code quality, receive feedback with technical rigor, verify completion claims. Use before PRs, after implementing features, when claiming task completion, for subagent reviews.
metadata: version: 1.00
---

# Code Review

Guide proper code review practices emphasizing technical rigor, evidence-based claims, and verification over performative responses.

## Overview

Code review supports three distinct scenarios with auto-detection:

1. **File/Class Review** - Deep dive on specific files (e.g., `OrderService.java`)
2. **Plan Implementation Review** - Validate implementation against plan (e.g., `HTM-34445`)
3. **Pull Request Review** - Comprehensive PR analysis (e.g., GitHub PR URL)

Agent auto-detects scenario from input and follows appropriate protocol.

**Core Principles:**
- Technical correctness over social comfort
- Evidence before claims, always
- Verify before implementing feedback
- YAGNI, KISS, DRY in all recommendations

## When to Use This Skill

### Requesting Code Review
Trigger when:
- Completing tasks in subagent-driven development (after EACH task)
- Finishing major features or refactors
- Before merging to main branch
- Stuck and need fresh perspective
- After fixing complex bugs
- Before creating pull request

**Scenario Detection (Auto):**
- File path → File review (e.g., `Review OrderService.java`)
- JIRA code/plan folder → Plan review (e.g., `Review HTM-34445 implementation`)
- PR URL → PR review (e.g., `Review https://github.com/.../pull/1192`)

**References:**
- **File Review:** `references/file-review.md`
- **Plan Review:** `references/plan-review.md`
- **PR Review:** `references/pr-review.md`
- **General Process:** `references/requesting-code-review.md`

### Receiving Feedback
Trigger when:
- Receiving code review comments from any source
- Feedback seems unclear or technically questionable
- Multiple review items need prioritization
- External reviewer lacks full context
- Suggestion conflicts with existing decisions

**Reference:** `references/code-review-reception.md`

### Verification Gates
Trigger when:
- About to claim tests pass, build succeeds, or work is complete
- Before committing, pushing, or creating PRs
- Moving to next task
- Any statement suggesting success/completion
- Expressing satisfaction with work

**Reference:** `references/verification-before-completion.md`

## Quick Decision Tree

```
SITUATION?
│
├─ Need code review
│  ├─ Specific file? → tm.code-reviewer with file path
│  ├─ Plan implementation? → tm.code-reviewer with JIRA/plan folder
│  └─ Pull request? → tm.code-reviewer with PR URL
│
├─ Received feedback
│  ├─ Unclear items? → STOP, clarify first
│  ├─ From user? → Understand, implement
│  └─ External? → Verify technically first
│
└─ About to claim completion
   ├─ Have evidence? → State WITH evidence
   └─ No evidence? → RUN verification first
```

## Skill Components

This skill consists of modular protocols. Load appropriate reference based on situation:

### 1. Requesting Code Review
Load: `references/requesting-code-review.md`
**Use when:** Need review of file, plan implementation, or PR

**Scenario-Specific References:**
- File review: `references/file-review.md`
- Plan review: `references/plan-review.md`
- PR review: `references/pr-review.md`

### 2. Receiving Feedback
Load: `references/code-review-reception.md`
**Use when:** Processing review comments, unclear feedback, external suggestions

### 3. Verification Gates
Load: `references/verification-before-completion.md`
**Use when:** About to claim completion, success, or pass status

## Quick Reference

**Requesting Code Review:**
```
runSubagent(
  agentName: "tm.code-reviewer",
  prompt: "[file path | JIRA code | PR URL]",
  description: "Code review"
)
```

**Examples:**
- File: `Review OrderService.java`
- Plan: `Review HTM-34445 implementation`
- PR: `Review https://github.com/.../pull/1192`
- With tests: `Review HTM-34445 and run tests`

**Receiving Feedback:**
- Pattern: READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT
- No performative agreement
- Verify external feedback technically
- If unclear: STOP and clarify ALL items first

**Verification Gates:**
- Iron Law: NO CLAIMS WITHOUT FRESH EVIDENCE
- Gate: IDENTIFY → RUN → READ → VERIFY → THEN claim

## Integration with Workflows

- **Subagent-Driven:** Review after EACH task, verify before next
- **Pull Requests:** Verify tests pass, invoke tm.code-reviewer before merge
- **General:** Apply verification gates before any status claims

## Core Principles

**Technical rigor over social performance**
- Verify. Question. Then implement.
- Evidence. Then claim.
- YAGNI, KISS, DRY always.
