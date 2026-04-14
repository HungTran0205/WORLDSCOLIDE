# Automation Transform Planning

Planning workflow for converting teste.md to Robot Framework test scripts.

## Trigger Detection

Activate this flow when:
- User provides file path matching  `test/*/{Jira-ID}-TestCases.md` or `test/*/{Jira-ID}-requirement-analysis.md`
- Request contains "convert to robot framework" or "generate test scripts"
- Request mentions "automation plan" for a Jira ticket

## 1. Input Validation

### File Existence Check
```bash
# Verify file exists
test -f "test/{Jira-ID}/{Jira-ID}-TestCases.md"
test -f "test/{Jira-ID}/{Jira-ID}-requirement-analysis.md"
```

### BDD Format Validation
Confirm presence of:
- `### AC-XX:` section headers
- `**Given**` blocks with bullet points
- `**When**` blocks
- `**Then**` blocks with expected results

## 2. Extract Metadata

From TestCases.md and requirement-analysis.md, extract:
| Field | Pattern | Example |
|-------|---------|---------|
| Jira ID | `**Jira ID:** {ID}` | HTM-34762 |
| Title | `**Title:** {Title}` | OR_01 New Blank SIM Process |
| Components | Section 4 Technical Requirements | OWS, Netcracker, Oakwood |

## 3. Module Mapping

Analyze content to determine target Robot Framework module:

| Keywords Found | Target Module | Existing Keywords File |
|----------------|---------------|------------------------|
| OWS, Order, Oakwood, SIM | `OrderingWS/` | `OrderingWS_Keywords.robot` |
| Care, Customer, Portal | `Care/` | `Care_Keywords.robot` |
| API, REST, endpoint | `API/` | `API_Keywords.robot` |
| Payment, Invoice, Credit | `Payments/` | `Payments_Keywords.robot` |
| Batch, Job, Schedule | `Batch/` | `Batch_Keywords.robot` |
| eSIM, ICCID, Dispatch | `OrderingWS/` | `eSIM_*_Keywords.robot` |

## 4. Scenario Extraction

For each `### AC-XX:` block:
1. Extract AC number and title
2. Parse Given/When/Then structure
3. Identify test category (Positive/Negative/Edge Case)
4. Map to scenario name format: `{Jira-ID}_{AC#} {Title}`

## 5. Keyword Reuse Analysis

Search existing keywords before generating new ones:
```
grep_search patterns:
- "Given.*{condition}" in tests/{Module}/*_Keywords.robot
- "When.*{action}" in tests/Commons/*_Keywords.robot
- "Then.*{verification}" in resources/Helpers/*.robot
```

## 6. Output: Automation Plan

### 6.1 Phase Grouping Strategy

Group Acceptance Criteria into phases based on:
- **Complexity**: Similar complexity levels per phase
- **Dependencies**: Sequential ACs in same phase
- **Test Count**: 1-5 test cases per phase
- **Module**: ACs targeting same module/component

### 6.2 Index File Structure

Create `test/{Jira-ID}/{Jira-ID}-automation-plan.md` as the master index:

```markdown
# Automation Plan: {Jira-ID} - {Title}

## Overview
- **Jira ID**: {Jira-ID}
- **Module**: {Target Module}
- **Total Phases**: {N}
- **Total Test Cases**: {Count}

## Phase Breakdown

### Phase 01: {Phase Focus}
- **File**: [phase01-{Jira-ID}-automation-plan.md](phases/phase01-{Jira-ID}-automation-plan.md)
- **ACs**: AC-01, AC-02, AC-03
- **Test Cases**: 5
- **Status**: Not Started

### Phase 02: {Phase Focus}
- **File**: [phase02-{Jira-ID}-automation-plan.md](phases/phase02-{Jira-ID}-automation-plan.md)
- **ACs**: AC-04, AC-05
- **Test Cases**: 3
- **Status**: Not Started

## Global Resources

### Reusable Keywords
- List shared keywords across phases

### New Keywords Required
- Keywords needing implementation

### Page Objects
- Page object files required
```

### 6.3 Individual Phase File Structure

Create `test/{Jira-ID}/phases/phase{NN}-{Jira-ID}-automation-plan.md` for each phase:

```markdown
# Phase {NN}: {Phase Focus}

## Phase Metadata
- **Jira ID**: {Jira-ID}
- **Module**: {Target Module}
- **Test Cases**: {1-5}
- **Dependencies**: Phase {NN-1} completion (if applicable)
- **Estimated Effort**: {Hours}

## Acceptance Criteria Coverage

### AC-{XX}: {AC Title}

#### Test Scenarios
1. **Scenario**: {Jira-ID}_AC{XX}_01 {Scenario Name}
   - **Type**: Positive/Negative/Edge Case
   - **Priority**: High/Medium/Low
   
   **Given Steps**:
   - Map to existing keyword: `{Keyword Name}` OR
   - New keyword needed: `{New Keyword Description}`
   
   **When Steps**:
   - Map to existing keyword: `{Keyword Name}` OR
   - New keyword needed: `{New Keyword Description}`
   
   **Then Steps**:
   - Map to existing keyword: `{Keyword Name}` OR
   - New keyword needed: `{New Keyword Description}`

2. **Scenario**: {Jira-ID}_AC{XX}_02 {Scenario Name}
   - ...

### AC-{YY}: {AC Title}
- (Continue for 1-5 ACs per phase)

## Implementation Plan

### Step 1: Setup
- [ ] Create test file: `tests/{Module}/{Jira-ID}_Tests.robot`
- [ ] Import required keywords
- [ ] Setup test data

### Step 2: Keyword Development
- [ ] Implement new keyword: `{Keyword Name}`
- [ ] Update existing keyword: `{Keyword Name}`

### Step 3: Test Case Implementation
- [ ] TC 1: {Scenario Name}
- [ ] TC 2: {Scenario Name}
- [ ] ...

### Step 4: Validation
- [ ] Execute test cases
- [ ] Verify results
- [ ] Update phase status

## Keyword Mapping

| Step Type | Description | Keyword Source | Status |
|-----------|-------------|----------------|--------|
| Given | {Condition} | `tests/Commons/Common_Keywords.robot` | Exists |
| When | {Action} | New: `{Keyword Name}` | To Create |
| Then | {Verification} | `resources/Helpers/DataHelper.robot` | Exists |

## Test Data Requirements

- Test data file: `resources/TestData/{Jira-ID}_TestData.yml`
- Sample data structures needed
- Database setup requirements

## Page Objects Required

- [ ] `resources/Pages/{PageName}Page.robot` (if UI tests)
```

### 6.4 Phase Numbering Convention

- Use zero-padded format: `phase01`, `phase02`, ..., `phase10`
- Maximum 5 test cases per phase (split if exceeds)
- Minimum 1 test case per phase

## 7. Handoff

After user approves automation plan:
- Activate `tm:requirement-to-robotfw` skill
- Pass automation-plan.md as input
- Generate Robot Framework test files
