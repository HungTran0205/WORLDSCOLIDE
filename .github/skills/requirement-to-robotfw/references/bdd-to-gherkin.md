# BDD to Robot Framework Gherkin Mapping

## Input Format (requirement-analysis.md)

### AC Block Pattern
```markdown
### AC-XX: {Title}
**Given** {preconditions}:
- condition 1
- condition 2

**When** {action}

**Then** the system should:
- expected result 1
- expected result 2
```

## Output Format (Robot Framework)

### Test Case Pattern
```robotframework
Scenario: {Jira-ID}_{AC#} {Sanitized_Title}
    [Documentation]    {AC description from Given/When/Then}
    [Tags]    {Module}    {Jira-ID}    {Category}
    Given {Precondition_Keyword}
    When {Action_Keyword}
    Then {Verification_Keyword}
    And {Additional_Verification}
```

## Transformation Rules

### 0. Scenario Block Cardinality (Mandatory)

- Exactly one `When` block and one `Then` block are allowed per `Scenario`.
- Additional assertions must be expressed with `And` steps after the single `Then` step.
- Additional preconditions must be expressed with `And` steps after `Given`.
- If source AC text implies multiple distinct actions/outcomes, split into multiple scenarios (one action path per scenario).

### 1. AC Title → Scenario Name

**Rule:** `{Jira-ID}_{AC#} {Title_Words_Joined}`

| Input | Output |
|-------|--------|
| `AC-01: NEW Online Order - MPN Provided` | `HTM-34762_AC01 NEW Online Order MPN Provided` |
| `AC-04: NEW Instore Order - MPN NOT Provided` | `HTM-34762_AC04 NEW Instore Order MPN NOT Provided` |

**Sanitization:**
- Remove special characters except underscores
- Replace hyphens with spaces
- Title case each word

### 2. Given Block → Given Steps

**Single Condition:**
```markdown
**Given** a NEW Online order
```
→
```robotframework
Given A NEW Online Order Is Created
```

**Multiple Conditions (combine into keyword):**
```markdown
**Given** a NEW Online order with:
- Order Type = NEW
- MPN provided
- SIM.Type = BLANK
```
→
```robotframework
Given A NEW Online Order With MPN And Blank SIM
```

### 3. When Block → When Steps

**Simple Action:**
```markdown
**When** the order is processed
```
→
```robotframework
When The Order Is Processed
```

**Action with Object:**
```markdown
**When** Admin completes the order
```
→
```robotframework
When Admin Completes The Order
```

### 4. Then Block → Then Steps

**Single Verification:**
```markdown
**Then** NC Soft Reserve should not be called
```
→
```robotframework
Then NC Soft Reserve Should Not Be Called
```

**Multiple Verifications:**
```markdown
**Then** the system should:
- NOT perform NC Soft Reserve
- Create Activate Subscription SO
- Provision to Netcracker
```
→
```robotframework
Then NC Soft Reserve Should Not Be Called
And Activate Subscription Service Order Should Be Created
And Order Should Be Provisioned To Netcracker
```

**Prohibited in a single scenario:**
```robotframework
When First Action Happens
Then First Result Is Verified
When Second Action Happens
Then Second Result Is Verified
```

**Refactor as:**
- Split into two scenarios, each with one `When` and one `Then`.

## Category Detection

| Keywords in AC | Category Tag |
|----------------|--------------|
| "should", "verify", "valid" | `Positive` |
| "should not", "reject", "error", "invalid" | `Negative` |
| "timeout", "expired", "concurrent", "delayed" | `EdgeCase` |
| "existing behavior", "no changes" | `Regression` |
