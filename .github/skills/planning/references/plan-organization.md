# Plan Creation & Organization

## Directory Structure

### Plan Location

**Important:**
- DO NOT create plans or reports in USER directory.
- ALWAYS create plans or reports in CURRENT WORKING PROJECT DIRECTORY.

Use `Specs dir:` from `## Feature Context` section injected by hooks. This is the full computed path.

**Example:** `specs/251101-1505-authentication/`

### File Organization

IN CURRENT WORKING PROJECT DIRECTORY:
```
{specs-dir}/                                    # From `Specs dir:` in ## Naming section
├── reports/
│   ├── researcher-report.md
│   ├── investigation-report.md
│   └── ...
├── tasks.md                                    # Overview access point
├── phase-01-setup-environment.md              # Setup environment
├── phase-02-implement-database.md             # Database models
├── phase-03-implement-api-endpoints.md        # API endpoints
├── phase-04-implement-ui-components.md        # UI components
├── phase-05-implement-authentication.md       # Auth & authorization
├── phase-06-implement-profile.md              # Profile page
└── phase-07-write-tests.md                    # Tests
```

### Active Plan State Tracking

Check the `## Plan Context` section injected by hooks:
- **"Plan: {path}"** = Active plan - use for reports
- **"Suggested: {path}"** = Branch-matched, hint only - do NOT auto-use
- **"Plan: none"** = No active plan

**Pre-Creation Check:**
1. If "Plan:" shows a path → ask "Continue with existing plan? [Y/n]"
2. If "Suggested:" shows a path → inform user (hint only, do NOT auto-use)
3. If "Plan: none" → create new plan using naming from `## Feature Context` section

**Report Output Rules:**
1. Use `Report:` and `Specs dir:` from `## Feature Context` section
2. Active plans use plan-specific reports path
3. Suggested plans use default reports path to prevent old plan pollution

## File Structure

**Important:**
- DO NOT create plans or reports in USER directory.
- ALWAYS create plans or reports in CURRENT WORKING PROJECT DIRECTORY.

### Overview Plan (tasks.md)

**IMPORTANT:** All tasks.md files MUST include YAML frontmatter. See `output-standards.md` for schema.

**Example tasks.md structure:**
```markdown
---
title: "Feature Implementation Plan"
description: "Add user authentication with OAuth2 support"
status: pending
priority: P1
effort: 8h
issue: 123
branch: kai/feat/oauth-auth
tags: [auth, backend, security]
created: 2025-12-16
---

# Feature Implementation Plan

## Overview

Brief description of what this plan accomplishes.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Setup | Pending | 2h | [phase-01](./phase-01-setup.md) |
| 2 | Implementation | Pending | 4h | [phase-02](./phase-02-impl.md) |
| 3 | Testing | Pending | 2h | [phase-03](./phase-03-test.md) |

## Dependencies

- List key dependencies here
```

**Guidelines:**
- Keep generic and under 80 lines
- List each phase with status/progress
- Link to detailed phase files
- Key dependencies

### Phase Files (phase-XX-name.md)
Fully respect the `./rules/development-rules.md` file.
Each phase file should contain:

**Context Links**
- Links to related reports, files, documentation

**Overview**
- Priority
- Current status
- Brief description

**Key Insights**
- Important findings from research
- Critical considerations

**Requirements**
- Functional requirements
- Non-functional requirements

**Architecture**
- System design
- Component interactions
- Data flow

**File Ownership (CRITICAL for Parallel Execution)**
- **Files This Phase Owns**: List of files this phase exclusively modifies
- **Shared Dependencies**: Files this phase reads but doesn't modify
- **Parallel Phases**: List phases that run concurrently with this one
- **Conflict Prevention**: How this phase avoids file conflicts

**Example:**
```markdown

## File Ownership
**Files This Phase Owns:**
- `src/components/Button.tsx`
- `src/components/Button.test.tsx`
- `src/styles/button.css`

**Shared Dependencies (Read-Only):**
- `src/types/index.ts`
- `src/utils/classnames.ts`

**Parallel Phases:**
- Phase 03 (API Integration) - no file overlap
- Phase 04 (State Management) - no file overlap

**Conflict Prevention:**
This phase only touches UI components in `src/components/`, while parallel phases work in `src/api/` and `src/store/`.
```

**Related Code Files**
- List of files to modify
- List of files to create
- List of files to delete

**Implementation Steps**
- Detailed, numbered steps
- Specific instructions

**Todo List**
- Checkbox list for tracking

**Success Criteria**
- Definition of done
- Validation methods

**Risk Assessment**
- Potential issues
- Mitigation strategies

**Security Considerations**
- Auth/authorization
- Data protection

**Next Steps**
- Dependencies
- Follow-up tasks
