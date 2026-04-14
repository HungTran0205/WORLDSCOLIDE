---
name: pr-review
description: Comprehensive pull request review with GitHub API integration. Use when reviewing PRs before merge, validating against plan requirements, and ensuring code quality standards.
---

# Pull Request Review

## Overview

Comprehensive PR analysis using GitHub API, with optional plan validation and code quality assessment.

**Trigger:** GitHub PR URL like `https://github.com/hansen-technologies/cis-hu-tm-java/pull/1192`

## What Agent Does

1. **Parse PR URL**
   - Extracts: owner, repo, PR number
   - Example: `https://github.com/hansen-technologies/cis-hu-tm-java/pull/1192`
     - Owner: `hansen-technologies`
     - Repo: `cis-hu-tm-java`
     - PR: `1192`

2. **Fetch PR Details**
   - Uses `mcp_github_github_pull_request_read` with method `get`
   - Gets: title, description, base/head branches, author, labels, status
   - Checks for related issues/tickets mentioned

3. **Get Changed Files**
   - Uses `mcp_github_github_pull_request_read` with method `get_files`
   - Lists all files added, modified, deleted
   - Gets change statistics (additions, deletions)

4. **Get Code Diff**
   - Uses `mcp_github_github_pull_request_read` with method `get_diff`
   - Retrieves line-by-line changes
   - Analyzes context of modifications

5. **Extract JIRA Ticket**
   - Parses PR title and description for JIRA codes (e.g., HTM-34445)

6. **Gather Jira Context**
   - Uses `tm:jira-search` skill to retrieve Jira ticket details
   - Gets: requirements, acceptance criteria, description, comments
   - Fetches related issues, blockers, and linked tickets
   - Gathers business context and reasoning behind changes
   - Searches `specs/` for matching plan folder for technical implementation details
   - If plan found, reads plan requirements for validation

7. **Review Code Quality**
   - Reads `docs/code-standards.md`
   - Reviews each changed file for:
     - Code quality and cleanliness
     - Security vulnerabilities (OWASP Top 10, SAST)
     - Code reusability and duplication
     - Performance issues
     - Error handling adequacy
     - Breaking changes
     - Test coverage

8. **Validate Against Requirements**
   - Validates implementation against Jira acceptance criteria
   - If plan found: checks implementation against plan requirements
   - Verifies PR description matches changes and Jira requirements
   - Ensures all acceptance criteria from Jira met

9. **Generate Report**
   - Creates comprehensive markdown report
   - **DOES NOT post to GitHub** - report only
   - Includes Jira context and requirements validation
   - Categorizes findings by severity
   - Provides actionable recommendations

10. **Run Tests (Optional)**
   - Only when explicitly requested
   - Uses `tm:maven-build` skill for Java
   - Uses `run_in_terminal` for other tests

## Input Examples

```
"Review https://github.com/hansen-technologies/cis-hu-tm-java/pull/1192"
"Review https://github.com/hansen-technologies/cis-hu-tm-net/pull/845"
"Review https://github.com/hansen-technologies/cis-hu-tm-java/pull/1192 and run tests"
"Review PR #1192"  (if context clear)
```

## Output Format

```markdown
## Code Review Summary

### Review Type
Pull Request Review

### Scope
- PR: #[number] - [title]
- Repository: [owner/repo]
- URL: [full PR URL]
- Author: [username]
- Base: [base branch] ← Head: [head branch]
- Files changed: [count]
- Lines: +[additions] -[deletions]

### Jira Context
- JIRA Ticket: [ticket number]
- Summary: [Jira ticket summary]
- Requirements: [key requirements from Jira]
- Acceptance Criteria: [list from Jira]
- Related Issues: [linked tickets]
- Business Context: [reasoning/background from Jira]

### Related Plan
- Plan: [plan folder path if found]
- Technical Requirements: [link to plan file if exists]

### PR Description Assessment
[Evaluation of PR description quality and completeness]

### Overall Assessment
[Code quality and implementation overview]

### Critical Issues
[OWASP Top 10 vulnerabilities, SQL injection, XSS, broken access control, breaking changes, data loss risks]

### High Priority Findings
[Bugs, authentication failures, insecure deserialization, missing error handling, performance issues]

### Security Analysis (SAST)
[OWASP Top 10 assessment, injection vulnerabilities, cryptographic issues, authentication/authorization]

### Code Reusability Assessment
[Code duplication, abstraction opportunities, shared utilities, design pattern recommendations]

### Medium Priority Improvements
[Code smells, maintainability, security logging, documentation gaps]

### Low Priority Suggestions
[Style inconsistencies, minor optimizations]

### Positive Observations
[Well-written code, good practices, comprehensive tests]

### Requirements Validation (if plan found)
- [Requirement 1]: ✅ Met / ❌ Not met / ⚠️ Partial
- [Requirement 2]: ✅ Met / ❌ Not met / ⚠️ Partial
[...]

### Breaking Changes
[List any breaking changes with impact assessment]

### Test Coverage
- Tests added: [yes/no]
- Tests modified: [yes/no]
- Coverage adequate: [yes/no/partial]
- Test results: [if tests run]

### File-by-File Analysis

#### [File 1 path]
- Changes: [summary]
- Issues: [list]
- Recommendations: [list]

#### [File 2 path]
- Changes: [summary]
- Issues: [list]
- Recommendations: [list]

[...]

### Security Analysis
- OWASP Top 10 compliance: [assessment]
- Input validation: [adequate/missing]
- Authentication/authorization: [proper/issues]
- Sensitive data handling: [secure/concerns]
- Injection vulnerabilities: [none/found]
- Cryptographic failures: [none/found]
- Insecure deserialization: [none/found]
- Security misconfiguration: [none/found]

### Performance Analysis
- Query optimization: [good/needs improvement]
- Algorithm efficiency: [good/concerns]
- Resource management: [proper/issues]
- Caching strategy: [appropriate/missing]

### Recommended Actions
1. [Prioritized list of fixes with code examples]

### Merge Recommendation
- Ready to merge: [Yes/No/After fixes]
- Blocking issues: [count]
- Required fixes before merge: [list]

### Metrics
- Files reviewed: [count]
- Issues found: Critical [n], High [n], Medium [n], Low [n]
- Test coverage: [percentage if available]
- Code quality: [score/assessment]
```

## Important Notes

**Report Only - No GitHub Posting:**
- Agent generates markdown report only
- **Never uses** `mcp_github_github_add_comment_to_pending_review`
- **Never uses** `mcp_github_github_pull_request_review_write`
- User decides whether to post report to GitHub
- Keeps review process under user control

**Jira Integration:**
- Automatically detects JIRA ticket in PR title/description
- Uses `tm:jira-search` skill to gather requirements and context from Jira
- Retrieves acceptance criteria, business context, related issues
- Validates implementation against Jira requirements

**Plan Integration:**
- Searches for matching plan in `specs/` for technical details
- If plan found, validates implementation against plan requirements
- If no plan, uses Jira context for requirements validation
- If neither found, reviews code quality only

**GitHub API Tools Used:**
- `mcp_github_github_pull_request_read` - method: `get`, `get_files`, `get_diff`
- Never uses posting/commenting tools

**Jira Tools Used:**
- `tm:jira-search` skill - gathers Jira ticket context and requirements

## When to Use

- Before merging pull request
- After automated CI/CD checks pass
- When PR author requests review
- To validate implementation completeness
- Before requesting human reviewer
- To catch issues early in review process

## What Agent Checks

**Code Quality:**
- Follows `docs/code-standards.md`
- Clean, readable, maintainable
- No code smells or anti-patterns
- Proper error handling
- Edge cases covered

**Security:**
- OWASP Top 10 vulnerabilities
- Input validation and sanitization
- Authentication/authorization
- Sensitive data exposure
- Injection vulnerabilities

**Performance:**
- Efficient algorithms
- Database query optimization
- Memory management
- Resource handling
- Caching strategies

**Breaking Changes:**
- API modifications
- Database schema changes
- Configuration changes
- Dependency updates
- Behavioral changes

**Test Coverage:**
- New tests for new features
- Modified tests for changed behavior
- Test quality and completeness
- Edge case coverage

**Documentation:**
- Code comments where needed
- API documentation updates
- README updates
- Change log entries

**Requirements:**
- Jira acceptance criteria validated
- All plan requirements met (if plan exists)
- Acceptance criteria satisfied
- TODO items addressed
- Success criteria achieved
- Business context from Jira considered

## Integration with Workflow

**Pre-Merge Review:**
```
Developer: Created PR #1192 for HTM-34445
Developer: Want automated review before requesting human review

Agent: [Invoke tm.code-reviewer]
Input: "Review https://github.com/hansen-technologies/cis-hu-tm-java/pull/1192"

Agent: [Fetches PR, gathers Jira context, finds plan, reviews code]
Agent: [Returns comprehensive report]

Result:
- Jira ticket: HTM-34445 with 5 acceptance criteria
- Found plan: specs/260120-htm-34445-transunion-token/
- All requirements met
- Issues: 1 Critical (hardcoded credentials), 2 Medium
- Ready: No - fix Critical first

Developer: [Fix credentials, request review again]
Developer: [Then request human review]
```

**Post-CI Review:**
```
Developer: CI passed on PR #845
Developer: Want comprehensive code review

Agent: [Invoke tm.code-reviewer]
Input: "Review https://github.com/hansen-technologies/cis-hu-tm-net/pull/845"

Agent: [Reviews .NET code, checks standards]
Agent: [No plan found, focuses on code quality]

Result:
- No related plan found
- Code quality: Good
- Issues: 3 Medium (code smells)
- Ready: Yes - minor improvements suggested

Developer: [Address suggestions or merge as-is]
```

**With Test Execution:**
```
Developer: Want full validation of PR #1192
Developer: Include test run

Agent: [Invoke tm.code-reviewer]
Input: "Review https://github.com/hansen-technologies/cis-hu-tm-java/pull/1192 and run tests"

Agent: [Reviews PR, gathers Jira context, runs maven tests]
Agent: [Returns report with test results]

Result:
- Jira: HTM-34445 acceptance criteria met
- Tests: 45/45 passed
- Code quality: Excellent
- Issues: None blocking
- Ready: Yes

Developer: [Merge with confidence]
```

## Key Principles

1. **API-driven** - uses GitHub API, not local git
2. **Report only** - never posts to GitHub automatically
3. **Jira-aware** - gathers context from Jira tickets
4. **Plan-aware** - validates against plan if found
5. **Comprehensive** - covers quality, security, performance
6. **Actionable** - specific fixes with examples
7. **Severity-based** - prioritizes critical issues
8. **Test optional** - runs only when requested
9. **Merge guidance** - clear ready/not ready recommendation
