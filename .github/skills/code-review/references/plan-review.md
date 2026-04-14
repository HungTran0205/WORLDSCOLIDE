---
name: plan-review
description: Validate implementation completeness against plan requirements. Use when reviewing implementation of features tracked in specs/ folder with phase files and TODO items.
---

# Plan Implementation Review

## Overview

Validates implementation against plan requirements, ensuring all TODO items are completed and code meets quality standards.

**Trigger:** JIRA code or plan folder path like `HTM-34445`, `specs/260120-htm-34445-transunion-token/`

## What Agent Does

1. **Locate Plan Folder**
   - Searches `specs/` for matching folder
   - Handles both JIRA code input and full path
   - Examples:
     - Input: `HTM-34445` → Finds `specs/260120-htm-34445-transunion-token/`
     - Input: `specs/htm-34726-equifax-duplicate-api-calls/` → Uses directly

2. **Read Plan Requirements**
   - Reads all markdown files in plan folder
   - Identifies phase files (e.g., `phase-01-*.md`, `phase-02-*.md`)
   - Extracts TODO items, requirements, success criteria
   - Understands file ownership per phase

3. **Detect Implementation Branch**
   - Extracts JIRA code from plan name
   - Queries git: `git branch --list "*HTM-34445*" "*htm-34445*"`
   - Falls back to current branch if no match
   - No git diff or comparison - reviews current working state

4. **Load Module Documentation**
   - Priority: `docs/code-standards.md` - mandatory
   - Priority: `docs/project-overview-pdr.md` - for requirements context
   - Avoids `semantic_search` - uses direct file reads and `grep_search`
   - Module-specific docs in implementation folder

5. **Validate Implementation**
   - Checks all files mentioned in plan exist and are modified
   - Reviews code quality, cleanliness, standards compliance
   - Identifies code smells and anti-patterns
   - Verifies error handling, validation, edge cases
   - Checks for remaining TODO comments in code

6. **Verify Completeness**
   - All TODO items in plan marked complete?
   - All requirements addressed?
   - All success criteria met?
   - All phase files updated?

7. **Run Tests (Optional)**
   - Only when explicitly requested
   - Uses `tm:maven-build` skill for Java projects
   - Uses `run_in_terminal` for other test commands

## Input Examples

```
"Review HTM-34445 implementation"
"Review specs/260120-htm-34445-transunion-token/"
"Review HTM-34726 implementation and run tests"
"Review specs/chsow-166-blank-sim-order-changes/"
```

## Output Format

```markdown
## Code Review Summary

### Review Type
Plan Implementation Review

### Scope
- Plan: [plan folder path]
- JIRA: [ticket number]
- Branch: [detected branch name]
- Phase files: [count]
- Files reviewed: [list]
- Lines of code: [approximate count]

### Overall Assessment
[Implementation completeness and quality overview]

### Plan Completion Status
- Total TODO items: [count]
- Completed: [count]
- Remaining: [list items]
- Implementation status: [percentage or assessment]

### Requirements Coverage
- [Requirement 1]: ✅ Implemented / ❌ Missing / ⚠️ Partial
- [Requirement 2]: ✅ Implemented / ❌ Missing / ⚠️ Partial
[...]

### Critical Issues
[OWASP Top 10 vulnerabilities, SQL injection, XSS, broken access control, breaking changes, missing core features]

### High Priority Findings
[Bugs, authentication failures, insecure deserialization, incomplete requirements, missing error handling]

### Security Analysis (SAST)
[OWASP Top 10 assessment, injection vulnerabilities, cryptographic issues, authentication/authorization]

### Code Reusability Assessment
[Code duplication, abstraction opportunities, shared utilities, design pattern recommendations]

### Medium Priority Improvements
[Code smells, maintainability, security logging, documentation gaps]

### Low Priority Suggestions
[Style, minor optimizations]

### Positive Observations
[Well-implemented features, good practices]

### Phase-Specific Findings
#### Phase 01: [phase name]
- Status: [complete/partial/not started]
- Issues: [list]

#### Phase 02: [phase name]
- Status: [complete/partial/not started]
- Issues: [list]

### Recommended Actions
1. [Prioritized list with specific fixes]

### Remaining Work
- [TODO items not completed]
- [Requirements not met]
- [Follow-up tasks]

### Metrics
- Test coverage: [if tests run]
- Code quality score: [assessment]
- Documentation: [complete/partial/missing]
```

## Important Notes

**No Pull Request Yet:**
- Plan reviews happen before PR creation
- Reviews current working state, not branch comparison
- No git diff analysis - checks files as they exist now
- Branch detection is for context, not comparison

**Documentation Priority:**
- Read `docs/code-standards.md` first
- Read `docs/project-overview-pdr.md` for context
- Avoid `semantic_search` - use `grep_search` with `includePattern`
- Module-specific docs over generic docs

**Completeness Focus:**
- Main goal: Ensure implementation matches plan
- Verify all TODO items done
- Check all requirements addressed
- Confirm success criteria met

## When to Use

- After completing all phases of a plan
- Before creating pull request
- When plan shows "implementation complete" status
- To verify readiness for code review
- To ensure nothing was missed in implementation

## What Agent Checks

**Plan Alignment:**
- All phase files addressed
- All TODO items completed
- All requirements implemented
- File ownership respected
- Success criteria met

**Code Quality:**
- Follows `docs/code-standards.md`
- Clean, maintainable code
- No code smells or anti-patterns
- Proper error handling
- Edge cases covered
- Code reusability (DRY, abstraction, modularity)

**Implementation Completeness:**
- All expected files modified
- No remaining TODO comments in code
- All dependencies resolved
- Tests written (if plan requires)
- Documentation updated

**Standards Compliance:**
- Project coding standards
- Architectural patterns
- API design consistency
- Security best practices (OWASP Top 10, SAST)
- Performance considerations

## Integration with Workflow

**After Implementation:**
```
Developer: Completed all phases of HTM-34445
Developer: Ready to create PR

Agent: [Invoke tm.code-reviewer]
Input: "Review HTM-34445 implementation"

Agent: [Locates plan, detects branch, reviews all changes]
Agent: [Returns completion report]

Result:
- 8/9 TODO items complete
- Missing: Update API documentation
- Code quality: Good
- Issues: 2 High, 3 Medium

Developer: [Complete missing TODO, fix issues]
Developer: [Create PR]
```

**Mid-Implementation Check:**
```
Developer: Completed phases 1-3 of HTM-33815
Developer: Want to verify before continuing

Agent: [Invoke tm.code-reviewer]
Input: "Review HTM-33815 implementation"

Agent: [Reviews completed phases]
Agent: [Reports: Phase 1-3 complete, Phase 4-5 not started]
Agent: [Identifies issues in completed work]

Developer: [Fix issues before proceeding to Phase 4]
```

**With Test Execution:**
```
Developer: Implementation of HTM-34726 complete
Developer: Want full validation

Agent: [Invoke tm.code-reviewer]
Input: "Review HTM-34726 implementation and run tests"

Agent: [Reviews plan, runs maven tests]
Agent: [Reports: All TODO items done, 45/45 tests pass]

Developer: [Ready for PR]
```

## Key Principles

1. **Plan-driven** - validates against plan requirements, not just code quality
2. **Completeness-focused** - ensures all TODO items done
3. **Current state** - reviews working copy, not branch diff
4. **Module-scoped** - uses module-specific docs
5. **No semantic search** - uses grep_search for precision
6. **Pre-PR stage** - catches issues before pull request
7. **Test optional** - runs only when requested
