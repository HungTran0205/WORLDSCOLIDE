---
name: tm:sql-query
metadata: version: 1.00
description: Write and execute SQL queries against Oracle database with deep understanding of propertyset framework and table relationships.
---

# SQL Query Skill

## Purpose

Generate and execute SQL queries against CIS HU TM Oracle database with full understanding of:
- **Propertyset Framework**: Metadata-driven object+property table pairs
- **Table Mappings**: Base tables and their associated property tables
- **Common Query Patterns**: Pre-validated queries for frequent use cases
- **Domain Knowledge**: Business context for property keys and their meanings

## When to Use

- Query customer data (subscriptions, accounts, orders)
- Investigate service orders and transactions
- Analyze billing and payment data
- Debug property values for business objects
- Research product configurations and tariffs
- Troubleshoot data issues in non-production environments

## How to Use This Skill

### 1. Connection Management

Before querying, establish database connection:

```
1. Use mcp_sqlcl_-_sql_d_list-connections to view available databases
2. Call mcp_sqlcl_-_sql_d_connect with connection name (TMDEV3, OED3, etc.)
3. Execute queries via mcp_sqlcl_-_sql_d_run-sql
4. Disconnect with mcp_sqlcl_-_sql_d_disconnect when done
```

### 2. Understanding Propertyset Framework

Core pattern: **Object Table + Property Table**

```sql
-- Standard join pattern
SELECT obj.*, prop.propertykey, prop.propvalchar, prop.propvalnumber, prop.propvaldate
FROM {object_table} obj
JOIN {property_table} prop ON obj.{id_column} = prop.{fk_column}
WHERE prop.propertykey = '{PROPERTY_KEY}'
```

**Example**: Find subscription by MPN
```sql
SELECT i.inventoryid, i.rootbuid, ip.propvalchar as mpn
FROM inventory i
JOIN invproperty ip ON i.inventoryid = ip.inventoryid
WHERE ip.propertykey = 'SNO'  -- SNO = Subscriber Number (MPN)
  AND ip.propvalchar = '07666123456'
  AND i.datedeactive IS NULL
```

### 3. Table Mapping Reference

Always consult [table-mappings.md](references/table-mappings.md) to find:
- Which property table belongs to which base table
- ID and FK column names for joins
- Whether object supports UDP (User Defined Properties)

**Key Mappings**:
- `inventory` → `invproperty` (subscriptions, devices)
- `businessunit` → `buproperty` (customers, accounts)
- `hitransaction` → `hitransactionproperty` (service orders)
- `product` → `productmetaproperty` (tariffs, products)
- `receipt` → `receiptproperty` (payments)

See full list: [references/table-mappings.md](references/table-mappings.md)

### 4. Common Property Keys

**Inventory/Subscription** (`invproperty`):
- `SNO` - Subscriber Number (MPN)
- `SUBSTATUS` - Subscription Status
- `DEALTYPE` - Deal Type (BAU, AUFREEDOM, etc.)
- `CNTMTH` - Contract Months
- `ORDREF` - Order Reference
- `ICCIDSSN` - SIM ICCID
- `SUBPROVSYS` - Provisioning System (O=OCS, H=HPIN)

**Product** (`productmetaproperty`):
- `DEALTYPE` - Deal Type
- `BUNDLEGRP` - Bundle Group ID
- `REFMASTER` - Reference Master (HUB/MAGENTO)
- `OEORDPRICE` - Order Price
- `AGRMTHCHG` - Agreement Monthly Charge

**Business Unit** (`buproperty`):
- `BUSTATUS` - Business Status
- `PROVSYS` - Provisioning System

See framework details: [references/propertyset-framework.md](references/propertyset-framework.md)

### 5. Query Patterns

**Pattern: Find Properties for Object**
```sql
SELECT propertykey, propvalchar, propvalnumber, propvaldate
FROM {property_table}
WHERE {fk_column} = :object_id
  AND dateend IS NULL  -- Current properties only
```

**Pattern: Filter by Property Value**
```sql
SELECT obj.*
FROM {object_table} obj
WHERE EXISTS (
  SELECT 1 FROM {property_table} prop
  WHERE prop.{fk_column} = obj.{id_column}
    AND prop.propertykey = '{KEY}'
    AND prop.propvalchar = :value
)
```

### 6. Pre-Built Queries

Use proven queries from the cheat sheet index:

[cheatsheet/index.md](cheatsheet/index.md)

Categories:
- Subscriptions & Inventory
- Service Orders
- Payments & Billing
- Products & Tariffs
- Customers & Accounts
- Bundles & Discounts
- CDR & Usage
- System & Reference Data

### 7. Workflow

**Generate Custom Query**:
```
1. Identify object type (subscription, order, product, etc.)
2. Look up table mapping in references/table-mappings.md
3. Identify required property keys
4. Build query using standard join pattern
5. Add filters for datedeactive IS NULL, dateend IS NULL
6. Execute and validate results
```

**Use Pre-Built Query**:
```
1. Browse cheatsheet/index.md by category
2. Select matching query file
3. Read query with business context
4. Modify parameters as needed
5. Execute via mcp_sqlcl_-_sql_d_run-sql
```

## Related Skills

- [plsql](../plsql/SKILL.md) - PL/SQL development with same framework knowledge
## References

- **Table Mappings** → [table-mappings.md](references/table-mappings.md)
- **Framework Core** → [propertyset-framework.md](references/propertyset-framework.md)
- **Query Index** → [cheatsheet/index.md](cheatsheet/index.md)

---

**Last Updated**: January 24, 2026  
**Maintained By**: Development Team  
**Database**: CIS HU TM Oracle 19c 