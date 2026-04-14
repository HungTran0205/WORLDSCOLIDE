# Requirement Analysis Reference

> Checklist for analyzing Jira requirements before test case creation.

---

## Output File

**Path:** `test/{Jira-ID}/{Jira-ID}-requirement-analysis.md`

---

## Analysis Checklist

### 1. Core Elements

| Element | Check |
|---------|-------|
| User Story Format | As a [role], I want [action], so that [benefit] |
| Acceptance Criteria | Clear, testable ACs defined |
| Preconditions | Initial state/setup requirements |
| Business Rules | Logic/calculations documented |
| Error Handling | What happens when things go wrong? |

### 2. CHSOW & Linked Tickets

- Are there linked CHSOW tickets? Fetch and review each one
- Extract SOW scope, functional requirements, and acceptance criteria
- Search Confluence for pages referencing the CHSOW
- Cross-reference: do CHSOW requirements add ACs not in the Jira ticket?
- Note CHSOW ID and key requirements in the analysis output

### 3. Attached Documents

- List all attachments on the Jira ticket
- **PDFs:** Convert with `tm:pdf-to-markdown` skill → extract specs, requirements, diagrams
- **Word docs (.docx):** Convert with `tm:docx` skill → extract specs, requirements
- **Images (.png, .jpg):** Download and describe UI mockups, wireframes, or diagrams
- Identify any requirements or ACs present in attachments but missing from ticket description
- Save converted content to `test/{Jira-ID}/attachments/`

### 4. Existing Tests

- Search for linked test issues: `issue in linkedIssues("{Jira-ID}") AND type in (Test, "Test Execution")`
- Check if `test/{Jira-ID}/` folder exists locally with prior test cases
- If existing tests found: list them, note coverage, flag gaps, avoid duplication

### 5. Identify Missing Info

- What data/inputs are needed?
- What triggers this functionality?
- What are valid/invalid inputs?
- What are boundary values?
- Are there permission requirements?

### 6. Ambiguous Language (Red Flags)

| Ambiguous | Better |
|-----------|--------|
| "should", "may" | "must", "will" |
| "appropriate", "etc." | Specify exact criteria |
| "fast", "quick" | Specify timing (< 3 seconds) |
| "handle gracefully" | Define exact error response |

---

## Output Template

```markdown
# {Jira-ID} - Requirement Analysis

## Metadata

| Field | Value |
|-------|-------|
| Jira ID | [{Jira-ID}](https://hansentechnologies.atlassian.net/browse/{Jira-ID}) |
| Title | {Title} |
| Account | {Account Name} |
| Status | {Status} |

---

## Summary

{Brief description of what this ticket is about}

---

## Acceptance Criteria

| AC ID | Source | Description | Testable? |
|-------|--------|-------------|-----------|
| AC_01 | Jira | {AC description} | ✅ / ⚠️ |
| AC_02 | CHSOW-XXX | {AC from SOW} | ✅ / ⚠️ |
| AC_03 | Attachment | {AC from attached spec} | ✅ / ⚠️ |

---

## CHSOW Context

| CHSOW ID | Summary | Key Requirements |
|----------|---------|------------------|
| {CHSOW-XXX} | {SOW summary} | {Relevant scope/requirements} |

*Omit this section if no CHSOW tickets are linked.*

---

## Attachment Analysis

| File | Type | Key Content |
|------|------|-------------|
| {filename.pdf} | PDF | {Summary of extracted requirements/specs} |
| {filename.docx} | Word | {Summary of extracted content} |
| {mockup.png} | Image | {Description of UI mockup/diagram} |

*Omit this section if no attachments are present.*

---

## Existing Tests

| Test ID | Summary | Coverage |
|---------|---------|----------|
| {TEST-XXX} | {Test summary} | {Which ACs it covers} |

*Omit this section if no existing tests are found.*

---

## Test Ticket Inventory

| Test Ticket | Summary | Pre-conditions | Key Steps | Expected Results | Covers ACs |
|------------|---------|----------------|-----------|------------------|------------|
| {HTM-XXXXX} | {Test case name} | {Pre-conditions} | {Key steps} | {Expected results} | AC_01, AC_02 |

*Omit this section if no linked test tickets exist.*

---

## Coverage Gap Analysis

| AC ID | Description | Covered By | Gap |
|-------|-------------|------------|-----|
| AC_01 | {AC description} | HTM-XXXXX | — |
| AC_04 | {AC description} | — | Missing: negative/error path test |
| AC_05 | {AC description} | — | Missing: boundary value test |

**Gap Types:**
- **Missing test case** — AC has no corresponding test scenario at all
- **Missing step** — A required action is not reflected in test steps
- **Missing assertion** — An expected result is not verified
- **Missing pre-condition** — Required setup is not established
- **Incorrect mapping** — Test exists but covers different behavior than described

**Missing Test Scenarios:**
- [ ] {Scenario not covered by any existing test}
- [ ] {Negative path not covered}
- [ ] {Boundary condition not tested}

*Omit this section if all ACs are fully covered by existing tests.*

---

## Business Rules

- {Rule 1}
- {Rule 2}

---

## Questions / Clarifications Needed

- [ ] {Question 1}
- [ ] {Question 2}

---

## Review Status

- [ ] All ACs captured (from Jira, CHSOW, and attachments)
- [ ] CHSOW context reviewed
- [ ] Attachments processed
- [ ] Existing tests noted
- [ ] Coverage gaps identified
- [ ] No ambiguous requirements
- [ ] Ready for HLTP creation
```

---

## Review Prompt

After creating the file, ask user:

```
I have created the requirement analysis file. Please review:
- Are all Acceptance Criteria (ACs) correct and complete?
- Are there any ACs that need to be added?

After confirmation, I will proceed to create the High Level Test Plan.
```

> Tôi đã tạo file requirement analysis. Vui lòng review:
> - Tất cả ACs đã đúng và đủ chưa?
> - Có AC nào cần bổ sung không?
> 
> Sau khi OK, tôi sẽ tiếp tục tạo High Level Test Plan.
