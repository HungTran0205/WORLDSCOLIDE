# Query Examples

## Connection & Basic Query

```sql
-- Connect to database
mcp_sqlcl_-_sql_d_connect HUBDEV

-- Simple SELECT
mcp_sqlcl_-_sql_d_run-sql "SELECT account_id, account_number, status FROM account WHERE status = 'ACTIVE'"

-- Results: CSV format
-- account_id,account_number,status
-- 1001,ACC001,ACTIVE
-- 1002,ACC002,ACTIVE
```

## Schema Inspection

```sql
-- Get schema metadata
mcp_sqlcl_-_sql_d_schema-information

-- Returns table definitions, column types, constraints, indexes
-- Use to understand schema before generating code
```

## Data Aggregation

```sql
-- Count invoices by status
mcp_sqlcl_-_sql_d_run-sql "
SELECT status, COUNT(*) as count
FROM invoice
GROUP BY status
"

-- Results: CSV
-- status,count
-- DRAFT,150
-- SENT,340
-- PAID,1205
```

## Insert & Commit

```sql
-- Create test record
mcp_sqlcl_-_sql_d_run-sql "
INSERT INTO account(customer_id, account_number, balance, status)
VALUES (999, 'TEST001', 0.00, 'ACTIVE')
"

-- Commit
mcp_sqlcl_-_sql_d_run-sql "COMMIT"
```

## Update with Validation

```sql
-- Update account balance
mcp_sqlcl_-_sql_d_run-sql "
UPDATE account SET balance = balance + 50.00
WHERE account_id = 1001
"

-- Verify update
mcp_sqlcl_-_sql_d_run-sql "SELECT account_id, balance FROM account WHERE account_id = 1001"
```

## Verify Package Creation

```sql
-- Check if package exists
mcp_sqlcl_-_sql_d_run-sql "
SELECT object_name, object_type, status
FROM user_objects
WHERE object_name = 'PKG_ACCOUNT'
"

-- Results show VALID/INVALID status
```

## Check Error Code Usage

```sql
-- Find all error codes in current packages
mcp_sqlcl_-_sql_d_run-sql "
SELECT name, text
FROM user_source
WHERE text LIKE '%-20%'
AND type = 'PACKAGE BODY'
"

-- Helps avoid duplicate error codes
```

## List All Connections Available

```bash
mcp_sqlcl_-_sql_d_list-connections
```

Output example:
```
Available connections:
- HUBDEV (default)
- HUBSTG
- HUBPROD (read-only)
```

## Disconnect Safely

```bash
mcp_sqlcl_-_sql_d_disconnect
```

---

**Tip**: Always inspect schema (`schema-information`) before writing code. Results help validate generated package/procedure contracts.
