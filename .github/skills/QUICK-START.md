# Agent Skills - Quick Start Guide

## What You Just Installed

✅ **Agent Skills Framework** is now set up in your repository!

### Directory Structure Created

```
.github/skills/
├── README.md                           # Complete skills documentation
├── sow-analysis/
│   └── SKILL.md                        # SOW parsing and analysis rules
├── sow-impact-mapping/
│   └── SKILL.md                        # Impact tracking schema and logic
└── use-case-schema/
    └── SKILL.md                        # Use case document structure
```

### Agent Updated

The @docs agent ([.github/agents/nova.docs.agent.md](../.github/agents/nova.docs.agent.md)) now references these skills and will read them automatically when executing commands.

---

## How It Works

### Before (Without Skills)
```
User: @docs analyze HUBSOW-1530.docx

Agent: *guesses* how to parse SOW, what fields to extract, how to detect impacts
Result: Inconsistent, may miss requirements
```

### After (With Skills)
```
User: @docs analyze HUBSOW-1530.docx

Agent: 
1. Reads .github/skills/sow-analysis/SKILL.md
2. Applies ER-001: Extract metadata using defined patterns
3. Applies ER-002: Parse functional requirements from table
4. Applies IA-001: Detect use case impacts with keyword matching
5. Reads .github/skills/sow-impact-mapping/SKILL.md
6. Validates output with V-001 through V-004
7. Saves result following exact schema

Result: Consistent, validated, complete analysis every time
```

---

## Testing Your Skills

### Test 1: SOW Analysis

Run the @docs agent with a skill-aware command:

```
@docs analyze HUBSOW-1530.docx
```

**Expected behavior:**
- Agent reads [.github/skills/sow-analysis/SKILL.md](.github/skills/sow-analysis/SKILL.md)
- Extracts metadata following ER-001 pattern
- Parses requirements using ER-002 table regex
- Detects impacts using IA-001 keyword matching
- Outputs analysis following skill's template

### Test 2: Impact Map Validation

Check if the agent validates the impact map correctly:

```
@docs map HUBSOW-999 use-cases/test.md
```

**Expected behavior:**
- Agent reads [.github/skills/sow-impact-mapping/SKILL.md](.github/skills/sow-impact-mapping/SKILL.md)
- Validates SOW ID using V-002 pattern: `HUBSOW-\d+`
- Validates document path using V-001
- Applies BR-002 to infer document type from path
- Creates mapping following schema

### Test 3: Use Case Validation

Create or update a use case:

```
@docs update use-cases/treatments.md
```

**Expected behavior:**
- Agent reads [.github/skills/use-case-schema/SKILL.md](.github/skills/use-case-schema/SKILL.md)
- Validates required sections are present
- Checks metadata format (UC-XXX, dates, status)
- Applies track changes formatting rules (TC-001, TC-002, TC-003)
- Generates Word output following skill's specifications

---

## Skills Reference

### SOW Analysis Skill

**File:** [.github/skills/sow-analysis/SKILL.md](.github/skills/sow-analysis/SKILL.md)

**Key Rules:**
- **ER-001:** SOW metadata extraction (ID, release, priority)
- **ER-002:** Functional requirements parsing (table format)
- **ER-003:** Impacted systems identification
- **IA-001:** Use case impact detection (keyword + system matching)
- **IA-002:** Interface agreement impact detection (integration keywords)
- **KE-001:** Domain keyword extraction

**Example Usage:**
```javascript
// Extract SOW metadata
const metadata = extractSowMetadata(document);
// Returns: { sowId: "HUBSOW-1530", release: "R24.10", priority: "HIGH" }
```

---

### Use Case Schema Skill

**File:** [.github/skills/use-case-schema/SKILL.md](.github/skills/use-case-schema/SKILL.md)

**Key Rules:**
- **BR-001:** Use case ID format `UC-{number}`
- **BR-002:** Status lifecycle (Draft → In Review → Approved)
- **BR-003:** SOW reference format `[SOW-ID Release]`
- **BR-004:** Main flow structure (actor-action-system)
- **V-001:** Required sections validation
- **TC-001 to TC-004:** Track changes formatting

**Example Usage:**
```javascript
// Validate use case structure
const validation = validateUseCase(document);
// Returns: { valid: true, missing: [] }
```

---

### SOW Impact Mapping Skill

**File:** [.github/skills/sow-impact-mapping/SKILL.md](.github/skills/sow-impact-mapping/SKILL.md)

**Key Rules:**
- **BR-001:** SOW ID format validation `HUBSOW-\d+`
- **BR-002:** Document type classification (FS vs IA)
- **BR-003:** Release version format `R?\d+\.\d+`
- **BR-004:** Status lifecycle (pending → synced → conflicted)
- **BR-005:** Latest release wins precedence
- **V-001 to V-004:** Path, ID, release, duplicate validation

**Example Usage:**
```javascript
// Add SOW mapping
const result = createSowMapping({
  sowId: 'HUBSOW-537',
  release: 'R21.3',
  impactedDocs: ['use-cases/address-validation.md']
});
// Returns: { success: true, impactsCreated: 1 }
```

---

## Next Steps

### 1. Share with Team

Your team members can now use the same @docs agent with guaranteed consistent behavior!

**To share:**
```bash
git add .github/skills/
git commit -m "Add Agent Skills for @docs agent"
git push
```

Team members who pull this code will automatically get:
- The skills definitions
- The updated @docs agent
- Consistent analysis and validation

### 2. Extend Skills

Add more skills as needed:

```bash
# Create new skill
mkdir .github/skills/interface-agreement-schema
# Copy template and customize
# Update @docs agent to reference it
```

### 3. Python Integration

Update Python scripts to use skill logic:

```python
# In analyze_treatments_sows.py
from pathlib import Path
import json

# Load skill
skill_path = Path('.github/skills/sow-analysis/SKILL.md')
skill = load_skill(skill_path)

# Use skill's extraction patterns
metadata = extract_sow_metadata(sow_content, skill)
requirements = extract_functional_requirements(sow_content, skill)
```

### 4. Monitor Usage

Track how skills improve consistency:
- Compare analysis quality before/after skills
- Measure reduction in manual corrections
- Document time savings in document updates

---

## Troubleshooting

### Agent Not Reading Skills

**Issue:** Agent doesn't seem to be using skill rules

**Solution:**
1. Check agent configuration: [.github/agents/nova.docs.agent.md](.github/agents/nova.docs.agent.md)
2. Verify "Agent Skills" section lists the skills
3. Ensure skill files exist and are valid markdown
4. Try explicit command: `@docs Please read the sow-analysis skill and analyze HUBSOW-1530`

### Skill Validation Errors

**Issue:** Agent reports validation errors

**Solution:**
1. Check skill SKILL.md for validation rules
2. Verify your data matches the schema
3. Look for validation rule codes (V-001, V-002, etc.)
4. Update data to match expected format

### Skills Out of Sync

**Issue:** Skills don't match Python script behavior

**Solution:**
1. Update Python scripts to match skill logic
2. Or update skill to match Python implementation
3. Keep skills as single source of truth
4. Version skills appropriately when changing

---

## Resources

- **Skills README:** [.github/skills/README.md](.github/skills/README.md)
- **Agent Guide:** [docs/AGENT-USAGE-GUIDE.md](../../docs/AGENT-USAGE-GUIDE.md)
- **Confluence:** [Skills Documentation](https://hansentechnologies.atlassian.net/wiki/spaces/PROV/pages/6152946046/)

---

**Created:** 2026-01-27  
**Author:** Dan Grecu  
**Status:** ✅ Ready to Use
