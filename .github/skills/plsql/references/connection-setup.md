# Connection Setup Guide

## Prerequisites

1. Oracle database with `tnsnames.ora` configured
2. SQLcl MCP tools available (mcp_sqlcl_-_sql_d_*)
3. Pre-configured database connections in sqlcl CLI

## Quick Start

### 1. List Available Connections

```
mcp_sqlcl_-_sql_d_list-connections
```

Shows all saved named connections and default selection.

### 2. Connect to Database

```
mcp_sqlcl_-_sql_d_connect <connection_name>
```

Example:
```
mcp_sqlcl_-_sql_d_connect HUBDEV
```

If already connected, tool will prompt to confirm switch.

### 3. Verify Connection

```
mcp_sqlcl_-_sql_d_run-sql "SELECT 1 FROM DUAL"
```

Returns CSV output if successful.

### 4. Inspect Schema (Optional)

```
mcp_sqlcl_-_sql_d_schema-information
```

Returns metadata about current connected schema: tables, columns, constraints, indexes.

### 5. Execute Queries

```
mcp_sqlcl_-_sql_d_run-sql "SELECT * FROM account WHERE account_id = 12345"
```

Returns results in CSV format for easy parsing.

### 6. Disconnect

```
mcp_sqlcl_-_sql_d_disconnect
```

## Connection Types

| Connection | Purpose | Access |
|------------|---------|--------|
| HUBDEV | Development database | Read/Write (safe for testing) |
| HUBSTG | Staging database | Read/Write (pre-prod) |
| HUBPROD | Production database | Read-only (restricted) |

Check actual names via `list-connections`.

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Connection not found" | Run list-connections; verify exact name (case-sensitive) |
| "ORA-01017 invalid username/password" | Check .env credentials or connection config |
| "ORA-12154 TNS could not resolve" | Verify TNS_ADMIN environment variable |
| "Already connected to..." | Disconnect first or confirm switch |

## Common Workflows

### Query Data

```
1. Connect to HUBDEV
2. Run: SELECT COUNT(*) FROM account
3. Results show row count
4. Disconnect
```

### Validate Schema Before Code Generation

```
1. Connect
2. Run: mcp_sqlcl_-_sql_d_schema-information
3. Review table definitions
4. Generate code aligned with actual schema
5. Disconnect
```

### Multi-step Operations

```
1. Connect
2. Query 1: SELECT account_id FROM account WHERE status = 'ACTIVE'
3. Query 2: UPDATE account SET last_modified = SYSDATE
4. Query 3: COMMIT
5. Disconnect
```

---

**Note**: Results returned as CSV; parse programmatically if needed.
