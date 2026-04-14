# Error Handling Standards

## Error Code Ranges

Allocate error codes within reserved ranges:

| Range | Purpose | Examples |
|-------|---------|----------|
| -20001 to -20099 | Resource/data errors | No data found, duplicate values |
| -20100 to -20199 | Validation errors | Invalid input, constraint violation |
| -20200 to -20299 | Business logic errors | Rate exceeded, status invalid |
| -20300 to -20399 | Integration errors | External service failure |
| -20400+ | Application-specific | Custom domain errors |

## Basic Exception Pattern

```sql
PROCEDURE process_payment(
  iPaymentId    IN NUMBER,
  iAmount       IN DECIMAL,
  oStatus       OUT VARCHAR2
) IS
  lAccountId    NUMBER;
  lCurrentRate  DECIMAL;
BEGIN
  -- Input validation
  IF iPaymentId IS NULL THEN
    RAISE_APPLICATION_ERROR(-20101, 'PaymentId cannot be null');
  END IF;
  
  IF iAmount <= 0 THEN
    RAISE_APPLICATION_ERROR(-20102, 'Amount must be positive');
  END IF;
  
  -- Business logic with exception handling
  BEGIN
    SELECT account_id INTO lAccountId 
    FROM account WHERE payment_id = iPaymentId;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20001, 'Payment not found: ' || iPaymentId);
  END;
  
  -- Process payment
  lCurrentRate := get_rate_for_payment(iPaymentId);
  IF lCurrentRate IS NULL THEN
    RAISE_APPLICATION_ERROR(-20201, 'Rate configuration missing for payment');
  END IF;
  
  oStatus := 'SUCCESS';
  
EXCEPTION
  WHEN OTHERS THEN
    gErrorCode := SQLCODE;
    gErrorMsg := SUBSTR(SQLERRM, 1, 250);  -- Truncate to 250 chars
    pkg_audit.log_error('process_payment', SQLCODE, SQLERRM);
    RAISE;
END process_payment;
/
```

## Key Principles

1. **Validate all inputs early**: Check NULL, invalid values at procedure start
2. **Use meaningful messages**: Include context (e.g., ID, value) in error message
3. **Truncate error messages**: Keep to ~250 chars for database storage
4. **Log before re-raise**: Call audit logging then re-raise exception
5. **Don't swallow exceptions**: Unless explicitly needed for business logic
6. **Use custom exceptions**: Domain-specific exceptions over generic OTHERS

## Package-Level Error Handling

```sql
PACKAGE pkg_account IS
  -- Global error code/message storage
  gErrorCode    NUMBER := 0;
  gErrorMsg     VARCHAR2(250);
  
  PROCEDURE create_account(iCustomerId IN NUMBER, oAccountId OUT NUMBER);
END pkg_account;
/

PACKAGE BODY pkg_account IS
  PROCEDURE create_account(iCustomerId IN NUMBER, oAccountId OUT NUMBER) IS
  BEGIN
    -- Implementation
    INSERT INTO account(customer_id) VALUES (iCustomerId) RETURNING account_id INTO oAccountId;
  EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
      gErrorCode := -20002;
      gErrorMsg := 'Customer ' || iCustomerId || ' already has account';
      RAISE_APPLICATION_ERROR(gErrorCode, gErrorMsg);
    WHEN OTHERS THEN
      gErrorCode := SQLCODE;
      gErrorMsg := SUBSTR(SQLERRM, 1, 250);
      RAISE;
  END create_account;
END pkg_account;
/
```

## Audit Logging with Error Handling

```sql
-- Log error to audit table
PROCEDURE log_error(
  iProcedureName  IN VARCHAR2,
  iErrorCode      IN NUMBER,
  iErrorMsg       IN VARCHAR2
) IS
BEGIN
  INSERT INTO error_audit_log(procedure_name, error_code, error_msg, logged_date)
  VALUES (iProcedureName, iErrorCode, iErrorMsg, SYSDATE);
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    NULL;  -- Suppress audit logging errors to prevent cascading failures
END log_error;
/
```

## Testing Error Conditions

```sql
-- Unit test for error handling
PROCEDURE test_invalid_payment IS
BEGIN
  -- Should raise -20101 error
  BEGIN
    process_payment(NULL, 100, NULL);
    RAISE_APPLICATION_ERROR(-30001, 'Expected error not raised');
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLCODE = -20101 THEN
        DBMS_OUTPUT.PUT_LINE('✓ Null validation works');
      ELSE
        RAISE;
      END IF;
  END;
END test_invalid_payment;
/
```

---

**Remember**: Good error handling is invisible when it works; users only see it when things break. Make errors descriptive enough to debug, but concise enough to display.
