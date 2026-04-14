# Test Scenario Patterns

## Purpose
Reference patterns for extracting test scenarios from requirements.

---

## Positive Patterns (Happy Path)

### 1. CRUD Operations
- Create: Add new record with valid data
- Read: Retrieve existing record
- Update: Modify record with valid changes
- Delete: Remove record with confirmation

### 2. Authentication/Authorization
- Login with valid credentials
- Access permitted resources
- Session management (login, logout, refresh)

### 3. Form Submission
- Submit with all required fields
- Submit with optional fields
- Auto-save draft functionality

### 4. API Success
- Valid request returns 200/201
- Correct response structure
- Proper data types returned

### 5. Workflow Completion
- Complete multi-step process
- State transitions (Draft → Submitted → Approved)
- Notification triggers on success

### 6. Search/Filter
- Search returns matching results
- Filter applies correctly
- Pagination works

---

## Negative Patterns (Error Handling)

### 1. Validation Errors
```markdown
**Step 1.** Enter email without @ symbol.
==> As expected, error: "Invalid email format".
```

### 2. Boundary Conditions
| Category | Test Cases |
|----------|------------|
| Empty input | Null, empty string, whitespace only |
| Boundaries | Min-1, Min, Max, Max+1 |
| Format | Invalid characters, special chars, unicode |

### 3. Authentication Failures
- Expired token → 401 Unauthorized
- Invalid credentials → error message
- Missing auth → redirect to login

### 4. Permission Denied
- Access restricted resource → 403 Forbidden
- Role-based access violations

### 5. Resource Not Found
- Non-existent ID → 404 Not Found
- Deleted resource access

### 6. Duplicate/Conflict
- Create with existing unique field → conflict error
- Concurrent edit conflicts

### 7. State Violations
- Action on expired/cancelled/locked record
- Invalid state transitions

---

## Scenario Extraction Checklist

| Aspect | Positive | Negative |
|--------|----------|----------|
| Input | Valid data | Invalid/empty/boundary |
| Auth | Logged in user | Expired/no auth |
| Permission | Authorized role | Unauthorized role |
| State | Valid state | Invalid state |
| Flow | Complete path | Interrupted/cancelled |
| Data | Exists | Not found/deleted |
