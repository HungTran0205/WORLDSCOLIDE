# Codebase Understanding Phase

## Core Activities

### Parallel Scout Agents
- Use `/seek` slash command to search the codebase for files needed to complete the task
- Each seek locates files needed for specific task aspects
- Wait for all seek (search agents) to report back before analysis
- Efficient for finding relevant code across large codebases

### Essential Documentation Review
ALWAYS read these files first from the **current working module's `docs/` folder** (e.g., `cis-hu-tm-java/hub_orderService/docs/`, `cis-hu-tm-net/docs/`):

1. **`rules/development-rules.md`** (IMPORTANT, if exists)
   - File Name Conventions
   - File Size Management
   - Development rules and best practices
   - Code quality standards
   - Security guidelines

2. **`./docs/codebase-summary.md`**
   - Project structure and current status
   - High-level architecture overview
   - Component relationships

3. **`./docs/code-standards.md`**
   - Coding conventions and standards
   - Language-specific patterns
   - Naming conventions

4. **`rules/design-guidelines.md`** (if exists)
   - Design system guidelines
   - Branding and UI/UX conventions
   - Component library usage

> **Note:** Paths are relative to the current working module root, not the workspace root.

### Environment Analysis
- Review development environment setup
- Analyze dotenv files and configuration
- Identify required dependencies
- Understand build and deployment processes

### Pattern Recognition
- Study existing patterns in codebase
- Identify conventions and architectural decisions
- Note consistency in implementation approaches
- Understand error handling patterns

### Integration Planning
- Identify how new features integrate with existing architecture
- Map dependencies between components
- Understand data flow and state management
- Consider backward compatibility

## Best Practices

- Start with documentation before diving into code
- Use scouts for targeted file discovery
- Document patterns found for consistency
- Note any inconsistencies or technical debt
- Consider impact on existing features
