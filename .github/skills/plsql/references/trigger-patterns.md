# Trigger Patterns

## AIUR Pattern (After Insert/Update/Right)

Most common trigger type for audit logging and validation:

```sql
CREATE OR REPLACE TRIGGER trig_account_aiur
AFTER INSERT OR UPDATE OR DELETE ON account
FOR EACH ROW
BEGIN
  -- Set audit info (table/function/procedure and user ID)
  pkg_audit.setInfo('ACCOUNT', 2);  -- 2 = UPDATE operation code
  
  -- Validate business rules on UPDATE
  IF UPDATING THEN
    IF :NEW.status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED') THEN
      RAISE_APPLICATION_ERROR(-20201, 'Invalid account status: ' || :NEW.status);
    END IF;
  END IF;
  
  -- Log INSERT
  IF INSERTING THEN
    INSERT INTO account_audit_log(
      operation, account_id, old_status, new_status, change_date, changed_by
    ) VALUES (
      'INSERT', :NEW.account_id, NULL, :NEW.status, SYSDATE, USER
    );
  END IF;
  
  -- Log UPDATE
  IF UPDATING THEN
    IF :OLD.status != :NEW.status OR :OLD.balance != :NEW.balance THEN
      INSERT INTO account_audit_log(
        operation, account_id, old_status, new_status, change_date, changed_by
      ) VALUES (
        'UPDATE', :NEW.account_id, :OLD.status, :NEW.status, SYSDATE, USER
      );
    END IF;
  END IF;
  
  -- Log DELETE
  IF DELETING THEN
    INSERT INTO account_audit_log(
      operation, account_id, old_status, new_status, change_date, changed_by
    ) VALUES (
      'DELETE', :OLD.account_id, :OLD.status, NULL, SYSDATE, USER
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    pkg_audit.log_error('trig_account_aiur', SQLCODE, SQLERRM);
    RAISE;
END trig_account_aiur;
/
```

## Before Insert/Update Trigger

Normalize or validate data before storage:

```sql
CREATE OR REPLACE TRIGGER trig_account_biu
BEFORE INSERT OR UPDATE ON account
FOR EACH ROW
BEGIN
  -- Set default values for INSERT
  IF INSERTING THEN
    :NEW.created_date := SYSDATE;
    :NEW.created_by := USER;
    :NEW.status := NVL(:NEW.status, 'ACTIVE');
  END IF;
  
  -- Always update modification timestamp
  :NEW.modified_date := SYSDATE;
  :NEW.modified_by := USER;
  
  -- Normalize data
  :NEW.account_number := UPPER(TRIM(:NEW.account_number));
  :NEW.status := UPPER(:NEW.status);
  
  -- Validate constraint (must have customer)
  IF :NEW.customer_id IS NULL THEN
    RAISE_APPLICATION_ERROR(-20101, 'Account must have associated customer');
  END IF;
  
END trig_account_biu;
/
```

## Referential Integrity Trigger

Prevent orphaned records:

```sql
CREATE OR REPLACE TRIGGER trig_payment_del
BEFORE DELETE ON payment
FOR EACH ROW
BEGIN
  -- Prevent deletion if invoice references this payment
  IF EXISTS (SELECT 1 FROM invoice WHERE payment_id = :OLD.payment_id) THEN
    RAISE_APPLICATION_ERROR(-20201, 
      'Cannot delete payment ' || :OLD.payment_id || ': referenced by invoices');
  END IF;
  
  -- Log deletion
  INSERT INTO payment_audit_log(operation, payment_id, deleted_date, deleted_by)
  VALUES ('DELETE', :OLD.payment_id, SYSDATE, USER);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE_APPLICATION_ERROR(-20399, 'Error in payment delete trigger: ' || SQLERRM);
END trig_payment_del;
/
```

## Computed Column Trigger

Maintain derived values:

```sql
CREATE OR REPLACE TRIGGER trig_invoice_biu
BEFORE INSERT OR UPDATE ON invoice
FOR EACH ROW
BEGIN
  -- Compute total if items change
  IF INSERTING OR UPDATING THEN
    SELECT SUM(quantity * unit_price) INTO :NEW.total_amount
    FROM invoice_items WHERE invoice_id = :NEW.invoice_id;
    
    :NEW.tax_amount := :NEW.total_amount * 0.20;  -- 20% tax
    :NEW.grand_total := :NEW.total_amount + :NEW.tax_amount;
  END IF;
  
END trig_invoice_biu;
/
```

## Audit Trail with Old/New Values

Detailed before/after tracking:

```sql
CREATE OR REPLACE TRIGGER trig_account_detailed_audit
AFTER INSERT OR UPDATE OR DELETE ON account
FOR EACH ROW
BEGIN
  -- Insert detailed audit record
  IF INSERTING THEN
    INSERT INTO account_audit_detail(
      audit_id, operation, account_id, 
      field_name, old_value, new_value, audit_date, audit_user
    ) VALUES (
      account_audit_seq.NEXTVAL, 'INSERT', :NEW.account_id,
      'account_id', NULL, TO_CHAR(:NEW.account_id), SYSDATE, USER
    );
  
  ELSIF UPDATING THEN
    -- Log each changed field
    IF :OLD.status != :NEW.status THEN
      INSERT INTO account_audit_detail(
        audit_id, operation, account_id,
        field_name, old_value, new_value, audit_date, audit_user
      ) VALUES (
        account_audit_seq.NEXTVAL, 'UPDATE', :NEW.account_id,
        'status', :OLD.status, :NEW.status, SYSDATE, USER
      );
    END IF;
    
    IF :OLD.balance != :NEW.balance THEN
      INSERT INTO account_audit_detail(
        audit_id, operation, account_id,
        field_name, old_value, new_value, audit_date, audit_user
      ) VALUES (
        account_audit_seq.NEXTVAL, 'UPDATE', :NEW.account_id,
        'balance', TO_CHAR(:OLD.balance), TO_CHAR(:NEW.balance), SYSDATE, USER
      );
    END IF;
  
  ELSIF DELETING THEN
    INSERT INTO account_audit_detail(
      audit_id, operation, account_id,
      field_name, old_value, new_value, audit_date, audit_user
    ) VALUES (
      account_audit_seq.NEXTVAL, 'DELETE', :OLD.account_id,
      'status', :OLD.status, NULL, SYSDATE, USER
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE_APPLICATION_ERROR(-20399, 'Audit trigger error: ' || SQLERRM);
END trig_account_detailed_audit;
/
```

## Best Practices

1. **Keep triggers minimal**: Complex logic belongs in packages, not triggers
2. **Use AFTER triggers for logging**: BEFORE triggers for validation/defaults
3. **Avoid cascading triggers**: Trigger A fires Trigger B fires Trigger C → debugging nightmare
4. **Document trigger dependencies**: Show interaction with audit packages, other triggers
5. **Test edge cases**: Multiple updates in one transaction, deletes with foreign keys
6. **Monitor performance**: Triggers fire for every DML; don't add heavy queries
7. **Use :NEW and :OLD cautiously**: NULL values mean "no change" in UPDATE triggers

---

**Pattern Summary**: AIUR for audit, BIU for defaults, BEFORE DELETE for referential integrity, computed columns for derived values.
