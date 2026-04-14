---
agent: tm.tester
model: Claude Sonnet 4.5 (copilot)
description: "Transform BDD requirement-analysis.md into automation-plan.md for Robot Framework test generation"
---

# Plan Transformer: BDD Requirements to Robot Framework Automation Plan

You will transform BDD-formatted requirement analysis documents into automation plans for Robot Framework test generation.

## Step 1: Identify Input File

**CRITICAL:** You MUST identify the requirement-analysis.md file before proceeding.

**Expected file pattern:** `test/{Jira-ID}/{Jira-ID}-requirement-analysis.md`

### Input Validation:
1. Check if user provided a file path matching the pattern above
2. If file path is provided, verify it exists
3. If NO file is identified:
   - **STOP and ASK USER:** "Which test case file do you want to transform? Please provide the Jira ID or file path (e.g., HTM-34762 or test/HTM-34762/HTM-34762-TestCases.md)"
   - Wait for user response before proceeding

### Example Valid Inputs:
- `test/HTM-34762/HTM-34762-TestCases.md`
- `HTM-34762` (will resolve to test/HTM-34762/HTM-34762-TestCases.md)
- Direct file path if user provides it

## Step 2: Activate Planning Skill

Once input file is confirmed:
1. Load the `tm:planning` skill
2. Specifically use the `automation-planning.md` reference workflow
3. Read: `.github/skills/planning/references/automation-planning.md`

## Step 3: Execute Automation Planning Workflow

Follow the automation-planning workflow exactly:

### 3.1 Input Validation
- Verify file exists at specified path
- Confirm BDD format (AC-XX sections with Given/When/Then)
- Extract metadata (Jira ID, Title, Components)

### 3.2 Module Mapping
- Analyze content for keywords (OWS, Order, SIM, Care, API, etc.)
- Determine target Robot Framework module
- Reference: `.github/skills/requirement-to-robotfw/references/module-mapping.md`

### 3.3 Scenario Extraction
- Parse each AC-XX block
- Map Given/When/Then to Gherkin steps
- Identify test categories (Positive/Negative/EdgeCase)
- Reference: `.github/skills/requirement-to-robotfw/references/bdd-to-gherkin.md`

### 3.4 Keyword Reuse Analysis
- Search existing keywords in `ccb-hu-tm-automation-robotfw/tests/{Module}/`
- Identify reusable keywords from Commons/
- Document new keywords needed

### 3.5 Generate Automation Plan
- Create: `test/{Jira-ID}/{Jira-ID}-automation-plan.md`
- Include:
  - Module assignment
  - Scenario list with step mappings
  - Keyword reuse recommendations
  - New keywords to generate
  - Page Object requirements (if any)
