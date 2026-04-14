# Type Definitions

## Object Type Structure

Basic object type for encapsulating related data:

```sql
CREATE OR REPLACE TYPE typ_account AS OBJECT (
  account_id        NUMBER(12),
  customer_id       NUMBER(12),
  account_number    VARCHAR2(20),
  balance           DECIMAL(15, 2),
  status            VARCHAR2(20),
  created_date      DATE,
  created_by        VARCHAR2(50),
  modified_date     DATE,
  modified_by       VARCHAR2(50),
  
  -- Member methods (optional)
  MEMBER FUNCTION format_number RETURN VARCHAR2,
  MEMBER PROCEDURE update_timestamp
) /
```

## Object Type Body (Methods)

```sql
CREATE OR REPLACE TYPE BODY typ_account AS
  MEMBER FUNCTION format_number RETURN VARCHAR2 IS
  BEGIN
    RETURN LPAD(TO_CHAR(account_id), 8, '0');
  END format_number;
  
  MEMBER PROCEDURE update_timestamp IS
  BEGIN
    modified_date := SYSDATE;
    modified_by := USER;
  END update_timestamp;
END;
/
```

## Collection Types

### TABLE Collection (Unbounded)

```sql
-- For unlimited rows, typically used with BULK COLLECT
CREATE OR REPLACE TYPE typ_account_table IS TABLE OF typ_account;
/

-- Usage in procedure
PROCEDURE fetch_all_accounts(oAccounts OUT typ_account_table) IS
BEGIN
  SELECT typ_account(
    account_id, customer_id, account_number, balance, status,
    created_date, created_by, modified_date, modified_by
  ) BULK COLLECT INTO oAccounts
  FROM account WHERE status = 'ACTIVE';
END;
/
```

### VARRAY Collection (Bounded)

```sql
-- For fixed maximum size, typically <1000 items
CREATE OR REPLACE TYPE typ_account_array IS VARRAY(100) OF typ_account;
/

-- Usage
PROCEDURE process_top_accounts(oAccounts OUT typ_account_array) IS
  lArray typ_account_array := typ_account_array();
BEGIN
  FOR rec IN (SELECT * FROM account WHERE status = 'PREMIUM' AND ROWNUM <= 100) LOOP
    lArray.EXTEND;
    lArray(lArray.LAST) := typ_account(
      rec.account_id, rec.customer_id, rec.account_number, rec.balance, 
      rec.status, rec.created_date, rec.created_by, rec.modified_date, rec.modified_by
    );
  END LOOP;
  oAccounts := lArray;
END;
/
```

## Nested Types

Complex structures with sub-objects:

```sql
CREATE OR REPLACE TYPE typ_address AS OBJECT (
  street        VARCHAR2(100),
  city          VARCHAR2(50),
  postal_code   VARCHAR2(10),
  country       VARCHAR2(50)
);
/

CREATE OR REPLACE TYPE typ_customer AS OBJECT (
  customer_id   NUMBER(12),
  name          VARCHAR2(100),
  email         VARCHAR2(100),
  address       typ_address,
  created_date  DATE
);
/

CREATE OR REPLACE TYPE typ_customer_table IS TABLE OF typ_customer;
/
```

## Record Types (Alternative to Objects)

Use when you need simpler data structures without methods:

```sql
PACKAGE pkg_account IS
  TYPE rec_account_summary IS RECORD (
    account_id      NUMBER,
    account_number  VARCHAR2(20),
    balance         DECIMAL,
    last_activity   DATE
  );
  
  TYPE tab_account_summaries IS TABLE OF rec_account_summary INDEX BY BINARY_INTEGER;
  
  PROCEDURE get_summaries(oSummaries OUT tab_account_summaries);
END pkg_account;
/
```

## Type Dropping and Alteration

```sql
-- To drop a type, must drop dependent types first
DROP TYPE typ_customer_table;
DROP TYPE typ_customer;
DROP TYPE typ_address;

-- To modify: recreate the type
CREATE OR REPLACE TYPE typ_account AS OBJECT (
  account_id        NUMBER(12),
  customer_id       NUMBER(12),
  account_number    VARCHAR2(20),
  balance           DECIMAL(15, 2),
  status            VARCHAR2(20),
  created_date      DATE,
  created_by        VARCHAR2(50),
  modified_date     DATE,
  modified_by       VARCHAR2(50),
  tax_id            VARCHAR2(20)  -- NEW FIELD
) 
NOT FINAL;  -- Allow subtyping in Oracle 8.0+
/
```

## Best Practices

1. **Name clearly**: `typ_` prefix identifies types
2. **Document fields**: Add comments explaining purpose
3. **Use NOT FINAL**: Allows subtyping if inheritance needed
4. **Collection sizing**: VARRAY for bounded, TABLE for unbounded
5. **Avoid circular dependencies**: Type A references Type B; don't have B reference A
6. **Member methods sparingly**: Methods should be lightweight operations
7. **Versioning**: Track type changes in version history/patch files

---

**When to Use**: Types are ideal for complex return values, table-based operations with BULK COLLECT, or when you need structured data with behaviors.
