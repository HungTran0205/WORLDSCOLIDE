# Test Case Format Guidelines (Detailed)

## Test Case Structure

Each test case MUST include:

1. **Title** – Clear, descriptive name reflecting test purpose
2. **Metadata** – Priority, Requirement ID
3. **Purpose** – Concise explanation of what's validated
4. **Preconditions** – Required system states/setup
5. **Test Steps & Expected Results** – Inline step-expectation pairs

## Title Guidelines

Use clear, descriptive names reflecting test purpose.

**Good examples:**
- "Verify API response for promotion type 'existing price rise'"
- "Validate login with expired session token"
- "Check payment processing with insufficient balance"

**Avoid:**
- "Test 1", "API Test", "Login test"

## Purpose Guidelines

Provide concise explanation of what's validated.

**Good:** "To confirm that the API returns correct pricing details when promotion type is set to 'existing price rise'."

**Avoid:** Long paragraphs or vague statements.

## Preconditions Guidelines

List required system states, configurations, setup steps.

**Example:**
- User is authenticated
- Promotion type configured in backend
- Test data seeded in database

## Formatting Rules (Strict)

### Rule 1: Step Label
Each step starts with bold `**Step X.**` followed by action.

### Rule 2: Expectation Line
Next line ALWAYS begins with `==> As expected,`.

### Rule 3: Single vs Multi-line

**Single expectation:**
```
**Step 1.** Send GET request to /api/promotion.
==> As expected, response code is 200.
```

**Multi-line expectations:**
```
**Step 2.** Send GET request to /api/promotion.
==> As expected,
- Response includes correct promotion type.
- Price rise matches configured value.
```

### Rule 4: Use Bullet Lists
Multi-line expectations use standard markdown bullet lists.

### Rule 5: Trailing Spaces for Line Break
Add **2 trailing spaces** at the end of Step action line for proper line break in Markdown preview.

### Rule 6: No Nested Lists
Use separate bullet lines instead of nesting.

## Complete Example

```markdown
# Test Case: Verify Payment API with Valid Card

### Purpose
To confirm payment processing returns success with valid card details.

### Preconditions
- User authenticated with valid token
- Test card configured: 4111-1111-1111-1111
- Payment gateway in test mode

### Test Steps & Expected Results

**Step 1.** Send POST to /api/payment with valid card.  
==> As expected, response code is 200.

**Step 2.** Verify response body.  
==> As expected,
- Transaction ID is present.
- Status is "approved".
- Amount matches request.

**Step 3.** Check transaction in database.  
==> As expected, record created with correct status.
```

## Common Mistakes

| Mistake | Correct |
|---------|---------|
| Using "Step 1:" | Use `**Step 1.**` (bold with period) |
| Blank line after step | Remove blank line |
| Missing `==>` prefix | Always start with `==> As expected,` |

## Metadata Fields

| Field | Format | Example |
|-------|--------|--------|
| **Priority** | Jira Priority | Blocker, Critical, Major, Highest, High, Medium, Low, Lowest, Normal, Minor |
| **Requirement ID** | Jira/Confluence ID | HTM-1234, REQ-001 |
| **Fix Version** | Release version | 25.1, 25.2-RC1 |
| **Labels** | Comma-separated | SystemTest, regression, smoke |
| **Components** | Module/area | Care, Payment, Billing |
| **Account** | SOW context | Tesco Mobile - Feature Name - (CHSOW-XXX) |

### Metadata Table Format

```markdown
| Priority | Medium |
| Requirement ID | HTM-1234 |
| Fix Version | Release 26.2 |
| Labels | SystemTest |
| Components | Care |
| Account | Tesco Mobile - Block Financial Wizard - (CHSOW-149) |
```

## Complete Test Case Template

```markdown
# Test Case: [Descriptive Title]

| Field | Value |
|-------|-------|
| Priority | Medium |
| Requirement ID | HTM-1234 |
| Fix Version | Release 26.2 |
| Labels | SystemTest |
| Components | Care |
| Account | Tesco Mobile - Feature Name - (CHSOW-XXX) |

### Purpose
[One sentence explaining what's validated]

### Preconditions
- [Required state 1]
- [Required state 2]

### Test Steps & Expected Results

**Step 1.** [Action].
==> As expected, [outcome].

**Step 2.** [Action].
==> As expected,
- [Expected result 1].
- [Expected result 2].
```
