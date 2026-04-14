---
name: tm:web-testing
description: Execute automated web testing with Playwright. Use for website exploration, UI test generation, test execution and refinement. Supports multiple website configurations with credential management from JSON config files.
metadata: version: 1.00
---

# Web Testing

Execute automated web testing workflows using Playwright MCP for browser automation and test generation.

## When to Use

- Explore website functionalities and user flows
- Generate Playwright tests from website exploration
- Improve existing tests with correct locators
- Execute and debug web UI tests
- Validate web application features end-to-end

## Website Configuration

Credentials stored in `docs/website-test-config.json`:

```json
{
  "websites": [
    {
      "name": "Care Dev3",
      "url": "https://care-dev3.tm.dev.hsntech.int/login/...",
      "username": "admin",
      "password": "ADMIN1",
      "additionalFields": {
        "customerNumber": "48120126"
      },
      "defaultFlag": true
    }
  ]
}
```

Load config before testing:
1. Read `docs/website-test-config.json`
2. Use website with `defaultFlag: true` if not specified
3. Extract url, credentials, additionalFields for test execution

## Testing Workflow

### 1. Website Exploration
Use Playwright MCP to navigate and capture snapshots:
- Navigate to URL like a user would
- Take page snapshots of key screens
- Identify user flows and functionalities
- Document navigation paths
- **Do not generate code until exploration is complete**

### 2. Test Generation
Write TypeScript Playwright tests based on exploration:
- Use identified locators from snapshots
- Save tests to `specs/{feature}/scripts/`
- Structure tests by user journey
- Include setup/teardown for login flows
- Use credentials from config file

### 3. Test Execution & Refinement
Run and iterate until passing:
- Execute generated tests
- Capture failure screenshots/traces
- Diagnose failures using snapshots
- Fix locators and assertions
- Re-run until reliable

### 4. Test Improvements
Update existing tests with correct locators:
- Navigate to URL and capture current snapshot
- Compare with test locators
- Update selectors based on actual DOM
- Verify tests pass with new locators

## Best Practices

- Always explore before generating tests
- Use data-testid attributes when available
- Prefer user-facing locators (role, label, text)
- Save tests in feature-specific directories
- Document test purpose and covered flows
- Run dev server first if needed for local testing

## References

For detailed test patterns and examples, see:
- `references/playwright-patterns.md` - Common test patterns and best practices
