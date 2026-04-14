# Robot Framework Code Patterns

Code patterns extracted from `ccb-hu-tm-automation-robotfw/docs/code-standards.md`.

## Test File Structure

```robotframework
*** Comments ***
# Auto-generated from: test/{Jira-ID}/{Jira-ID}-requirement-analysis.md
# Generator: requirement-to-robotfw skill v1.0
# Generated: {YYYY-MM-DD}

*** Settings ***
Documentation    {Jira-ID} - {Story Title}
...              Author: Auto-generated
...              Jira ID Story: {Jira-ID}
...              Description: {Brief description}
Resource    {Jira-ID}_Keywords.robot
Resource    ../TestBase_Keywords.robot

*** Test Cases ***
# AC-01: {AC Title}
Scenario: {Jira-ID}_AC01 {Scenario Name}
    [Documentation]    {AC description}
    [Tags]    {Module}    {Jira-ID}    {Category}
    Given {Precondition}
    When {Action}
    Then {Verification}
```

## Keywords File Structure

```robotframework
*** Comments ***
# Keywords for {Jira-ID} - {Story Title}
# Auto-generated from requirement-analysis.md

*** Settings ***
Documentation    Keywords for {Jira-ID}
Resource    ../Commons/MARS_Common_Keywords.robot
Resource    ../TestBase_Keywords.robot
Resource    {Module}_Keywords.robot

*** Keywords ***
# === PRECONDITION KEYWORDS ===

A NEW Online Order With MPN And Blank SIM
    [Documentation]    Create NEW online order with MPN provided and BLANK SIM type
    [Arguments]    ${mpn}=07700900001    ${sim_type}=BLANK
    Log    Creating NEW Online Order: MPN=${mpn}, SIM Type=${sim_type}
    # TODO: Implement order creation logic
    Set Test Variable    ${_orderMPN}    ${mpn}
    Set Test Variable    ${_simType}    ${sim_type}

# === ACTION KEYWORDS ===

The Order Is Processed
    [Documentation]    Process the order through OWS
    Log    Processing order...
    # TODO: Implement order processing

# === VERIFICATION KEYWORDS ===

NC Soft Reserve Should Not Be Called
    [Documentation]    Verify Netcracker soft reserve was not invoked
    Log    Verifying NC Soft Reserve not called
    # TODO: Implement verification logic
```

## Naming Conventions

### Test Case Names
- Format: `Scenario: {Jira-ID}_{AC#} {Descriptive_Name}`
- Use Title Case
- Maximum 80 characters

### Keyword Names
- Format: `Title Case With Spaces`
- Start with verb or subject
- Be descriptive but concise

| Type | Pattern | Example |
|------|---------|---------|
| Precondition | `A/An {Entity} {State}` | `A NEW Online Order With MPN` |
| Action | `{Actor} {Action} {Object}` | `Admin Completes The Order` |
| Verification | `{Subject} Should {State}` | `Service Order Should Be Created` |

## Tag Conventions

```robotframework
[Tags]    {Module}    {Jira-ID}    {Category}    {Feature}
```

| Tag Type | Examples |
|----------|----------|
| Module | `OrderingWS`, `Care`, `API`, `Payments` |
| Jira ID | `HTM-34762`, `HTM-31211` |
| Category | `Positive`, `Negative`, `EdgeCase`, `Regression` |
| Feature | `BlankSIM`, `eSIM`, `MPN`, `Oakwood` |

## Import Strategy

### Test File Imports
```robotframework
Resource    {Jira-ID}_Keywords.robot      # Feature-specific keywords
Resource    ../TestBase_Keywords.robot     # Global setup/teardown
```

### Keywords File Imports
```robotframework
Resource    ../Commons/MARS_Common_Keywords.robot   # Netcracker helpers
Resource    ../TestBase_Keywords.robot              # Base keywords
Resource    {Module}_Keywords.robot                 # Module shared keywords
```
