# Package Patterns

## Basic Package Structure

```sql
CREATE OR REPLACE PACKAGE pkg_account IS
  -- Public types
  TYPE rec_account IS RECORD (
    account_id    NUMBER,
    customer_id   NUMBER,
    balance       DECIMAL,
    status        VARCHAR2(20)
  );
  
  -- Public procedures
  PROCEDURE create_account(iCustomerId IN NUMBER, oAccountId OUT NUMBER);
  PROCEDURE update_balance(iAccountId IN NUMBER, iAmount IN DECIMAL);
  PROCEDURE get_account(iAccountId IN NUMBER, oAccount OUT rec_account);
  
END pkg_account;
/

PACKAGE BODY pkg_account IS
  -- Implementation here
END pkg_account;
/
```

## Batch Processing Pattern

For processing large datasets efficiently:

```sql
PROCEDURE process_batch_invoices(
  iBatchSize    IN NUMBER DEFAULT 1000,
  oBatchCount   OUT NUMBER
) IS
  TYPE typInvoiceIds IS TABLE OF NUMBER;
  lInvoiceIds   typInvoiceIds;
  lBatchCount   NUMBER := 0;
  
BEGIN
  LOOP
    -- Fetch batch of invoice IDs
    SELECT invoice_id BULK COLLECT INTO lInvoiceIds
    FROM invoice WHERE status = 'PENDING'
    FETCH FIRST iBatchSize ROWS ONLY;
    
    EXIT WHEN lInvoiceIds.COUNT = 0;
    
    SAVEPOINT sp_batch_start;
    
    -- Process each invoice in batch
    FOR i IN 1..lInvoiceIds.COUNT LOOP
      BEGIN
        process_single_invoice(lInvoiceIds(i));
      EXCEPTION
        WHEN OTHERS THEN
          ROLLBACK TO sp_batch_start;
          pkg_audit.log_error('process_batch_invoices', SQLCODE, SQLERRM);
      END;
    END LOOP;
    
    COMMIT;
    lBatchCount := lBatchCount + 1;
    
  END LOOP;
  
  oBatchCount := lBatchCount;
  
EXCEPTION
  WHEN OTHERS THEN
    gErrorCode := SQLCODE;
    gErrorMsg := SQLERRM;
    RAISE;
END process_batch_invoices;
/
```

## Rate Limiting Pattern

Prevent excessive usage or allocation:

```sql
PROCEDURE validate_rate_limit(
  iUserId     IN NUMBER,
  iItemId     IN NUMBER,
  iQuantity   IN NUMBER
) IS
  lRate       DECIMAL;
  lCharge     DECIMAL;
  lCurrentUsage NUMBER;
  lLimit      NUMBER;
BEGIN
  -- Get rate for item
  SELECT item_rate INTO lRate FROM rate_table WHERE item_id = iItemId;
  IF lRate IS NULL THEN
    RAISE_APPLICATION_ERROR(-20201, 'Rate not found for item ' || iItemId);
  END IF;
  
  -- Calculate charge
  lCharge := iQuantity * lRate;
  
  -- Check against user limit
  SELECT SUM(amount) INTO lCurrentUsage
  FROM usage_log WHERE user_id = iUserId AND usage_date = TRUNC(SYSDATE);
  
  SELECT daily_limit INTO lLimit FROM user_limits WHERE user_id = iUserId;
  
  IF NVL(lCurrentUsage, 0) + lCharge > lLimit THEN
    RAISE_APPLICATION_ERROR(-20202, 
      'Daily limit exceeded: current=' || NVL(lCurrentUsage, 0) || 
      ', new=' || lCharge || ', limit=' || lLimit);
  END IF;
  
  -- Log usage
  INSERT INTO usage_log(user_id, item_id, amount, usage_date)
  VALUES (iUserId, iItemId, lCharge, SYSDATE);
  
EXCEPTION
  WHEN OTHERS THEN
    pkg_audit.log_error('validate_rate_limit', SQLCODE, SQLERRM);
    RAISE;
END validate_rate_limit;
/
```

## Allocation/Distribution Pattern

Distribute amounts across multiple GL accounts or entities:

```sql
PROCEDURE allocate_charges(
  iTotalAmount  IN DECIMAL,
  iAllocationRule IN VARCHAR2 DEFAULT 'DEFAULT'
) IS
  TYPE rec_allocation IS RECORD (
    gl_account    VARCHAR2(20),
    percentage    DECIMAL
  );
  
  TYPE tab_allocations IS TABLE OF rec_allocation;
  lAllocations  tab_allocations;
  lAmount       DECIMAL;
  
BEGIN
  -- Fetch allocation rules
  SELECT gl_account, percentage BULK COLLECT INTO lAllocations
  FROM allocation_rules
  WHERE rule_name = iAllocationRule
  ORDER BY sequence;
  
  IF lAllocations.COUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20301, 'Allocation rule not found: ' || iAllocationRule);
  END IF;
  
  -- Apply allocation
  FOR i IN 1..lAllocations.COUNT LOOP
    lAmount := iTotalAmount * (lAllocations(i).percentage / 100);
    post_to_gl(lAllocations(i).gl_account, lAmount);
  END LOOP;
  
  -- Verify total allocated = input
  IF ABS(iTotalAmount - SUM(lAmount)) > 0.01 THEN
    RAISE_APPLICATION_ERROR(-20302, 'Allocation total mismatch');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END allocate_charges;
/
```

## Audit Trail Pattern

Log all state changes:

```sql
PROCEDURE update_account_status(
  iAccountId    IN NUMBER,
  iNewStatus    IN VARCHAR2
) IS
  lOldStatus    VARCHAR2(20);
  lOldValues    CLOB;
  lNewValues    CLOB;
BEGIN
  -- Get old value
  SELECT status INTO lOldStatus FROM account WHERE account_id = iAccountId;
  
  -- Prepare audit strings
  lOldValues := 'status=' || lOldStatus;
  lNewValues := 'status=' || iNewStatus;
  
  -- Log change via audit package
  pkg_audit.log_change(
    iTableName => 'ACCOUNT',
    iOperation => 'UPDATE',
    iEntityId  => iAccountId,
    iOldValues => lOldValues,
    iNewValues => lNewValues,
    iUserId    => USER
  );
  
  -- Perform update
  UPDATE account SET status = iNewStatus, modified_date = SYSDATE
  WHERE account_id = iAccountId;
  
  COMMIT;
  
EXCEPTION
  WHEN OTHERS THEN
    pkg_audit.log_error('update_account_status', SQLCODE, SQLERRM);
    RAISE;
END update_account_status;
/
```

## Caching Pattern

Cache frequently accessed data:

```sql
PACKAGE BODY pkg_rates IS
  -- Package-level cache
  TYPE tab_rates IS TABLE OF rate_table%ROWTYPE INDEX BY NUMBER;
  g_rates_cache     tab_rates;
  g_cache_loaded    BOOLEAN := FALSE;
  g_cache_timestamp DATE;
  
  PROCEDURE load_cache IS
  BEGIN
    SELECT * BULK COLLECT INTO g_rates_cache
    FROM rate_table WHERE active_flag = 'Y';
    g_cache_loaded := TRUE;
    g_cache_timestamp := SYSDATE;
  END load_cache;
  
  FUNCTION get_rate(iItemId IN NUMBER) RETURN DECIMAL IS
  BEGIN
    -- Invalidate cache if older than 1 hour
    IF g_cache_timestamp < SYSDATE - (1/24) THEN
      g_cache_loaded := FALSE;
    END IF;
    
    -- Load cache if needed
    IF NOT g_cache_loaded THEN
      load_cache;
    END IF;
    
    -- Return cached value
    IF g_rates_cache.EXISTS(iItemId) THEN
      RETURN g_rates_cache(iItemId).rate;
    ELSE
      RAISE_APPLICATION_ERROR(-20001, 'Rate not found for item ' || iItemId);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20399, 'Error fetching rate: ' || SQLERRM);
  END get_rate;
  
END pkg_rates;
/
```

---

**Key Takeaway**: These patterns solve common problems (batch processing, rate limiting, allocation, audit trails, caching). Copy-paste and customize for your domain.
