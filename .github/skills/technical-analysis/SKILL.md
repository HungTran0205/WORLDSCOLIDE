---
name: tm:technical-analysis
metadata: version: 1.00
description: |
  Skill for analyzing codebase structure, patterns, architecture, and technical debt. Use this when asked to review code quality, examine system design, identify performance issues, or assess technical debt in the project.
---

# Technical Analysis Skill

## Purpose
Perform deep technical analysis of the codebase to provide insights into code quality, architecture, and areas for improvement.

## When to Use
- User asks to analyze code structure or architecture
- User wants to identify technical debt
- User asks about performance bottlenecks
- User wants to understand code patterns and dependencies
- User asks for code review or quality assessment

## Tools Required
- `search` - For searching the codebase
- `usages` - For finding code usages and dependencies
- `problems` - For identifying code issues
- `changes` - For analyzing recent changes

## Step-by-Step Process

### 1. Understand the Scope
- Identify the target: specific file, module, component, or entire codebase
- Clarify the focus: architecture, code quality, performance, security, etc.

### 2. Code Structure Analysis
1. Examine directory structure and organization
2. Identify main components and their responsibilities
3. Map dependencies between modules
4. Check for proper separation of concerns

### 3. Architecture Review
1. Identify architectural patterns used (MVC, layered, microservices, etc.)
2. Evaluate component coupling and cohesion
3. Check for circular dependencies
4. Assess scalability considerations

### 4. Technical Debt Assessment
1. Identify code smells:
   - Long methods/functions
   - Large classes/modules
   - Duplicate code
   - Dead code
   - Magic numbers/strings
2. Check for outdated dependencies
3. Identify missing tests or low coverage areas
4. Note TODO/FIXME comments

### 5. Performance Analysis
1. Identify potential bottlenecks
2. Check for inefficient algorithms or data structures
3. Review database query patterns (N+1 problems, missing indexes)
4. Assess resource usage patterns

### 6. Compile Analysis Report
Produce a markdown report:

```markdown
# Technical Analysis Report: {Component/Area}

## Overview
Brief summary of what was analyzed.

## Architecture
- Pattern: {identified pattern}
- Strengths: ...
- Concerns: ...

## Code Quality
| Metric | Assessment |
|--------|------------|
| Structure | Good/Moderate/Needs Improvement |
| Readability | Good/Moderate/Needs Improvement |
| Testability | Good/Moderate/Needs Improvement |

## Technical Debt
| Issue | Severity | Location | Recommendation |
|-------|----------|----------|----------------|
| ... | High/Medium/Low | file:line | ... |

## Performance Considerations
- Potential bottlenecks identified
- Optimization recommendations

## Recommendations
1. Priority 1: ...
2. Priority 2: ...
```

## Quality Standards
- Base conclusions on concrete evidence (specific code examples)
- Provide file paths and line numbers for issues
- Prioritize findings by impact and effort
- Suggest actionable improvements
- Acknowledge limitations of the analysis

## Example Usage

### Component Analysis
User: "Analyze the authentication module for security vulnerabilities"
1. Locate authentication-related code
2. Review security patterns used
3. Check for common vulnerabilities (SQL injection, XSS, etc.)
4. Compile security-focused analysis report

### Architecture Analysis
User: "How does the data flow through the payment system?"
1. Map the payment processing components
2. Trace data flow from input to storage
3. Create flow diagrams if helpful
4. Report on architecture and potential issues
