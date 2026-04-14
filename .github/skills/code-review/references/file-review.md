---
name: file-review
description: Deep dive code review of specific files or classes with repo-scoped impact analysis. Use when reviewing implementation of specific components, classes, or modules.
---

# File/Class Review

## Overview

Deep analysis of specific files with focus on code quality, standards compliance, and repo-scoped impact.

**Trigger:** File path(s) like `OrderService.java`, `src/main/Customer.java`

## What Agent Does

1. **Read Target Files**
   - Uses `read_file` to load specified file(s)
   - Analyzes code structure, logic, patterns

2. **Load Project Standards**
   - Reads `docs/code-standards.md` - mandatory
   - Reads `docs/system-architecture.md` - for architectural compliance
   - Reads `docs/api-docs.md` - optional, for API consistency

3. **Analyze Code Quality**
   - Code smells and anti-patterns
   - Security vulnerabilities
   - Performance issues
   - Error handling adequacy
   - Documentation quality

4. **Check Repo Impact**
   - Uses `list_code_usages` to find where class/methods are used
   - Uses `grep_search` with `includePattern` for repo folder (e.g., `cis-hu-tm-java/**`)
   - **Scope limited to current repo only** - does not check cross-repo dependencies

5. **Verify Compilation**
   - Uses `get_errors` to check compile/lint errors in reviewed files

6. **Run Tests (Optional)**
   - Only when explicitly requested
   - Uses `tm:maven-build` skill for Java projects
   - Uses `run_in_terminal` for other test commands

## Input Examples

```
"Review OrderService.java"
"Review src/main/java/com/tesco/hub/service/CustomerService.java"
"Review hub_core-ejb/src/main/java/com/tesco/hub/dao/AccountDAO.java"
"Review OrderService.java and run tests"
```

## Output Format

```markdown
## Code Review Summary

### Review Type
File Review

### Scope
- Files reviewed: [file paths]
- Lines of code analyzed: [count]
- Repo: [current repo name]
- Impact analysis: Within [repo] only

### Overall Assessment
[Brief overview of code quality]

### Critical Issues
[OWASP Top 10 vulnerabilities, SQL injection, XSS, broken access control, breaking changes]

### High Priority Findings
[Bugs, authentication failures, insecure deserialization, performance issues, missing error handling]

### Security Analysis (SAST)
[OWASP Top 10 assessment, injection vulnerabilities, cryptographic issues, authentication/authorization]

### Code Reusability Assessment
[Code duplication, abstraction opportunities, shared utilities, design pattern recommendations]

### Medium Priority Improvements
[Code smells, maintainability, security logging, dependency updates]

### Low Priority Suggestions
[Style, minor optimizations]

### Positive Observations
[Well-written code, good practices]

### Repo Impact Analysis
- Usages found: [count]
- Files affected: [list]
- Breaking change risk: [Low/Medium/High]

### Recommended Actions
1. [Prioritized fixes with code examples]

### Metrics
- Compile errors: [count]
- Linting issues: [count]
- Test coverage: [if tests run]
```

## When to Use

- After implementing new class or service
- After major refactoring of existing file
- When fixing bugs in specific component
- Before committing significant file changes
- When unsure about code quality in specific area

## What Agent Checks

**Standards Compliance:**
- Follows `docs/code-standards.md` conventions
- Matches architectural patterns from `docs/system-architecture.md`
- Consistent with API design from `docs/api-docs.md`

**Code Quality:**
- Naming conventions
- Method/class size and complexity
- Code duplication (DRY)
- SOLID principles
- Error handling patterns

**Code Reusability:**
- Duplicated logic across files (extract to shared utilities)
- Hard-coded values (move to configuration/constants)
- Similar patterns (abstract to base classes/interfaces)
- Copy-paste code (refactor to reusable components)
- Tight coupling (apply dependency injection)
- Poor abstraction (introduce appropriate design patterns)

**Security (SAST + OWASP Top 10:2021):**
- A01: Broken Access Control (authorization checks, IDOR)
- A02: Cryptographic Failures (encryption, hashing, TLS)
- A03: Injection (SQL, NoSQL, OS command, LDAP injection)
- A04: Insecure Design (threat modeling, secure design patterns)
- A05: Security Misconfiguration (defaults, error handling)
- A06: Vulnerable Components (outdated dependencies)
- A07: Authentication Failures (session mgmt, credential storage)
- A08: Data Integrity Failures (unsigned data, insecure CI/CD)
- A09: Security Logging Failures (audit trails, monitoring)
- A10: SSRF (Server-Side Request Forgery)
- Input validation and sanitization
- XSS vulnerabilities (reflected, stored, DOM-based)
- Sensitive data exposure in logs/errors
- Insecure deserialization
- Path traversal and file inclusion

**Performance:**
- Inefficient algorithms
- Database query optimization (N+1 queries)
- Memory leaks
- Resource management (connection pooling, file handles)

**Maintainability:**
- Code readability
- Documentation completeness
- Test coverage
- Technical debt indicators

## Limitations

- **No cross-repo analysis** - only checks within current repository
- **No git history** - reviews current state, not changes over time
- **No branch comparison** - reviews working copy, not diffs
- **Tests optional** - only runs if explicitly requested
- **Focused scope** - deep dive on specified files only

## Integration with Workflow

**Before Commit:**
```
Developer: Made changes to OrderService.java
Developer: Request review before commit

Agent: [Invoke tm.code-reviewer]
Input: "Review OrderService.java"
Agent: [Returns focused review of OrderService]
Developer: [Fix issues, commit]
```

**After Refactoring:**
```
Developer: Refactored CustomerService to use repository pattern
Developer: Want to ensure quality

Agent: [Invoke tm.code-reviewer]
Input: "Review CustomerService.java and CustomerRepository.java"
Agent: [Reviews both files, checks interaction]
Developer: [Address findings]
```

**Bug Fix Verification:**
```
Developer: Fixed null pointer in PaymentProcessor
Developer: Want to verify fix quality

Agent: [Invoke tm.code-reviewer]
Input: "Review PaymentProcessor.java and run tests"
Agent: [Reviews code, runs tests, verifies fix]
Developer: [Proceed with confidence]
```

## Key Principles

1. **Repo-scoped only** - impact analysis within current repo
2. **Standards-driven** - validates against project docs
3. **Focused analysis** - deep dive on specified files
4. **Actionable feedback** - specific fixes with examples
5. **Optional testing** - runs only when requested
