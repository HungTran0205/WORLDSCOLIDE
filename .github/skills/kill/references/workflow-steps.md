# Unified Workflow Steps

All modes share core steps with mode-specific variations.

## Step 0: Intent Detection & Setup

1. Parse input with `intent-detection.md` rules
2. Log detected mode: `✓ Step 0: Mode [X] - [reason]`
3. If mode=code: detect plan path, set active plan
4. Use `todo` to create workflow step tasks (with dependencies if complex)

**Output:** `✓ Step 0: Mode [interactive|auto|fast|parallel|no-test|code] - [detection reason]`

## Step 1: Research (skip if fast/code mode)

**Interactive/Auto:**
- Spawn multiple `tm.researcher` agents in parallel
- Use `todo` tool and `search` tools for codebase search
- Keep reports ≤150 lines

**Parallel:**
- Optional: max 2 researchers if complex

**Output:** `✓ Step 1: Research complete - [N] reports gathered`

### [Review Gate 1] Post-Research (skip if auto mode)
- Present research summary to user
- Use `askQuestion` to ask: "Proceed to planning?" / "Request more research" / "Abort"
- **Auto mode:** Skip this gate

## Step 2: Planning

**Interactive/Auto/No-test:**
- Use `tm.planner` agent with research context
- Use `/seek` or `searchSubagent` agent for codebase search
- Create `tasks.md` + `phase-XX-*.md` files

**Fast:**
- Use `/planning --fast` with seek results only
- Minimal planning, focus on action

**Parallel:**
- Use `/planning --parallel` for dependency graph + file ownership matrix

**Code:**
- Skip - plan already exists
- Parse existing plan for phases

**Output:** `✓ Step 2: Plan created - [N] phases`

### [Review Gate 2] Post-Plan (skip if auto mode)
- Present plan overview with phases
- Use `askQuestion` to ask: "Validate the plan or approve plan to start implementation?" - "Validate" / "Approve" / "Abort" / "Other" ("Request revisions")
  - "Validate": run `/tm:plan validate` slash command
  - "Approve": continue to implementation
  - "Abort": stop the workflow
  - "Other": revise the plan based on user's feedback
- **Auto mode:** Skip this gate

## Step 3: Implementation

**IMPORTANT:**
1. Check for existing tasks (hydrated by tm:planning skill in same session)
2. If tasks exist → pick them up, skip re-creation
3. If no tasks → read plan phases, make `todo` list for each unchecked `[ ]` item with priority order and metadata (e.g. file ownership, dependencies)
4. Tasks can be blocked by other tasks

**All modes:**
- Mark tasks as in_progress immediately.
- Execute phase tasks sequentially (Step 3.1, 3.2, etc.)
- Use `tm.ui-ux-designer` for frontend
- Run type checking after each file

**Parallel mode:**
- Launch multiple `tm.developer` agents
- When agents pick up a task, use `TaskUpdate` to assign task to agent and mark tasks as `in_progress` immediately.
- Respect file ownership boundaries
- Wait for parallel group before next

**Output:** `✓ Step 3: Implemented [N] files - [X/Y] tasks complete`

### [Review Gate 3] Post-Implementation (skip if auto mode)
- Present implementation summary (files changed, key changes)
- Use `askQuestion` to ask: "Proceed to testing?" / "Request implementation changes" / "Abort"
- **Auto mode:** Skip this gate

## Step 4: Testing 

**All modes (except no-test):**
- Write tests: happy path, edge cases, errors
- **MUST** spawn `tm.developer` subagent: `runSubagent(subagent_type="tm.developer", prompt="Run test suite", description="Run tests")`
- If failures: **MUST** spawn `tm.developer` subagent → fix → repeat
- **Forbidden:** fake mocks, commented tests, changed assertions, skipping subagent delegation

**Output:** `✓ Step 4: Tests [X/X passed] - developer subagent invoked`

### [Review Gate 4] Post-Testing (skip if auto mode)
- Present test results summary
- Use `askQuestion` to ask: "Proceed to code review?" / "Request test fixes" / "Abort"
- **Auto mode:** Skip this gate

## Step 5: Code Review

**All modes - MANDATORY subagent:**
- **MUST** spawn `tm.code-reviewer` subagent: `runSubagent(subagent_type="tm.code-reviewer", prompt="Build project to make sure it compiles", description="Build code")`
- **MUST** spawn `tm.code-reviewer` subagent: `runSubagent(subagent_type="tm.code-reviewer", prompt="Review changes. Return score, critical issues, warnings.", description="Code review")`
- **DO NOT** review code yourself - delegate to subagent

**Interactive/Parallel/Code/No-test:**
- Interactive cycle (max 3): see `review-cycle.md`
- Requires user approval

**Auto:**
- Auto-approve if score≥9.5 AND 0 critical
- Auto-fix critical (max 3 cycles)
- Escalate to user after 3 failed cycles

**Fast:**
- Simplified review, no fix loop
- User approves or aborts

**Output:** `✓ Step 5: Review [score]/10 - [Approved|Auto-approved] - code-reviewer subagent invoked`

## Step 6: Finalize

**All modes - MANDATORY subagents (NON-NEGOTIABLE):**
1. **MUST** spawn these subagents in parallel:
   - `runSubagent(subagent_type="tm.technical-doc", prompt="Update docs for changes in [module].", description="Update docs")`
2. spawn `tm.developer` to act as a Project manager sync-back MUST include:
   - Sweep all `phase-XX-*.md` files in the plan directory.
   - Mark every completed item `[ ] → [x]` based on completed tasks (including earlier phases finished before current phase).
   - Update `tasks.md` status/progress (`pending`/`in-progress`/`completed`) from actual checkbox state.
   - Return unresolved mappings if any completed task cannot be matched to a phase file.
3. Update Tasks complete after sync-back confirmation.
4. Onboarding check (API keys, env vars)
5. ask user if they want to commit if yes then spawn git subagent: `runSubagent(subagent_type="tm.gitmanager", prompt="Stage and commit changes", description="Commit")`

**CRITICAL:** Step 6 is INCOMPLETE without spawning all 3 subagents. DO NOT skip subagent delegation.

**Auto mode:** Continue to next phase automatically, start from **Step 3**.
**Others:** Ask user before next phase

**Output:** `✓ Step 6: Finalized - 3 subagents invoked - Full-plan sync-back completed - Committed`

## Mode-Specific Flow Summary

Legend: `[R]` = Review Gate (human approval required)

```
interactive: 0 → 1 → [R] → 2 → [R] → 3 → [R] → 4 → [R] → 5(user) → 6
auto:        0 → 1 → 2 → 3 → 4 → 5(auto) → 6 → next phase (NO stops)
fast:        0 → skip → 2(fast) → [R] → 3 → [R] → 4 → [R] → 5(simple) → 6
parallel:    0 → 1? → [R] → 2(parallel) → [R] → 3(multi-agent) → [R] → 4 → [R] → 5(user) → 6
code:        0 → skip → skip → 3 → [R] → 4 → [R] → 5(user) → 6
```

**Key difference:** `auto` mode is the ONLY mode that skips all review gates.
