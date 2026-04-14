---
name: tm:use-case-schema
metadata: version: 1.00
---

# Use Case Document Schema Skill

**Version:** 1.0.0  
**Last Updated:** 2026-01-27  
**Scope:** Use Case Document Structure and Validation

---

## Purpose

This skill defines the canonical structure, required sections, and validation rules for use case documentation in the Tesco Mobile project. It ensures consistency across all functional specification documents.

---

## Document Schema

### Required Sections

```markdown
# Use Case: [Title]

**ID:** UC-XXX  
**Status:** Draft | In Review | Approved  
**Last Updated:** YYYY-MM-DD  
**Owner:** [Team/Person]

---

## Overview
[Brief description]

## Actors
- **Primary Actor:** [Role]
- **Secondary Actors:** [Roles]

## Preconditions
- [Conditions that must be true before execution]

## Postconditions
- [Conditions that will be true after successful execution]

## Main Flow
1. [Step-by-step primary scenario]

## Alternative Flows
### Alt Flow 1: [Name]
[Steps for alternative scenario]

## Exception Flows
### Exception 1: [Name]
[Steps for error handling]

## Business Rules
- BR-001: [Rule description]

## Non-Functional Requirements
- **Performance:** [Requirements]
- **Security:** [Requirements]
- **Usability:** [Requirements]

## Related Use Cases
- [UC-XXX]: [Relationship]

## Change History
| Date | SOW | Description | Updated By |
|------|-----|-------------|------------|
```

---

## Field Definitions

### Metadata Fields

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `ID` | string | Yes | UC-{number} | UC-001, UC-123 |
| `Status` | enum | Yes | Draft \| In Review \| Approved | Approved |
| `Last Updated` | date | Yes | YYYY-MM-DD | 2026-01-27 |
| `Owner` | string | Yes | Team or person name | Care Team |

### Section Requirements

| Section | Required | Min Lines | Description |
|---------|----------|-----------|-------------|
| Overview | Yes | 2 | High-level purpose and value |
| Actors | Yes | 1 | Primary and secondary actors |
| Preconditions | Yes | 1 | Entry conditions |
| Postconditions | Yes | 1 | Exit conditions |
| Main Flow | Yes | 3 | Primary success scenario |
| Alternative Flows | No | 0 | Optional alternative paths |
| Exception Flows | No | 0 | Error handling scenarios |
| Business Rules | Yes | 1 | Constraints and policies |
| Non-Functional Requirements | No | 0 | Quality attributes |
| Related Use Cases | No | 0 | Dependencies/relationships |
| Change History | Yes | 1 | SOW-driven changes |

---

## Business Rules

### BR-001: Use Case ID Format
**Rule:** Use case IDs must follow pattern `UC-{number}` where number is zero-padded to 3 digits  
**Examples:**
- Valid: `UC-001`, `UC-123`, `UC-999`
- Invalid: `UC-1`, `UC1`, `USE-CASE-001`

---

### BR-002: Status Lifecycle
**Rule:** Use case status follows a defined workflow  
**States:**
1. `Draft` - Initial creation, work in progress
2. `In Review` - Submitted for stakeholder review
3. `Approved` - Signed off by stakeholders

**Valid Transitions:**
- Draft → In Review
- In Review → Draft (for revisions)
- In Review → Approved
- Approved → In Review (for updates from new SOWs)

---

### BR-003: SOW Reference Format
**Rule:** All changes must reference the SOW that triggered them  
**Format:** `[SOW-ID Release]`  
**Examples:**
- `[HUBSOW-1530 R24.10]`
- `[HUBSOW-1421-SCR R25.6]`

**Placement:** Inline after changed text as italic comment

---

### BR-004: Main Flow Structure
**Rule:** Main flow must use numbered steps with actor-action-system format  
**Format:** `{Step}. {Actor} {verb} {object/action}`

**Examples:**
```markdown
1. CSR selects customer account
2. System displays account details
3. CSR initiates treatment suspension
4. System validates eligibility
5. System creates suspension record
```

---

### BR-005: Business Rule Numbering
**Rule:** Business rules must be numbered sequentially starting with BR-001  
**Format:** `BR-{number}: {description}`

**Example:**
```markdown
## Business Rules
- BR-001: Treatments can only be suspended for active subscriptions
- BR-002: Maximum suspension period is 90 days
- BR-003: CSR must provide suspension reason
```

---

## Validation Rules

### V-001: Required Sections Present
```javascript
function validateRequiredSections(document) {
  const required = [
    '## Overview',
    '## Actors',
    '## Preconditions',
    '## Postconditions',
    '## Main Flow',
    '## Business Rules',
    '## Change History'
  ];
  
  const missing = required.filter(section => 
    !document.includes(section)
  );
  
  return {
    valid: missing.length === 0,
    missing: missing
  };
}
```

### V-002: Metadata Completeness
```javascript
function validateMetadata(document) {
  const patterns = {
    id: /\*\*ID:\*\* UC-\d{3}/,
    status: /\*\*Status:\*\* (Draft|In Review|Approved)/,
    lastUpdated: /\*\*Last Updated:\*\* \d{4}-\d{2}-\d{2}/,
    owner: /\*\*Owner:\*\* .+/
  };
  
  return Object.entries(patterns).every(([field, pattern]) => 
    pattern.test(document)
  );
}
```

### V-003: Change History Format
```javascript
function validateChangeHistory(document) {
  const tablePattern = /\| Date \| SOW \| Description \| Updated By \|/;
  const rowPattern = /\| \d{4}-\d{2}-\d{2} \| HUBSOW-\d+ \| .+ \| .+ \|/;
  
  return tablePattern.test(document) && rowPattern.test(document);
}
```

---

## Examples

### Example 1: Minimal Valid Use Case

```markdown
# Use Case: Customer Account Lookup

**ID:** UC-042  
**Status:** Approved  
**Last Updated:** 2026-01-15  
**Owner:** Care Team

---

## Overview
Enable CSRs to search and retrieve customer account information by phone number, email, or account ID.

## Actors
- **Primary Actor:** Customer Service Representative (CSR)
- **Secondary Actors:** CRM System

## Preconditions
- CSR is authenticated in Hub.net
- Customer database is accessible

## Postconditions
- Customer account details are displayed
- Account lookup is logged for audit

## Main Flow
1. CSR enters search criteria (phone/email/account ID)
2. System validates search input
3. System queries customer database
4. System displays matching accounts
5. CSR selects target account
6. System displays full account details

## Business Rules
- BR-001: Minimum 3 characters required for search
- BR-002: Maximum 100 results returned per search
- BR-003: PII data requires access permission level 2+

## Change History
| Date | SOW | Description | Updated By |
|------|-----|-------------|------------|
| 2026-01-15 | HUBSOW-1200 | Initial creation | Dan Grecu |
```

### Example 2: Use Case with SOW Updates

```markdown
# Use Case: Treatment Management

**ID:** UC-089  
**Status:** Approved  
**Last Updated:** 2026-01-25  
**Owner:** Billing Team

---

## Overview
~~Treatments provide a mechanism for managing customer payment arrangements through letter notifications only.~~ **Treatments now support multiple notification channels including letters, emails, and SMS.** *[HUBSOW-1530 R24.10]*

## Actors
- **Primary Actor:** Billing System
- **Secondary Actors:** Customer, CSR, **Email Service Provider** *[HUBSOW-1530 R24.10]*, **SMS Gateway** *[HUBSOW-1530 R24.10]*

## Main Flow
1. System identifies customer requiring treatment
2. System creates treatment record
3. System generates notification ~~letter~~ **content** *[HUBSOW-1530 R24.10]*
4. **System determines customer's preferred notification channel** *[HUBSOW-1530 R24.10]*
5. **IF channel is email, System sends via Email Service Provider** *[HUBSOW-1530 R24.10]*
6. **IF channel is SMS, System sends via SMS Gateway** *[HUBSOW-1530 R24.10]*
7. **IF channel is letter or no preference, System generates PDF letter** *[HUBSOW-1530 R24.10]*
8. System logs notification delivery

## Business Rules
- BR-001: Treatment letters ~~are sent~~ **and emails include** accessibility features *[HUBSOW-1421 R24.9]*
- BR-002: **Customer can opt-in to email/SMS notifications in self-care** *[HUBSOW-1530 R24.10]*

## Change History
| Date | SOW | Description | Updated By |
|------|-----|-------------|------------|
| 2024-08-10 | HUBSOW-1100 | Initial creation | John Smith |
| 2024-12-15 | HUBSOW-1421 | Added accessibility requirements | Dan Grecu |
| 2026-01-25 | HUBSOW-1530 | Added email/SMS notification channels | Dan Grecu |
```

---

## Track Changes Formatting Rules

### TC-001: Deletion Format
```markdown
~~deleted text~~
```

### TC-002: Addition Format
```markdown
**new text**
```

### TC-003: SOW Reference Format
```markdown
*[SOW-ID Release]*
```

### TC-004: Combined Example
```markdown
~~old functionality~~ **new enhanced functionality** *[HUBSOW-1530 R24.10]*
```

---

## Integration with Word Export

When converting to Word with track changes:

1. **Strikethrough text** (`~~text~~`) → Word strikethrough + red color
2. **Bold text** (`**text**`) → Word bold + blue color (insertion)
3. **Italic reference** (`*[SOW]*`) → Word comment bubble

Example Python implementation:
```python
def apply_track_changes(paragraph, markdown_text):
    # Parse markdown track change syntax
    deleted = re.findall(r'~~(.+?)~~', markdown_text)
    added = re.findall(r'\*\*(.+?)\*\*', markdown_text)
    sow_ref = re.findall(r'\*\[(.+?)\]\*', markdown_text)
    
    # Apply Word track changes
    for text in deleted:
        run = paragraph.add_run(text)
        run.font.strike = True
        run.font.color.rgb = RGBColor(255, 0, 0)
    
    for text in added:
        run = paragraph.add_run(text)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0, 0, 255)
        run._element.get_or_add_rPr().append(
            create_track_change_insert()
        )
    
    for ref in sow_ref:
        add_comment(paragraph, f"SOW Reference: {ref}")
```

---

## Test Cases

### TC-001: Valid Use Case Structure
```javascript
test('should validate complete use case', () => {
  const doc = readFile('use-cases/customer-billing.md');
  const validation = validateUseCase(doc);
  
  expect(validation.valid).toBe(true);
  expect(validation.errors).toHaveLength(0);
});
```

### TC-002: Missing Required Section
```javascript
test('should detect missing Main Flow section', () => {
  const doc = createDocWithout('## Main Flow');
  const validation = validateUseCase(doc);
  
  expect(validation.valid).toBe(false);
  expect(validation.missing).toContain('## Main Flow');
});
```

### TC-003: Invalid Use Case ID
```javascript
test('should reject invalid UC ID format', () => {
  const doc = createDocWithId('UC-1'); // Should be UC-001
  const validation = validateMetadata(doc);
  
  expect(validation.valid).toBe(false);
  expect(validation.errors).toContain('Invalid UC ID format');
});
```

---

## Common Patterns

### Pattern 1: Actor-System Interaction
```markdown
1. {Actor} initiates {action}
2. System validates {input}
3. System processes {operation}
4. System displays {result}
5. {Actor} confirms {action}
```

### Pattern 2: Error Handling
```markdown
## Exception Flows

### Exception 1: Validation Failure
**Trigger:** When input validation fails

1. System displays error message: "{field} is required"
2. System highlights invalid field
3. CSR corrects input
4. Return to step X of main flow
```

### Pattern 3: Integration Point
```markdown
## Related Systems
- **HUB** - Core billing system
- **Netcracker** - Network provisioning
- **OCS** - Online charging system

## Integration Notes
- Uses REST API for HUB communication
- Async messaging for Netcracker orders
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-01-27 | Initial skill definition | Dan Grecu |

---

## Related Skills
- `tm:sow-impact-mapping` - SOW to document mapping
- `track-changes-generation` - Word export formatting
- `interface-agreement-schema` - IA document structure

---

## Notes
- This skill is referenced by @docs agent for use case validation
- Template file: `docs/use-cases/.template.md`
- Word export script: `convert_markdown_to_word_tracked.py`
