---
name: tm:testcase-analysis
description: This skill should be used when user want to standardized test cases in Markdown/Excel format. Activates for reading user stories, extracting acceptance criteria, creating High Level Test Plans (HLTP) with matrix or single-column format, brainstorming test scenarios, verifying coverage, and writing detailed QA test documentation. Includes automated Excel export with hansen_logo branding.
metadata: version: 1.00
triggers:
  - pattern: \b(testcase-analysis|tca)\b
    type: command
    description: Standardized test case generation from Jira tickets.
    examples:
      - testcase-analysis HTM-1234
      - tca HTM-5678, HTM-91011
---

# Test Case Analysis

Analyze requirements from Jira and generate well-structured test cases for QA review.

---

## Quick Start

```
testcase-analysis HTM-XXXX              # Single ticket
testcase-analysis HTM-XXXX, HTM-YYYY    # Multiple tickets
tca HTM-XXXX                            # Short alias
```

---

## Workflow Overview

```
Step 1: Fetch Jira        → Get ticket info from Jira
            ↓
Step 2: Requirement Analysis  → Create {Jira-ID}-requirement-analysis.md
            ↓                   ⏸️ PAUSE for user review
            ↓                   User provides additional info if needed
            ↓                   User confirms "OK" → proceed
            ↓
Step 3: HLTP Review       → Present 2 format options (Matrix vs Single Column)
            ↓               User selects format
            ↓               Create {Jira-ID}-high-level-test-plan-analysis.md
            ↓               Ask "Export Excel?" → Create JSON + Excel
            ↓               ⏸️ PAUSE for user confirmation
            ↓
Step 4: Extract Scenarios → Brainstorm all test scenarios
            ↓
Step 5: Verify Coverage   → Check coverage matrix (no gaps)
            ↓
Step 6: Write Test Cases  → Create {Jira-ID}-TestCases.md
```

---

## Output Structure

All outputs saved in folder `test/{Jira-ID}/`:

```
test/{Jira-ID}/
├── {Jira-ID}-requirement-analysis.md       # Step 2
├── {Jira-ID}-high-level-test-plan-analysis.md   # Step 3
├── {Jira-ID}-high-level-test-plan-analysis.json # Step 3
├── {Jira-ID}-scenarios.json                # Step 4
├── {Jira-ID}-TestCases.md                  # Step 6
└── {Account-Code} - {Account-Name} - HLTP.xlsx  # Step 3 (Excel)
```

---

## Step-by-Step Instructions

### Step 1: Fetch Jira & Gather Context

1. Use `mcp_atlassian_atl_getJiraIssue` to fetch ticket
2. Extract key fields:

| Jira Field | Usage |
|------------|-------|
| `key` | Jira ID, folder name |
| `summary` | Ticket title |
| `description` | Requirements |
| `customfield_16001.value` | Account (for Excel naming & CHSOW cross-ref) |
| `fixVersions[].name` | Fix Version |
| `components[].name` | Components |
| `priority.name` | Priority |
| `issuelinks` | Linked issues (look for CHSOW tickets) |
| `attachment` | Attached files (PDFs, Word docs, images) |

**CloudId:** `hansentechnologies.atlassian.net`

#### 1a. Fetch Linked CHSOW Tickets

- Check `issuelinks` for linked CHSOW issues
- Check `customfield_16001.value` (Account) for CHSOW references (e.g., CHSOW-119)
- Use `mcp_atlassian_atl_getJiraIssue` to fetch each linked CHSOW ticket
- Use `mcp_atlassian_atl_search` to find Confluence pages referencing the CHSOW
- Extract SOW scope, functional requirements, and acceptance criteria from CHSOW tickets

#### 1b. Process Attached Documents

- List all attachments from the Jira ticket response
- **PDFs:** Use `tm:pdf-to-markdown` skill (`scripts/pdf_to_md.py`) to convert and extract content
- **Word docs (.docx):** Use `tm:docx` skill (`scripts/docx_to_md.py`) to convert and extract content
- **Images (.png, .jpg):** Download via `web/fetch`; include as visual references and describe UI mockups/diagrams
- Save converted content to `test/{Jira-ID}/attachments/`

#### 1c. Check for Existing Tests

- Search for sub-tasks or linked test issues:
  - JQL: `issue in linkedIssues("{Jira-ID}") AND type in (Test, "Test Execution")`
  - Filter `issuelinks` for link types: `Test` (inward: "is tested by"), `Testing` (inward: "Is tested by")
  - Only include issues of type `Test` — ignore UAT tests, coding sub-tasks, etc.
- For each linked test issue, fetch its full description using `getJiraIssue` and extract:

| Field | What to Extract |
|-------|-----------------|
| `key` | Test ticket ID (e.g., HTM-35301) |
| `summary` | Test case name |
| `description` | Full test steps, pre-conditions, and expected results |

- Build a **test inventory** — a list of all test tickets with their steps and expected results
- Check if `test/{Jira-ID}/` folder already exists locally with prior analysis or test cases
- If existing tests found: incorporate them, flag gaps, avoid duplication

#### 1d. Identify Missing Test Coverage

- Compare the ACs (from Jira, CHSOW, attachments) against the existing tests found in 1c
- Cross-reference: map each Jira test ticket (from 1c) to which ACs it covers
- For each AC, determine whether it is covered by at least one existing test. Ensure that the gap is not covered by another story or ticket under the CHSOW.
- List gaps as **Missing Tests** — ACs or scenarios with no existing test coverage
- Consider missing coverage for:
  - Negative/error paths (e.g., API failures, invalid responses)
  - Boundary values (e.g., zero amount, negative amount, max values)
  - Trigger paths not yet tested (e.g., SCWS vs Care, if only one path has tests)
  - Contention/concurrency scenarios
  - Data validation (e.g., correct template IDs, subscription ID format)
- Determine the target module by analyzing:
  - The component (Care, SCWS, API, etc.) mentioned in test ticket summaries
  - The existing module structure under `tests/`
- Output a **Coverage Gap Summary** table in the requirement analysis

---

### Step 2: Requirement Analysis

1. Analyze Jira description and extract Acceptance Criteria (ACs)
2. Incorporate CHSOW context: SOW scope, functional requirements, acceptance criteria
3. Incorporate attachment content: specs from PDFs/Word docs, UI references from images
4. Note any existing tests and their coverage
5. Identify missing test coverage (gap analysis from Step 1d)
6. Create `test/{Jira-ID}/{Jira-ID}-requirement-analysis.md`
7. Use [Requirement Analysis Reference](references/requirement-analysis.md) (DO NOT use EARS patterns for this skill)

**⏸️ PAUSE:** Ask user to review. Wait for:
- User confirms ACs are complete, OR
- User provides additional info → Update file → Re-confirm

**Prompt template:**
> I have created the requirement analysis file. Please review:
> - Are all Acceptance Criteria (ACs) correct and complete?
> - Are there any ACs that need to be added?
> - Is the CHSOW context accurately captured?
> 
> After confirmation, I will proceed to create the High Level Test Plan.

---

### Step 3: HLTP Review

1. Present 2 format options (see [HLTP Format Reference](references/hltp-format.md)):
   - **Option 1:** Matrix Table (conditions as separate columns)
   - **Option 2:** Single Column (all conditions in one column)

2. After user selects:
   - Create `test/{Jira-ID}/{Jira-ID}-high-level-test-plan-analysis.md`
   - **IMPORTANT:** Create JSON with correct structure (see below)
   - Ask "Would you like to export to Excel?"
   - If yes: Generate Excel file using JSON

3. **⏸️ PAUSE:** Confirm HLTP is complete before proceeding to test cases

**JSON Structure (CRITICAL):**
```json
{
  "jira_id": "{Jira-ID}",
  "title": "{Title from Jira}",
  "account": "{customfield_16001.value}",
  "summary": {
    "epic": "{parent.key} - {parent.summary}",
    "tester": "TBD or {assignee}",
    "team": "System Test",
    "sprint": "{customfield_10007[0].name}",
    "version": "{fixVersions[0].name}",
    "notes": "Environment or additional notes",
    "stories": [
      {
        "id": "{Jira-ID}",
        "description": "{summary}",
        "owner": "TBD or {assignee}",
        "sheet": "{Jira-ID}"
      }
    ]
  },
  "scenarios": [
    {
      "number": 1,
      "ac": "AC_XX",
      "category": "Positive|Negative|Edge Case",
      "summary": "Test scenario description",
      "conditions": { /* condition key-value pairs */ },
      "expected": "Expected result"
    }
  ]
}
```

**Prompt template:**
> HLTP is complete. Would you like to proceed with writing Test Cases?

---

### Step 4: Extract Scenarios

1. Read confirmed requirement analysis
2. Brainstorm all test scenarios using [Scenario Patterns](references/scenario-patterns.md)
3. Save to `test/{Jira-ID}/{Jira-ID}-scenarios.json`

---

### Step 5: Verify Coverage

This is an **iterative loop** — repeat until no gaps remain (max 5 iterations).

1. Use [Test Coverage Framework](references/test-coverage.md)
2. Create coverage matrix — for each AC, verify at least one test scenario exists:

| Check | Source | Target |
|-------|--------|--------|
| AC → Test scenario | Each AC from requirement analysis | A matching scenario in HLTP or test cases |
| Pre-conditions covered | AC pre-conditions | Test setup steps |
| All expected results covered | AC expected outcomes | Test assertions |
| Business rules reflected | Business rules section | Test assertions (thresholds, status transitions) |

3. Cross-reference against requirement analysis:
   - Every AC marked as "covered by test" has at least one test scenario exercising it
   - Missing Test Scenarios from Coverage Gap Analysis have been addressed
   - Negative/error path scenarios have correct failure assertions

4. Identify gaps and produce a gap report:

| Gap # | AC / Test Ticket | Missing Element | Gap Type |
|-------|-----------------|-----------------|----------|
| 1 | AC_XX / HTM-XXXXX | Step not implemented | Missing step |
| 2 | AC_YY / HTM-YYYYY | DB verification absent | Missing assertion |
| 3 | AC_ZZ | No test scenario | Missing test case |

   Gap types: Missing test case, Missing step, Missing assertion, Missing pre-condition, Incorrect mapping

5. Close gaps — iterate until the gap report is empty:
   - Missing test case → add new scenario
   - Missing step → extend test steps
   - Missing assertion → add verification
   - Missing pre-condition → extend setup

---

### Step 6: Write Test Cases

1. From each scenario → create detailed test case
2. Follow [Test Case Format](references/testcase-format.md)
3. Save to `test/{Jira-ID}/{Jira-ID}-TestCases.md`

---

## References

| File | Purpose |
|------|---------|
| [requirement-analysis.md](references/requirement-analysis.md) | Checklist for analyzing requirements |
| [hltp-format.md](references/hltp-format.md) | HLTP format options and templates |
| [scenario-patterns.md](references/scenario-patterns.md) | Positive/negative test patterns |
| [test-coverage.md](references/test-coverage.md) | Coverage verification framework |
| [testcase-format.md](references/testcase-format.md) | Test case formatting rules |
| [test-evidence-guide.md](references/test-evidence-guide.md) | Word document test evidence template guide |

## Templates

| File | Purpose |
|------|---------|
| [hltp-single-story.template.json](templates/hltp-single-story.template.json) | JSON template for single story HLTP ⭐ **Use this for single tickets** |
| [hltp-multi-sheet.template.json](templates/hltp-multi-sheet.template.json) | JSON template for multi-story HLTP (multiple sheets) |

## Scripts

| Script | Command |
|--------|---------|
| `generate_hltp.py` | `python scripts/generate_hltp.py --data {json} --output {xlsx}` |

**Excel Generation Requirements:**
- JSON must follow exact structure (see templates)
- Required fields: `jira_id`, `title`, `account`, `summary`, `scenarios`
- `summary` must contain: `epic`, `tester`, `team`, `sprint`, `version`, `notes`, `stories`
- Each story needs: `id`, `description`, `owner`, `sheet`

---

## Common Issues & Fixes

**Issue:** Excel file missing metadata  
**Cause:** Wrong JSON structure (using `metadata` instead of `summary`)  
**Fix:** Use correct structure from templates (see Step 3 or templates/)

**Issue:** Permission denied when regenerating Excel  
**Cause:** File is open in Excel  
**Fix:** Close Excel file or generate with different filename

**Issue:** Scenarios not showing in Excel  
**Cause:** Missing `scenarios` array or wrong format  
**Fix:** Verify `scenarios` is array with `number`, `ac`, `summary`, `conditions`, `expected`
