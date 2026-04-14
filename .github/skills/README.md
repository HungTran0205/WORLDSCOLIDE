# Agent Skills

This directory contains **Agent Skills** - executable, versioned, immutable functional knowledge that agents use instead of guessing from text descriptions.

## What are Agent Skills?

Agent Skills are structured documents that contain:
- **Schemas** - Precise data structure definitions
- **Business Rules** - Formal logic and constraints
- **Validation Rules** - Executable validation logic
- **Examples** - Real-world usage patterns
- **Test Cases** - Validation criteria
- **Integration Points** - How to use the skill

## Philosophy

> **Functional knowledge should live in one place — be executable strings, versioned, and immutable.**

Instead of embedding detailed logic in text documents, we encapsulate it into Agent Skills.

- **Skills hold the truth** (Logic + Tests + Version)
- **Specs provide the intent** (Reference to specific Skill Versions)
- **Agents extract the detail** from skill code, not from a developer's explanation

## Benefits

### ❌ Without Agent Skills
- Specs were ambiguous text
- Agents guessed logic
- Quality was checked after the fact

### ✅ With Agent Skills
- Specs reference versioned skills
- Agents execute proven logic
- Quality is guaranteed by assembly

## Available Skills

### 1. SOW Analysis (`sow-analysis/`)
**Version:** 1.0.0  
**Purpose:** Rules for analyzing Statement of Work (SOW) documents

**Provides:**
- SOW metadata extraction patterns
- Functional requirement parsing
- Impact detection algorithms (use cases, interface agreements)
- Keyword extraction for domain matching
- Conflict detection logic

**Used by:** `@docs analyze` command

---

### 2. Use Case Schema (`use-case-schema/`)
**Version:** 1.0.0  
**Purpose:** Canonical structure for use case documents

**Provides:**
- Required sections and metadata fields
- Track changes formatting rules (strikethrough, bold, comments)
- Business rule numbering conventions
- Validation rules for completeness
- Word export specifications

**Used by:** `@docs sync` command, document validation

---

### 3. SOW Impact Mapping (`sow-impact-mapping/`)
**Version:** 1.0.0  
**Purpose:** Schema and operations for SOW-to-document impact tracking

**Provides:**
- Impact map JSON schema
- Status lifecycle (pending → synced → conflicted)
- Release precedence rules ("latest wins")
- Validation rules for SOW IDs, releases, paths
- CRUD operations for mappings

**Used by:** All @docs commands, impact tracking

---

## How Agents Use Skills

When the @docs agent is invoked, it follows this pattern:

```
User: @docs analyze HUBSOW-1530.docx

Agent:
1. Read .github/skills/sow-analysis/SKILL.md
2. Apply extraction rules ER-001, ER-002, ER-003
3. Apply impact detection rules IA-001, IA-002
4. Read .github/skills/sow-impact-mapping/SKILL.md
5. Validate output using rules V-001 through V-004
6. Save results following the skill's schema
7. Generate analysis report using skill's template
```

**Result:** Consistent, validated output every time.

## Skill File Structure

Each skill is a `SKILL.md` file containing:

```markdown
# {Skill Name}

**Version:** 1.0.0
**Last Updated:** YYYY-MM-DD
**Scope:** {What this skill covers}

## Purpose
{Why this skill exists}

## Schema Definition
{Precise data structures}

## Business Rules
{Formal logic and constraints}

## Validation Rules
{Executable validation logic with code examples}

## Examples
{Real-world usage patterns}

## Test Cases
{Validation criteria}

## Integration Points
{How to use this skill}

## Version History
{Change tracking}

## Related Skills
{Dependencies and relationships}
```

## Adding New Skills

To create a new skill:

1. **Create directory:** `.github/skills/{skill-name}/`
2. **Create SKILL.md** following the template above
3. **Define schema** with precise field definitions
4. **Write business rules** as formal logic (BR-001, BR-002, etc.)
5. **Add validation rules** with executable examples (V-001, V-002, etc.)
6. **Include examples** showing real usage
7. **Write test cases** to validate correctness
8. **Update agent** to reference the skill

## Versioning

Skills use semantic versioning:
- **Major (1.x.x)** - Breaking schema changes
- **Minor (x.1.x)** - New rules or examples added
- **Patch (x.x.1)** - Clarifications or typos

Agents should reference specific skill versions in critical specs.

## Integration with Python Scripts

Skills provide the logic that Python scripts implement:

```python
# Example: SOW analysis script
from skills.sow_analysis import (
    extract_sow_metadata,
    detect_use_case_impacts
)

# The skill defines the extraction patterns
metadata = extract_sow_metadata(sow_content)

# The skill defines the impact detection algorithm
impacts = detect_use_case_impacts(metadata, use_cases)
```

## Best Practices

1. **Keep skills atomic** - One skill, one domain
2. **Make schemas explicit** - Every field defined with validation
3. **Include real examples** - Show actual usage from the project
4. **Write executable rules** - Provide code snippets when possible
5. **Version appropriately** - Track breaking vs. additive changes
6. **Test thoroughly** - Include test cases in the skill

## Related Documentation

- **Agent Configuration:** [.github/agents/nova.docs.agent.md](../.github/agents/nova.docs.agent.md)
- **Usage Guide:** [docs/AGENT-USAGE-GUIDE.md](../../docs/AGENT-USAGE-GUIDE.md)
- **Process Documentation:** [docs/TM-DOCUMENTATION-PROCESS.md](../../docs/TM-DOCUMENTATION-PROCESS.md)

## References

- [Nova Framework Skills Confluence](https://hansentechnologies.atlassian.net/wiki/spaces/PROV/pages/6152946046/Use+Agent+Skills+in+Nova+Framework)
- [Service Definition Skill POC](https://hansentechnologies.atlassian.net/wiki/spaces/PROV/pages/6152946046/Use+Agent+Skills+in+Nova+Framework#Quick-POC)

---

**Maintained by:** Tesco Mobile Documentation Team  
**Contact:** Dan Grecu (dan.grecu@hansencx.com)
