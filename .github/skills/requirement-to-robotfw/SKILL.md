---
name: tm:requirement-to-robotfw
description: Transform BDD requirement-analysis.md into Robot Framework Gherkin test scripts. Use when converting acceptance criteria to executable Robot Framework tests in ccb-hu-tm-automation-robotfw. Activates for req2robot, bdd-to-robot commands.
metadata: version: 1.00
---

# Requirement to Robot Framework

Transform BDD-formatted requirement analysis into executable Robot Framework test files.

## Quick Start

```
requirement-to-robotfw test/HTM-34762/HTM-34762-TestCases.md
req2robot test/HTM-34762/HTM-34762-TestCases.md
```

## Workflow

```
Step 1: Read Input       → Load requirement-analysis.md, TestCases.md, or automation-plan.md
         ↓
Step 2: Parse ACs        → Extract acceptance criteria / test ticket steps
         ↓
Step 3: Map Module       → Determine target Robot Framework module
         ↓
Step 4: Discover Keywords → Search existing keywords and page objects (MANDATORY)
         ↓
Step 5: Generate Tests   → Create {Jira-ID}_Test.robot and {Jira-ID}_Keywords.robot
         ↓
Step 6: Coverage Check   → Verify all ACs/test tickets are covered (iterate until no gaps)
         ↓
Step 7: Execute & Rectify → Run tests, fix failures, re-run (up to 5 iterations)
```

## BDD Refinement Rules (Mandatory)

- Each `Scenario` MUST contain exactly one primary `When` step and one primary `Then` step.
- Additional checks after `Then` MUST use `And` steps, not additional `Then` blocks.
- Additional setup context before `When` MUST use `And` steps, not additional `When` blocks.
- If requirements contain multiple independent actions or outcomes, split into multiple scenarios instead of chaining multiple `When`/`Then` blocks in one scenario.

## Input Options

| Input Type | Path Pattern |
|------------|--------------|
| Requirement Analysis | `test/{Jira-ID}/{Jira-ID}-requirement-analysis.md` |
| Automation Plan | `test/{Jira-ID}/{Jira-ID}-automation-plan.md` |
| Test Cases | `test/{Jira-ID}/{Jira-ID}-TestCases.md` |


## Output Structure

```
ccb-hu-tm-automation-robotfw/tests/{Module}/
├── {Jira-ID}_Test.robot        # Gherkin scenarios
└── {Jira-ID}_Keywords.robot    # Feature keywords
```

## References

| File | Purpose |
|------|---------|
| [bdd-to-gherkin.md](references/bdd-to-gherkin.md) | BDD to Gherkin transformation rules |
| [robotfw-patterns.md](references/robotfw-patterns.md) | Code patterns and conventions |
| [module-mapping.md](references/module-mapping.md) | Module detection and mapping |

## Code Standards

Generated code MUST comply with:
- `ccb-hu-tm-automation-robotfw/docs/code-standards.md`
- `ccb-hu-tm-automation-robotfw/docs/conventions/TestWritingGuidelines.md`
- `ccb-hu-tm-automation-robotfw/docs/conventions/ProjectStructure.md` — file naming, directory layout
- `ccb-hu-tm-automation-robotfw/docs/conventions/TagConventions.md` — tag categories and naming
- `ccb-hu-tm-automation-robotfw/docs/conventions/LocatorStrategies.md` — element locator patterns

---

## Step 4 — Discover Existing Keywords and Page Objects

**MANDATORY before writing any keyword.** Search the existing codebase to maximize reuse.

### Search Order (Strict)

1. **Page Objects** — `resources/Pages/Care/`, `resources/Pages/Base/`, `resources/Pages/MARS/`, `resources/Pages/SelfCare/`
2. **Helpers** — `resources/Helpers/`
3. **Existing test keywords** — `tests/{Module}/*_Keywords.robot`
4. **Common keywords** — `tests/Commons/`, `tests/TestBase_Keywords.robot`

### Key Page Objects to Check First

| File | Purpose |
|------|---------|
| `MainPage.robot` | Page-level container access |
| `ServiceOrderContent.robot` | SO grid: `Find And Click Service Order Id By Type`, `Get Service Order ID By Type`, `The Service Order "${type}" Status Is "${status}"` |
| `TaskPage.robot` | SO task details: `Get Field Value By Label`, `Verify Single Details Task Field` |
| `SubscriptionsPage.robot` | Subscription grid interactions |
| `SummaryPage.robot` | `Get Field Value By Label` (summary section variant) |
| `FindPage.robot` | Customer search interactions |
| `LeftMenu.robot` / `RightMenu.robot` / `TopMenu.robot` | Navigation |
| `WizardFormBase.robot` | Wizard steps: `Click Next Button`, `Click Return To Customer Button` |
| `ElementFinder.robot` | Raw element location helpers |
| `GridBase.robot` / `TableWithHeader.robot` | Grid/table utilities |

### Key Helpers

| File | Purpose |
|------|---------|
| `BillingHelper.robot` | Billing group creation and billing-cycle utilities |
| `DataHelper.robot` | Test data generation, date arithmetic |
| `OracleDatabaseHelper.robot` | DB queries: `Execute SQL String` |
| `XMLHelper.robot` | XML loading and template substitution |
| `CustomKeywords.robot` | Cross-cutting utilities (`Qlogger`, `Format Space Of String`) |

### Disambiguation Rules

- `Get Field Value By Label` exists in **both** `TaskPage.robot` and `SummaryPage.robot` — always qualify: `TaskPage.Get Field Value By Label`
- `Create New Billing Group` exists in **both** `BillingHelper.robot` and `Billing_Keywords.robot` — always qualify: `BillingHelper.Create New Billing Group`
- When a keyword name exists in multiple imported resources, **always use `ResourceFile.Keyword Name` form**

---

## Step 5 — Generate Robot Framework Tests

### Test File Rules (`{Jira-ID}_Test.robot`)

```robot
*** Settings ***
Resource    ../TestBase_Keywords.robot
Resource    {Jira-ID}_Keywords.robot

Default Tags    {module-tag}    {jira-id-lowercase}    regression
Test Setup      On Setup
Test Teardown   On Tear Down

*** Test Cases ***
# Jira ID: {Test-Ticket-ID}
Scenario: {Descriptive test name from Jira test ticket summary}
    [Tags]    {test-ticket-id-lowercase}    {category-tag}    {priority-tag}
    [Documentation]    {Purpose from Jira test ticket description}
    Given {precondition keyword}
    When {action keyword}
    Then {verification keyword}
```

### Keyword File Rules (`{Jira-ID}_Keywords.robot`)

```robot
*** Settings ***
Resource    ../TestBase_Keywords.robot
# Import only the page objects and helpers actually used

*** Keywords ***
{Keyword Name}
    [Documentation]    {What this keyword does}
    # Implementation using existing page object and helper keywords
```

### Mapping Jira Test Steps to Robot Keywords

| Jira Section | Maps To |
|-------------|---------|
| Pre-condition | `Given` keyword (setup state) |
| Steps 1-N | `When` keyword (composite action) |
| Expected result | `Then` keyword (composite validation) |
| Database verification (SQL) | Part of `Then` or separate `And` assertion |

### Naming Conventions

- Test file: `{Jira-ID}_Test.robot` (e.g., `HTM-34986_Test.robot`)
- Keyword file: `{Jira-ID}_Keywords.robot` (e.g., `HTM-34986_Keywords.robot`)
- Test case names: `Scenario: {Descriptive name from Jira test ticket summary}`
- Keywords: Title Case, verb-first (e.g., `Verify Safety Buffer Is Frozen At Expected Amount`)
- Tags: lowercase with hyphens (e.g., `htm-35301`, `care`, `regression`, `positive`)

### Tag Strategy

Follow `docs/conventions/TagConventions.md`:

| Tag Category | Examples |
|-------------|----------|
| Component | `care`, `scws`, `api`, `billing` |
| Feature | `safety-buffer`, `change-bundle`, `freeze-sb` |
| Priority | `critical`, `high`, `medium` |
| Direction | `positive`, `negative`, `edge-case` |
| Jira | `htm-34986`, `htm-35301` |
| Type | `regression`, `smoke` |

### Keyword Reuse Policy

- **Always prefer existing keywords** — search before creating
- Resolution order: Page Objects → Helpers → Existing test keywords → New keyword
- New keywords must:
  - Follow existing naming conventions
  - Go in `{Jira-ID}_Keywords.robot` (not in page object files)
  - Not duplicate existing behavior
  - Include `[Documentation]` tags
- **Never modify existing keywords** — create composite keywords that call existing primitives

---

## Step 6 — Coverage Verification

Before executing tests, verify generated Robot Framework tests fully cover the scope. This is an **iterative loop** — repeat until no gaps remain.

### Build Coverage Matrix

| Check | Source | Target |
|-------|--------|--------|
| Test ticket → Robot scenario | Each test ticket key | A `# Jira ID: {key}` comment + matching `Scenario:` |
| Pre-conditions covered | Test pre-conditions | `Given` keyword implementation |
| All test steps covered | Test steps (each numbered step) | `When` composite keyword |
| All expected results covered | Expected results | `Then` composite keyword |
| SQL/DB verifications | Any SQL checks | Assertions using `OracleDatabaseHelper` |

### Cross-Reference Against Test Analysis

1. Every AC marked as "covered by test" has at least one Robot test case
2. Business Rules are reflected in test assertions (thresholds, status transitions)
3. Missing Test Scenarios have been addressed
4. Negative/error path scenarios have correct failure assertions

### Gap Report

```
| Gap # | Test Ticket | Missing Element | Gap Type |
|-------|------------|-----------------|----------|
| 1 | HTM-XXXXX | Step 3 not implemented | Missing step |
| 2 | HTM-YYYYY | DB verification absent | Missing assertion |
| 3 | HTM-ZZZZZ | No corresponding scenario | Missing test case |
```

Gap types: Missing test case, Missing step, Missing assertion, Missing pre-condition, Incorrect mapping

### Close Gaps

1. **Missing test case** → generate new scenario + keywords
2. **Missing step** → extend `When` keyword
3. **Missing assertion** → extend `Then` keyword
4. **Missing pre-condition** → extend `Given` keyword
5. **Incorrect mapping** → correct keyword implementation

Iterate until gap report is empty (max **5 iterations**).

---

## Step 7 — Execute and Rectify

### Execute

```bash
cd ccb-hu-tm-automation-robotfw
robot --outputdir output/{Jira-ID}_run --loglevel INFO tests/{Module}/{Jira-ID}_Test.robot
```

**Critical**: Working directory must be `ccb-hu-tm-automation-robotfw` (project root) — `robot.toml` sets `pythonpath = ["."]`.

### Collect Failures

| Category | Action |
|----------|--------|
| Import error | Add missing `Resource` or `Library` import |
| Keyword not found | Verify exact name with `grep_search` then fix |
| Keyword ambiguity | Qualify with `ResourceFile.Keyword Name` |
| Wrong argument | Fix argument count or values |
| Assertion mismatch | Verify expected value against Jira test ticket |
| Environment/infra | Log and skip — do not mask with error suppression |

### Fix and Re-run

- Apply smallest fix needed
- Re-run only the affected test: `robot --test "Scenario Name*" tests/{Module}/{Jira-ID}_Test.robot`
- After all individual fixes: full suite re-run
- Repeat fix cycle up to **5 iterations**. If tests still fail, report remaining failures with root-cause analysis.

### Exit Criteria

Task is complete when:
1. Every test ticket has a corresponding Robot test case
2. All generated tests execute successfully (or failures documented as environment-blocked)
3. No test covers behavior absent from the source requirements
4. All code follows project conventions

---

## Hard Constraints

- Do **NOT** modify existing files outside `tests/{Module}/{Jira-ID}_*`
- Do **NOT** modify existing page objects or helpers
- Do **NOT** invent test behavior beyond what exists in Jira test tickets
- Do **NOT** weaken assertions to make tests pass
- Do **NOT** use `Sleep` — use existing wait/retry keywords
- Do **NOT** hardcode test data — externalize where possible
- **Always** run from project root (`ccb-hu-tm-automation-robotfw`)
