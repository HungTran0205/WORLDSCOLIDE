# Test Coverage Framework

## Purpose
Ensure all test scenarios are identified before writing test cases.

## Coverage Categories

### 1. User/Account Types
Identify all user types affected by the requirement:
- [ ] Residential (Consumer)
- [ ] Business
- [ ] Hybrid
- [ ] Admin/Staff
- [ ] Guest/Anonymous

### 2. Scenario Types
For each user type, check:
- [ ] **Happy Path** - Main success scenario
- [ ] **Negative Path** - Error/blocked scenarios
- [ ] **Edge Cases** - Boundary conditions, unusual inputs
- [ ] **Regression** - Existing functionality still works

### 3. Action States
- [ ] Before action (precondition)
- [ ] During action (in-progress)
- [ ] After action (result/outcome)
- [ ] Cancel/Abort action

### 4. Data Variations
- [ ] Valid data
- [ ] Invalid data
- [ ] Empty/null data
- [ ] Boundary values (min, max, min-1, max+1)

### 5. UI Elements (if applicable)
- [ ] Error messages displayed correctly
- [ ] Success messages displayed
- [ ] Buttons/links enabled/disabled appropriately
- [ ] Navigation after action

### 6. Permissions
- [ ] With required permissions
- [ ] Without required permissions
- [ ] Partial permissions

## How to Use

### Step 1: Read requirement and identify applicable categories

Not all categories apply to every requirement. Select relevant ones.

### Step 2: Create coverage matrix

```markdown
| Category | Item | Scenario | Test Case |
|----------|------|----------|-----------|
| User Type | Hybrid | Blocked from wizard | TC-1 |
| User Type | Residential | Access allowed | TC-2 |
| User Type | Business | Access allowed | TC-2 |
| UI | Error message | Displayed for Hybrid | TC-1 |
```

### Step 3: Verify no gaps

- Every row should map to a test case
- If a category item has no test case → missing coverage

## Example: HTM-33785

**Requirement:** Block Financial Wizard for Hybrid Accounts

### Coverage Matrix

| Category | Item | Covered? | Test Case |
|----------|------|----------|-----------|
| **User Types** | | | |
| | Hybrid | ✅ | TC-1 |
| | Residential | ✅ | TC-2 |
| | Business | ✅ | TC-2 |
| **Hybrid Scenarios** | | | |
| | Access blocked | ✅ | TC-1 Step 1 |
| | Error message shown | ✅ | TC-1 Step 1 |
| | Delete only option | ✅ | TC-1 Step 1 |
| | Delete works | ✅ | TC-1 Step 2 |
| **Res/Bus Scenarios** | | | |
| | Access allowed | ✅ | TC-2 Step 1,2 |
| | Wizard opens normally | ✅ | TC-2 Step 1,2 |

### Gap Analysis
All identified scenarios covered. No gaps.

## Quick Checklist

Before writing test cases, confirm:

- [ ] All user types identified
- [ ] Happy path covered
- [ ] Negative/error paths covered
- [ ] Regression scenarios identified
- [ ] UI elements verified
- [ ] Permissions considered
