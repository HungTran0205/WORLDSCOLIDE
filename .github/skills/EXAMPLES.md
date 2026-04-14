# Using Skills in Specifications - Examples

This document shows how to reference Agent Skills in your project specifications and documentation.

---

## Example 1: Feature Spec Referencing Skills

```markdown
# Feature: Email Notification System

## Requirements

### REQ-001: SOW Impact Tracking

**Requirement:** System shall track SOW impacts following established schema

**Implementation:** Use **SOW Impact Mapping Skill v1.0** 
[.github/skills/sow-impact-mapping/SKILL.md](.github/skills/sow-impact-mapping/SKILL.md)

**Key Rules:**
- BR-005: Latest release wins
- V-002: SOW ID validation `HUBSOW-\d+`
- Status lifecycle: pending → synced → conflicted

### REQ-002: Use Case Validation

**Requirement:** All use cases must follow canonical structure

**Implementation:** Use **Use Case Schema Skill v1.0**
[.github/skills/use-case-schema/SKILL.md](.github/skills/use-case-schema/SKILL.md)

**Key Rules:**
- V-001: Required sections present
- BR-001: UC ID format `UC-\d{3}`
- TC-001 to TC-004: Track changes formatting
```

---

## Example 2: Agent Command with Skill Reference

```markdown
# User Story: Analyze New SOW

**As a** documentation manager  
**I want** to analyze SOW-1530  
**So that** I can identify impacted documentation

## Acceptance Criteria

**GIVEN** HUBSOW-1530.docx exists in docs/sows/  
**WHEN** I run `@docs analyze HUBSOW-1530.docx`  
**THEN** the agent SHALL:

1. Read **SOW Analysis Skill v1.0** 
   [.github/skills/sow-analysis/SKILL.md](.github/skills/sow-analysis/SKILL.md)

2. Apply extraction rules:
   - ER-001: Extract metadata (SOW ID, release, priority)
   - ER-002: Parse functional requirements from tables
   - ER-003: Identify impacted systems

3. Apply impact detection:
   - IA-001: Use case impacts (keyword matching, score ≥30)
   - IA-002: Interface agreement impacts (integration keywords)

4. Validate output using **SOW Impact Mapping Skill v1.0**:
   - V-002: SOW ID format validation
   - V-003: Release format validation
   - V-001: Document path validation

5. Generate analysis report following skill template

**AND** the output SHALL include:
- Metadata with valid SOW ID format
- List of impacted documents with confidence scores
- Recommended actions
```

---

## Example 3: Test Case Referencing Skill

```markdown
# Test Case: TC-SOW-001

**Title:** Validate SOW ID Format

**Skill Reference:** SOW Impact Mapping v1.0 - Rule V-002

**Preconditions:**
- SOW Impact Mapping skill loaded

**Test Data:**
| Input | Expected Result | Skill Rule |
|-------|----------------|------------|
| `HUBSOW-1530` | Valid | V-002: Pattern `HUBSOW-\d+` |
| `HUBSOW-1421-SCR` | Valid | V-002: Pattern `HUBSOW-\d+(-[A-Z]+)?` |
| `SOW-1530` | Invalid | V-002: Must start with HUBSOW |
| `HUBSOW1530` | Invalid | V-002: Must have hyphen |

**Procedure:**
1. Load SOW Impact Mapping Skill
2. Extract validation rule V-002
3. Apply pattern matching
4. Assert results match expected

**Pass Criteria:**
- All test data validates as expected
- Validation errors provide clear messages
```

---

## Example 4: Python Script Documentation

```python
"""
SOW Analysis Script

This script analyzes SOW documents following the rules defined in:
.github/skills/sow-analysis/SKILL.md v1.0

Key Skills Used:
- ER-001: SOW Metadata Extraction
- ER-002: Functional Requirements Parsing
- IA-001: Use Case Impact Detection

See SKILL.md for complete rule definitions and examples.
"""

from pathlib import Path
import re
import json

# Skill reference
SKILL_PATH = '.github/skills/sow-analysis/SKILL.md'
SKILL_VERSION = '1.0.0'


def extract_sow_metadata(document: str) -> dict:
    """
    Extract SOW metadata following ER-001 from sow-analysis skill.
    
    Skill: sow-analysis v1.0.0
    Rule: ER-001 - SOW Metadata Extraction
    
    Pattern:
    - SOW ID: **SOW ID:** (HUBSOW-\d+(-[A-Z]+)?)
    - Release: **Release:** (R?\d+\.\d+)
    - Priority: **Priority:** (HIGH|MEDIUM|LOW)
    
    Args:
        document: SOW markdown content
        
    Returns:
        dict with keys: sowId, release, priority, title, status
    """
    patterns = {
        'sowId': r'\*\*SOW ID:\*\* (HUBSOW-\d+(?:-[A-Z]+)?)',
        'release': r'\*\*Release:\*\* (R?\d+\.\d+)',
        'priority': r'\*\*Priority:\*\* (HIGH|MEDIUM|LOW)',
        'title': r'# Statement of Work: (.+)',
        'status': r'\*\*Status:\*\* (Draft|In Progress|Approved|Completed)'
    }
    
    metadata = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, document)
        metadata[key] = match.group(1) if match else None
    
    return metadata


def detect_use_case_impacts(sow_data: dict, use_cases: list) -> list:
    """
    Detect impacted use cases following IA-001 from sow-analysis skill.
    
    Skill: sow-analysis v1.0.0
    Rule: IA-001 - Use Case Impact Detection
    
    Algorithm:
    - Keyword matching: +10 points per match
    - System matching: +20 points per match
    - Threshold: score >= 30 indicates impact
    - Confidence: high (>=50), medium (>=30)
    
    Args:
        sow_data: Parsed SOW metadata and content
        use_cases: List of existing use case documents
        
    Returns:
        list of impact objects with doc, docType, confidence, score
    """
    # Implementation follows skill IA-001
    pass
```

---

## Example 5: README Documentation

```markdown
# Tesco Mobile Documentation System

## Architecture

This system uses **Agent Skills** to ensure consistent document processing.

### Skills in Use

| Skill | Version | Purpose | Location |
|-------|---------|---------|----------|
| SOW Analysis | 1.0.0 | Parse and analyze SOW documents | [SKILL.md](.github/skills/sow-analysis/SKILL.md) |
| Use Case Schema | 1.0.0 | Validate use case structure | [SKILL.md](.github/skills/use-case-schema/SKILL.md) |
| SOW Impact Mapping | 1.0.0 | Track SOW-to-document impacts | [SKILL.md](.github/skills/sow-impact-mapping/SKILL.md) |

### How It Works

1. **Agent reads skills** - Not guesses from descriptions
2. **Applies precise rules** - BR-001, V-002, ER-001, etc.
3. **Validates output** - Against schemas in skills
4. **Guarantees consistency** - Same input → same output

### For Developers

When working with documentation:

**DO:**
- ✅ Reference skills in code comments
- ✅ Follow skill schemas for data structures
- ✅ Use skill validation rules in tests
- ✅ Update skills when business logic changes

**DON'T:**
- ❌ Hard-code validation patterns
- ❌ Duplicate skill logic in multiple files
- ❌ Modify skill behavior without versioning
- ❌ Skip skill validation in critical paths

## Example: Analyzing a SOW

```bash
# Command
@docs analyze HUBSOW-1530.docx

# What happens
1. Agent loads .github/skills/sow-analysis/SKILL.md
2. Extracts metadata using ER-001 pattern
3. Parses requirements using ER-002 table regex
4. Detects impacts using IA-001 algorithm
5. Validates using .github/skills/sow-impact-mapping/SKILL.md
6. Saves results following exact schema
```

**Result:** Consistent, validated analysis every time.
```

---

## Example 6: Pull Request Description

```markdown
## PR Title: Add Email Notification SOW Analysis

### Changes
- Analyzed HUBSOW-1530 using SOW Analysis Skill v1.0
- Updated impact map following SOW Impact Mapping Skill v1.0
- Modified use-cases/treatments.md per Use Case Schema Skill v1.0

### Skills Applied

**SOW Analysis Skill v1.0** - [SKILL.md](.github/skills/sow-analysis/SKILL.md)
- ✅ ER-001: Extracted metadata (SOW ID: HUBSOW-1530, Release: R24.10)
- ✅ ER-002: Parsed 3 functional requirements
- ✅ IA-001: Detected 2 use case impacts (confidence: high)

**SOW Impact Mapping Skill v1.0** - [SKILL.md](.github/skills/sow-impact-mapping/SKILL.md)
- ✅ V-002: SOW ID validated
- ✅ V-003: Release format validated
- ✅ BR-005: Applied "latest release wins" precedence

**Use Case Schema Skill v1.0** - [SKILL.md](.github/skills/use-case-schema/SKILL.md)
- ✅ TC-001 to TC-004: Track changes formatted correctly
- ✅ BR-003: SOW references added as `[HUBSOW-1530 R24.10]`
- ✅ V-001: All required sections present

### Testing
- All skill validation rules passed
- No conflicts detected (BR-005 precedence applied)
- Word export successful with track changes

### Reviewers
@team Please verify:
1. SOW analysis follows sow-analysis skill rules
2. Impact map conforms to sow-impact-mapping schema
3. Use case changes match use-case-schema formatting
```

---

## Example 7: API Documentation

```typescript
/**
 * SOW Impact Analyzer
 * 
 * Analyzes Statement of Work documents following the SOW Analysis Skill.
 * 
 * @skill sow-analysis v1.0.0
 * @see .github/skills/sow-analysis/SKILL.md
 */
export class SowAnalyzer {
  
  /**
   * Extract SOW metadata
   * 
   * @skill-rule ER-001 - SOW Metadata Extraction
   * @param document - SOW markdown content
   * @returns Metadata object with sowId, release, priority
   * 
   * @example
   * const metadata = analyzer.extractMetadata(sowContent);
   * // Returns: { sowId: "HUBSOW-1530", release: "R24.10", priority: "HIGH" }
   */
  extractMetadata(document: string): SowMetadata {
    // Implementation follows skill ER-001
  }
  
  /**
   * Detect impacted use cases
   * 
   * @skill-rule IA-001 - Use Case Impact Detection
   * @param sowData - Parsed SOW data
   * @param useCases - Existing use case documents
   * @returns Array of impact objects
   * 
   * Scoring algorithm (from skill):
   * - Keyword match: +10 points
   * - System match: +20 points
   * - Threshold: >= 30 for impact
   * - Confidence: high (>=50), medium (>=30)
   */
  detectUseCaseImpacts(sowData: SowData, useCases: UseCase[]): Impact[] {
    // Implementation follows skill IA-001
  }
}
```

---

## Best Practices

### 1. Always Reference Skill Version
```markdown
❌ Bad: "Following the SOW analysis skill"
✅ Good: "Following SOW Analysis Skill v1.0.0 [link]"
```

### 2. Cite Specific Rules
```markdown
❌ Bad: "Validate the SOW ID"
✅ Good: "Validate SOW ID using rule V-002 from SOW Impact Mapping Skill"
```

### 3. Link to Skills
```markdown
❌ Bad: "See the skill for details"
✅ Good: "See [sow-analysis/SKILL.md](.github/skills/sow-analysis/SKILL.md) ER-001"
```

### 4. Keep Skills Updated
```markdown
When changing validation logic:
1. Update the skill SKILL.md
2. Bump version appropriately
3. Update all references
4. Run regression tests
```

---

**This approach ensures:**
- Specs are concise (reference skills, don't duplicate)
- Logic is centralized (skills are single source of truth)
- Validation is consistent (everyone uses same rules)
- Quality is guaranteed (agents execute proven logic)

---

**Last Updated:** 2026-01-27  
**Maintained By:** Tesco Mobile Documentation Team
