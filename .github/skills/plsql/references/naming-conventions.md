# Naming Conventions

## Package Naming

```sql
pkg_{domain}_{function}.pck       -- Primary naming convention
pkg_{domain}.pck                   -- Short form for core modules
PKG_ACRONYM.pck                    -- All caps for legacy support (avoid new code)
```

**Examples**:
- `pkg_account.pck` - Account management package
- `pkg_payment_processor.pck` - Payment processing functions
- `pkg_rept_CRP020R.pck` - Specific report (CRP020R)
- `pkg_audit.pck` - Audit logging
- `pkg_calc.pck` - Calculation utilities

## Procedure Naming

Prefix procedure names with verb describing action:

```sql
PROCEDURE create_{entity}         -- Create/insert operations
PROCEDURE update_{entity}         -- Update operations
PROCEDURE delete_{entity}         -- Delete operations
PROCEDURE get_{entity}            -- Read/retrieve operations
PROCEDURE process_{entity}        -- Complex multi-step operations
PROCEDURE validate_{entity}       -- Validation operations
PROCEDURE log_{event}             -- Logging/audit operations
```

**Examples**:
- `create_account` - Create new account
- `update_balance` - Update balance
- `get_customer_by_id` - Retrieve customer
- `process_batch_invoices` - Process multiple invoices
- `validate_payment_amount` - Validate payment

## Variable Naming

All variables use **prefix + camelCase** convention:

```sql
i{Name}           -- IN parameters (immutable input)
o{name}           -- OUT parameters (output return values)
io{name}          -- IN OUT parameters (input + output)
l{name}           -- Local variables (procedure-scoped)
c{name}           -- Cursor variables
g{name}           -- Global/package variables (persist across calls)
```

**Examples**:
```sql
PROCEDURE process_payment(
  iPaymentId        IN NUMBER,              -- Input parameter
  iAmount           IN DECIMAL,             -- Input parameter
  oStatus           OUT VARCHAR2,           -- Output parameter
  ioAudit_log       IN OUT CLOB             -- Input + output
) IS
  lAccountId        NUMBER;                 -- Local variable
  lPaymentDate      DATE;                   -- Local variable
  cAccountCursor    SYS_REFCURSOR;          -- Cursor variable
BEGIN
  -- Implementation uses proper prefixes
  SELECT account_id INTO lAccountId FROM account WHERE ...;
END;
```

## Type Naming

```sql
typ_{entity}                      -- Object type
typ_{entity}_table                -- TABLE collection of object type
typ_{entity}_array                -- VARRAY collection of object type
```

**Examples**:
- `typ_account` - Account object type
- `typ_account_table` - TABLE OF typ_account
- `typ_payment_array` - VARRAY OF typ_payment

## View Naming

```sql
VW_{ENTITY_NAME}                  -- Main entity views (uppercase)
VW_{ENTITY}_ACTIVE                -- Status-filtered views
VW_{ENTITY}_ARCHIVE               -- Historical data views
vw_{module}_{purpose}             -- Business object views (lowercase prefix)
```

**Examples**:
- `VW_ACCOUNT` - All accounts
- `VW_ACCOUNT_ACTIVE` - Active accounts only
- `VW_PAYMENT_ARCHIVE` - Historical payments
- `vw_billing_summary` - Billing summary report view

## Trigger Naming

```sql
trig_{table_name}_aiur.trg        -- After insert/update/right (standard)
trig_{table_name}_{purpose}.trg   -- Specific purpose triggers
```

**Naming suffixes**:
- `_ai` = After Insert
- `_au` = After Update
- `_ad` = After Delete
- `_aiur` = After Insert/Update/Right (most common)
- `_bi` = Before Insert
- `_bu` = Before Update

**Examples**:
- `trig_account_aiur.trg` - Account audit/validation trigger
- `trig_payment_ai.trg` - Post-insert processing for payments
- `trig_invoice_ad.trg` - Cleanup after invoice delete

## Exception/Error Code Naming

```sql
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20001, 'Resource not found');
  WHEN DUP_VAL_ON_INDEX THEN
    RAISE_APPLICATION_ERROR(-20002, 'Duplicate value');
  WHEN INVALID_INPUT THEN
    RAISE_APPLICATION_ERROR(-20003, 'Invalid input parameter');
END;
```

**Error Code Ranges**:
- `-20001 to -20099` = Resource/data errors
- `-20100 to -20199` = Validation errors
- `-20200 to -20299` = Business logic errors
- `-20300 to -20399` = Integration errors
- `-20400+` = Application-specific errors

## Comment Standards

- Single-line: `-- Brief explanation`
- Multi-line: `/* Complex logic explanation */`
- Multilingual: Add language prefix if non-English
  ```sql
  -- EN: Account creation logic
  -- HU: Számlanyitási logika
  -- DE: Kontenerstellungslogik
  ```

---

**Rule of Thumb**: Naming should self-document intent. Anyone reading the code should understand what a variable or procedure does just from its name.
