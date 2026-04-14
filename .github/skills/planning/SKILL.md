---
name: tm:planning
metadata: version: 1.00
description: Plan implementations, design architectures, create technical roadmaps with detailed phases. Use for feature planning, system design, solution architecture, implementation strategy, phase documentation.
argument-hint: "[task] OR transformer|validate|red-team"
---

# Planning

Create detailed technical implementation plans through research, codebase analysis, solution design, and comprehensive documentation.

## Default (No Arguments)

If invoked with a task description, proceed with planning workflow. If invoked WITHOUT arguments or with unclear intent, use `askQuestions` to present available operations:

| Operation | Description |
|-----------|-------------|
| `(default)` | Create implementation plan for a task |
| `red-team` | Adversarial plan review |
| `validate` | Critical questions interview |

Present as options via `askQuestions` with header "Planning Operation", question "What would you like to do?".

## When to Use

Use this skill when:
- Planning new feature implementations
- Architecting system designs
- Evaluating technical approaches
- Creating implementation roadmaps
- Breaking down complex requirements
- Assessing technical trade-offs

## Core Responsibilities & Rules

Always honoring **YAGNI**, **KISS**, and **DRY** principles.
**Be honest, be brutal, straight to the point, and be concise.**

### 1. Research & Analysis
Load: `references/research-phase.md`
**Skip if:** Provided with researcher reports

### 2. Codebase Understanding
Load: `references/codebase-understanding.md`
**Skip if:** Provided with seek reports

### 3. Solution Design
Load: `references/solution-design.md`

### 4. Plan Creation & Organization
Load: `references/plan-organization.md`
**IMPORTANT**: All phase files MUST include "File Ownership" sections for parallel execution safety.

### 5. Task Breakdown & Output Standards
Load: `references/output-standards.md`

### 6. Automation Transform Planning
Load: `references/automation-planning.md`
**Trigger:** User provides requirement-analysis.md for test automation
**Output:** `test/{Jira-ID}/{Jira-ID}-automation-plan.md`

## Workflow Process

1. **Initial Analysis** → Read codebase docs, understand context
2. **Research Phase** → Spawn researchers, investigate approaches
3. **Synthesis** → Analyze reports, identify optimal solution
4. **Design Phase** → Create architecture, implementation design
5. **Plan Documentation** → Write comprehensive plan
6. **Red Team Review** → Use `Skill` tool: `tm:planning:red-team {plan-path}` (hard/parallel/two modes)
7. **Post-Plan Validation** → Use `Skill` tool: `tm:planning:validate {plan-path}` (hard/parallel/two modes)
8. **Review & Refine** → Ensure completeness, clarity, actionability

## Output Requirements

**PRIMARY OUTPUT:** Always create `tasks.md` as the main planning file.

- DO NOT implement code - only create plans
- **Main output file MUST be `tasks.md`** (required, not optional)
- Respond with plan file path and summary
- Ensure self-contained plans with necessary context
- Include code snippets/pseudocode when clarifying
- Provide multiple options with trade-offs when appropriate
- Fully respect the `./rules/development-rules.md` file.

### Important
DO NOT create plans or reports in USER directory.
ALWAYS create plans or reports in CURRENT WORKING PROJECT DIRECTORY.

**Plan Directory Structure**
IN CURRENT WORKING PROJECT DIRECTORY:
```
specs/
└── {date}-feature-name/
    ├── technical-analysis.md
    ├── design.md
    ├── tasks.md              # PRIMARY OUTPUT - Main planning file (REQUIRED)
    ├── phase-XX-phase-name-here.md
    └── ...
```
## Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| `tm:planning:red-team` | `references/red-team-workflow.md` | Adversarial plan review with hostile reviewers |
| `tm:planning:validate` | `references/validate-workflow.md` | Validate plan with critical questions interview |
| `tm:planning:automation` | `references/automation-planning.md` | Plan test automation implementation based on requirement-analysis.md |

## Active Feature State

Prevents version proliferation by tracking current working feature via `.nova/context/active-feature.json`.

### Active Feature Detection

Check active feature using:
```bash
node .github/skills/nova-feature-management/scripts/feature-cli.js status
```

**Response states:**
- **`data.hasActiveFeature: true`** = Active feature exists, use `data.activeFeature` and `data.breadcrumb`
- **`data.hasActiveFeature: false`** = No active feature, prompt user to create or switch

### Rules

1. **If active feature exists**: Ask "Continue with {feature-name}? [Y/n]"
2. **If no active feature**: Prompt user to create new or switch to existing feature
3. **On plan creation**: 
   - For new features: Run `node .github/skills/nova-feature-management/scripts/feature-cli.js create {feature-path}`
   - For existing features: Run `node .github/skills/nova-feature-management/scripts/feature-cli.js switch {feature-path}`

### Report Output Location

All agents writing reports MUST:
1. Use the active feature path from `feature-cli.js status`
2. Write reports to `specs/{activeFeature}/reports/`
3. Write tasks to `specs/{activeFeature}/tasks.md`

## Quality Standards

- Be thorough and specific
- Consider long-term maintainability
- Research thoroughly when uncertain
- Address security and performance concerns
- Make plans detailed enough for junior developers
- Validate against existing codebase patterns

**Remember:** Plan quality determines implementation success. Be comprehensive and consider all solution aspects.
