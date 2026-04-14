---
name: tm:verify-requirements
metadata: version: 1.00
description: |
  Skill for documenting and verifying requirements using EARS (Easy Approach to Requirements Syntax). Use this when asked to write requirements, document user stories, or verify that existing requirements follow EARS patterns.
---

# Verify Requirements Skill

## Purpose
Document and verify requirements using the EARS (Easy Approach to Requirements Syntax) standard to ensure clear, unambiguous, and testable requirements.

## When to Use
- User asks to document requirements or user stories
- User wants to verify requirements follow EARS patterns
- User needs to write acceptance criteria
- User wants to review requirements for ambiguity

## Step-by-Step Process

### 1. Understand the Requirement Context
- Identify the feature or user need being documented
- Clarify the system name/component
- Understand the user type and their goal

### 2. Apply EARS Patterns
Requirements MUST follow one of these six EARS patterns:

#### Pattern 1: Ubiquitous (Always Active)
```
THE <system name> SHALL <system response>
```
**Use when:** The requirement is always active, without conditions.
**Example:** THE mobile app SHALL have a response time of less than 2 seconds.

#### Pattern 2: State-driven (While Condition)
```
WHILE <precondition(s)>, THE <system name> SHALL <system response>
```
**Use when:** The requirement is active only while a condition is true.
**Example:** WHILE the user is logged in, THE system SHALL display personalized content.

#### Pattern 3: Event-driven (When Trigger)
```
WHEN <trigger>, THE <system name> SHALL <system response>
```
**Use when:** The requirement is triggered by a specific event.
**Example:** WHEN the user clicks "submit", THE form SHALL validate all required fields.

#### Pattern 4: Optional Feature (Where Included)
```
WHERE <feature is included>, THE <system name> SHALL <system response>
```
**Use when:** The requirement applies only if an optional feature is present.
**Example:** WHERE the device includes GPS, THE app SHALL provide location-based services.

#### Pattern 5: Unwanted Behavior (If-Then)
```
IF <trigger>, THEN THE <system name> SHALL <system response>
```
**Use when:** Defining response to undesired situations.
**Example:** IF an invalid password is entered three times, THEN THE system SHALL lock the account.

#### Pattern 6: Complex (Combined)
```
WHILE <precondition(s)>, WHEN <trigger>, THE <system name> SHALL <system response>
```
**Use when:** Combining state and event conditions.
**Example:** WHILE the user is in checkout mode, WHEN payment is confirmed, THE system SHALL generate an order confirmation.

### 3. Document User Story Structure

```markdown
## [Story ID] - [Story Title]

**As a** [user type]
**I want** [functionality]
**So that** [benefit/value]

### Acceptance Criteria
- WHEN <trigger>, THE <system> SHALL <response>
- WHILE <condition>, THE <system> SHALL <response>
- IF <unwanted condition>, THEN THE <system> SHALL <response>

### Definition of Done
- [ ] All acceptance criteria implemented
- [ ] Unit tests written
- [ ] Documentation updated
```

### 4. Quality Verification Checklist
For each requirement, verify:
- [ ] Uses exactly one EARS pattern correctly
- [ ] Has exactly one system name
- [ ] Has one or more clear system responses
- [ ] Preconditions/triggers are testable
- [ ] System response is specific and measurable
- [ ] Clauses are in correct temporal order
- [ ] No ambiguous natural language

### 5. Report Findings
If verifying existing requirements:

```markdown
# Requirements Verification Report

## Summary
- Total Requirements: X
- EARS Compliant: Y (Z%)

## Issues Found
| Requirement | Issue | Recommendation |
|-------------|-------|----------------|
| REQ-001 | Missing trigger | Add WHEN clause |
| REQ-002 | Ambiguous response | Specify measurable outcome |

## Corrected Requirements
### REQ-001 (Original)
The system shall display error message.

### REQ-001 (Corrected)
WHEN validation fails, THE system SHALL display an error message with the specific field that failed.
```

## Quality Standards
- All acceptance criteria must follow one of the six EARS patterns
- Each criterion must have exactly one system name and clear system responses
- Use EARS keywords correctly: WHILE (preconditions), WHEN (triggers), WHERE (optional features), IF-THEN (unwanted behavior)
- Preconditions and triggers must be clearly defined and testable
- System responses must be specific and measurable
- Avoid ambiguous natural language in acceptance criteria
