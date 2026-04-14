# HLTP Format Reference

> High Level Test Plan format options and templates.

---

## Output Files

**Path:** `test/{Jira-ID}/`

| File | Purpose |
|------|---------|
| `{Jira-ID}-high-level-test-plan-analysis.md` | HLTP markdown for review |
| `{Jira-ID}-high-level-test-plan-analysis.json` | JSON data for Excel generation |
| `{Account-Code} - {Account-Name} - HLTP.xlsx` | Excel export |

---

## Format Options

Present 2 options to user before creating HLTP:

### Option 1: Matrix Table Format

Preconditions displayed as separate columns.

```markdown
| # | AC | Summary | Condition A | Condition B | Condition C | Expected Result |
|---|----|---------|-----------  |-------------|-------------|-----------------|
| 1 | AC_01 | Scenario 1 | Value A1 | Value B1 | Value C1 | Result 1 |
| 2 | AC_02 | Scenario 2 | Value A2 | Value B2 | Value C2 | Result 2 |
```

**Pros:**
- ✅ Easy to compare values across scenarios
- ✅ Clear visibility of each condition
- ✅ Excel export creates dynamic sub-columns

**Cons:**
- ❌ Wide table
- ❌ Empty cells "-" when condition doesn't apply

**Best For:** Batch jobs, API testing, data-driven testing

---

### Option 2: Single Column Format

All preconditions in one text column.

```markdown
| # | AC | Summary | Preconditions / Input | Expected Result |
|---|----|---------|-----------------------|-----------------|
| 1 | AC_01 | Scenario 1 | Cond A = X, Cond B = Y | Result 1 |
| 2 | AC_02 | Scenario 2 | Cond A = P, Cond B = Q | Result 2 |
```

**Pros:**
- ✅ Compact, easy to read
- ✅ Flexible for varied conditions

**Cons:**
- ❌ Hard to compare across scenarios

**Best For:** UI testing, integration testing

---

## Decision Matrix

| Criteria | Matrix (Option 1) | Single Column (Option 2) |
|----------|-------------------|--------------------------|
| Shared conditions | ✅ Preferred | ⚠️ Works |
| Varied conditions | ⚠️ Many empty cells | ✅ Preferred |
| Easy comparison | ✅ Excellent | ❌ Difficult |
| Compact display | ❌ Wide table | ✅ Narrow |

---

## JSON Structure (REQUIRED for Excel Generation)

**CRITICAL:** JSON must follow this exact structure for Excel generator to work:

### Required Root Fields

```json
{
  "jira_id": "HTM-XXXXX",
  "title": "Story Title",
  "account": "Account Name - Description - (SOW)",
  "summary": {
    "epic": "HTM-XXXXX - Epic Name",
    "tester": "Tester Name",
    "team": "System Test",
    "sprint": "Sprint Name or empty",
    "version": "Release X.Y",
    "notes": "Additional notes",
    "stories": [
      {
        "id": "HTM-XXXXX",
        "description": "Story description",
        "owner": "Tester Name",
        "sheet": "HTM-XXXXX"
      }
    ]
  },
  "scenarios": [ /* scenario array */ ]
}
```

### Matrix Format (Option 1) - Scenarios Array

```json
"scenarios": [
  {
    "number": 1,
    "ac": "AC_01",
    "category": "Positive",
    "summary": "Scenario summary",
    "conditions": {
      "Deal Type": "SIMO",
      "Tariff CPI": "Yes",
      "Account Type": "Standard"
    },
    "expected": "Expected result"
  }
]
```

### Single Column Format (Option 2) - Scenarios Array

```json
"scenarios": [
  {
    "number": 1,
    "ac": "AC_01",
    "category": "Positive",
    "summary": "Scenario summary",
    "conditions": {
      "Preconditions": "Deal Type = SIMO, Tariff CPI = Yes"
    },
    "expected": "Expected result"
  }
]
```

---

## HLTP Markdown Template

```markdown
# {Jira-ID} - High Level Test Plan

## Metadata

| Field | Value |
|-------|-------|
| Jira ID | [{Jira-ID}](https://hansentechnologies.atlassian.net/browse/{Jira-ID}) |
| Account | {Account Name} |
| Tester | {Tester Name} |
| Version | {Release Version} |

---

## Test Scenarios

{Insert table based on selected format option}

---

## Coverage Summary

| AC | Scenarios | Status |
|----|-----------|--------|
| AC_01 | 1, 2, 3 | ✅ Covered |
| AC_02 | 4, 5 | ✅ Covered |
```

---

## Generate Excel

```bash
python scripts/generate_hltp.py --data {Jira-ID}-high-level-test-plan-analysis.json --output "{Account} - HLTP.xlsx"
```

---

## Workflow Prompts

### Present Options
> Tôi sẽ tạo HLTP. Vui lòng chọn format:
> 
> **Option 1: Matrix Table** - Mỗi condition là 1 cột riêng
> - ✅ Dễ so sánh values
> - ❌ Table rộng
> 
> **Option 2: Single Column** - Tất cả conditions trong 1 cột
> - ✅ Compact, dễ đọc
> - ❌ Khó so sánh
> 
> Bạn chọn Option nào?

### After Selection
> Tôi đã tạo HLTP.md. Bạn có muốn export ra Excel không?

### Before Test Cases
> HLTP và Requirement Analysis đã hoàn thành. Bạn có muốn tiếp tục viết Test Cases không?
