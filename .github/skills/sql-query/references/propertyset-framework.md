# Propertyset Framework Core Concepts

> **Based on**: [Understanding Property Sets](https://hansentechnologies.atlassian.net/wiki/spaces/SE/pages/56160669)  
> **Last Updated**: January 24, 2026

## What is a Propertyset?

Propertysets are HUB's **metadata-driven architecture** for defining business objects. Instead of hardcoding columns, we use:

1. **Base Table**: Stores the object instance (one row per object)
2. **Property Table**: Stores attributes as key-value pairs (multiple rows per object)
3. **Metadata Tables**: Define what properties exist and how they behave

This provides **flexibility**: Add new attributes without schema changes by updating metadata.

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    METADATA LAYER                            │
├─────────────────┬──────────────────┬────────────────────────┤
│ PropertyFunction│ PropertySet      │ PropertySetMbr/Property│
├─────────────────┼──────────────────┼────────────────────────┤
│ Defines table   │ Groups properties│ Lists attributes in    │
│ pairs (object + │ by business      │ each property set      │
│ property tables)│ context (PSID)   │ with behavior rules    │
└─────────────────┴──────────────────┴────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
├────────────────────────────┬────────────────────────────────┤
│ Object Table (e.g. inventory)│ Property Table (invproperty)│
├────────────────────────────┼────────────────────────────────┤
│ inventoryid: 12345         │ propertykey: SNO               │
│ rootbuid: 110001234        │ propvalchar: 07666123456       │
│ productid: 5678            │ inventoryid: 12345             │
│ dateactive: 2024-01-01     │ ─────────────────────────────  │
│ datedeactive: NULL         │ propertykey: SUBSTATUS         │
│                            │ propvalchar: ACTIVE            │
│                            │ inventoryid: 12345             │
└────────────────────────────┴────────────────────────────────┘
```

## Key Metadata Tables

### PropertyFunction

**Purpose**: Maps base tables to property tables

**Key Columns**:
- `objecttablename` - Base table name (e.g., `inventory`)
- `tablename` - Property table name (e.g., `invproperty`)
- `objecttablepkcolname` - PK in base table (e.g., `inventoryid`)
- `fkcolname` - FK in property table (e.g., `inventoryid`)
- `udpokflg` - User-defined properties allowed? (Y/N)

**Example**:
```sql
SELECT * FROM propertyfunction WHERE objecttablename = 'inventory';
-- Result: tablename = 'invproperty', fkcolname = 'inventoryid'
```

### Property

**Purpose**: Defines all possible property keys system-wide

**Key Columns**:
- `propertykey` - Unique key (e.g., `SNO`, `SUBSTATUS`)
- `descr` - Human-readable description
- `datatype` - Data type (CHAR, NUMBER, DATE)
- `vmkey` - Validation method key (optional)

**Example**:
```sql
SELECT propertykey, descr, datatype 
FROM property 
WHERE propertykey IN ('SNO', 'SUBSTATUS', 'DEALTYPE');
```

### PropertySet

**Purpose**: Groups properties by business context

**Key Columns**:
- `psid` - Property Set ID (unique)
- `pskey` - Property Set Key (name used in code)
- `descr` - Description

**Example**:
```sql
SELECT psid, pskey, descr 
FROM propertyset 
WHERE descr LIKE '%Tariff%';
-- Result: psid=2987, pskey='TARIFF_BILLING_CAPPED'
```

### PropertySetMbr

**Purpose**: Links properties to property sets with UI behavior rules

**Key Columns**:
- `psid` - Property Set ID
- `propertykey` - Property Key
- `seq` - Display order
- `virtualcolname` - Actual column name or SQL expression
- `reqdflg` - Required field? (Y/N)
- `userreadflg` / `userwriteflg` - Access permissions
- `dfltvalue` - Default value or SQL function
- `dfltfiltertype` - Searchable? (INPUT/RANGE/NULL)

**Example**:
```sql
SELECT propertykey, virtualcolname, reqdflg, dfltfiltertype
FROM propertysetmbr
WHERE psid = 2987  -- Tariff Billing Capped
ORDER BY seq;
```

## Standard Query Patterns

### Pattern 1: Find All Properties for an Object

```sql
SELECT propertykey, propvalchar, propvalnumber, propvaldate
FROM {property_table}
WHERE {fk_column} = :object_id
  AND dateend IS NULL
ORDER BY propertykey;
```

**Example**: Get all properties for inventory item 12345
```sql
SELECT propertykey, propvalchar, propvalnumber, propvaldate
FROM invproperty
WHERE inventoryid = 12345
  AND dateend IS NULL;
```

### Pattern 2: Find Objects by Property Value

```sql
SELECT obj.*
FROM {object_table} obj
JOIN {property_table} prop ON obj.{id_col} = prop.{fk_col}
WHERE prop.propertykey = :key
  AND prop.propvalchar = :value  -- or propvalnumber/propvaldate
  AND obj.datedeactive IS NULL;
```

**Example**: Find subscription by MPN
```sql
SELECT i.inventoryid, i.rootbuid, i.dateactive
FROM inventory i
JOIN invproperty ip ON i.inventoryid = ip.inventoryid
WHERE ip.propertykey = 'SNO'
  AND ip.propvalchar = '07666123456'
  AND i.datedeactive IS NULL;
```

### Pattern 3: Multi-Property Filter (AND)

```sql
SELECT obj.*
FROM {object_table} obj
WHERE EXISTS (
  SELECT 1 FROM {property_table} p1
  WHERE p1.{fk_col} = obj.{id_col}
    AND p1.propertykey = :key1
    AND p1.propvalchar = :value1
)
AND EXISTS (
  SELECT 1 FROM {property_table} p2
  WHERE p2.{fk_col} = obj.{id_col}
    AND p2.propertykey = :key2
    AND p2.propvalchar = :value2
);
```

**Example**: Find active OCS subscriptions
```sql
SELECT i.inventoryid, i.rootbuid
FROM inventory i
WHERE i.datedeactive IS NULL
  AND EXISTS (
    SELECT 1 FROM invproperty ip1
    WHERE ip1.inventoryid = i.inventoryid
      AND ip1.propertykey = 'SUBSTATUS'
      AND ip1.propvalchar = 'ACTIVE'
  )
  AND EXISTS (
    SELECT 1 FROM invproperty ip2
    WHERE ip2.inventoryid = i.inventoryid
      AND ip2.propertykey = 'SUBPROVSYS'
      AND ip2.propvalchar = 'O'
  );
```

### Pattern 4: Property Reference Lookup

Use `propertyfunction` to discover table relationships:

```sql
SELECT pf.objecttablename, 
       pf.tablename as property_table,
       pf.objecttablepkcolname as id_col,
       pf.fkcolname as fk_col
FROM propertyfunction pf
WHERE pf.objecttablename = :table_name;
```

## Important Property Keys by Domain

### Inventory/Subscription (`invproperty`)

| PropertyKey | Description | DataType | Example |
|-------------|-------------|----------|---------|
| **SNO** | Subscriber Number (MPN) | VARCHAR | 07666123456 |
| **SUBSTATUS** | Subscription Status | VARCHAR | ACTIVE, SUSPENDED |
| **SUBPROVSYS** | Provisioning System | VARCHAR | O (OCS), H (HPIN) |
| **DEALTYPE** | Deal Type | VARCHAR | BAU, AUFREEDOM |
| **CNTMTH** | Contract Months | NUMBER | 12, 24, 36 |
| **ORDREF** | Order Reference | VARCHAR | 18686192-1-1 |
| **ICCIDSSN** | SIM ICCID | VARCHAR | 8944... |
| **IMEI** | Device IMEI | VARCHAR | 359... |
| **HFHELIBL** | HFH Eligible | VARCHAR | Y, N |

### Product (`productmetaproperty`)

| PropertyKey | Description | DataType | Example |
|-------------|-------------|----------|---------|
| **DEALTYPE** | Deal Type | VARCHAR | AUFREEDOM, AUSTANDARD |
| **REFMASTER** | Reference Master | VARCHAR | HUB, MAGENTO |
| **BUNDLEGRP** | Bundle Group ID | NUMBER | 57045980 |
| **OEORDPRICE** | Order Price | NUMBER | 10.00 |
| **AGRMTHCHG** | Monthly Charge | NUMBER | 25.00 |
| **FIRSTSALEDT** | First Sale Date | DATE | 2024-01-01 |
| **LASTSALESDT** | Last Sales Date | DATE | 2025-12-31 |
| **NONRTPR** | Non-Return Price | NUMBER | 150.00 |

### Business Unit (`buproperty`)

| PropertyKey | Description | DataType | Example |
|-------------|-------------|----------|---------|
| **BUSTATUS** | Business Status | VARCHAR | ACTIVE, CLOSED |
| **PROVSYS** | Provisioning System | VARCHAR | O (OCS), H (HPIN) |
| **EMAIL** | Email Address | VARCHAR | customer@example.com |

### Service Order (`hitransactionproperty`)

| PropertyKey | Description | DataType | Example |
|-------------|-------------|----------|---------|
| **ORDREF** | Order Reference | VARCHAR | 18686192-1-1 |
| **PDATE** | Provision Date | DATE | 2024-01-15 |
| **DEACTRSN** | Deactivation Reason | VARCHAR | DTR (Treatment) |
| **SNO1** | Subscriber Number | NUMBER | inventoryid |
| **ACTPKG** | Action Package | VARCHAR | pkg_so.ActionSO |

### Receipt/Payment (`receiptproperty`)

| PropertyKey | Description | DataType | Example |
|-------------|-------------|----------|---------|
| **PAYMENTID** | Payment Gateway ID | VARCHAR | 410000414793 |
| **MERCHTRANSID** | Merchant Trans ID | VARCHAR | ... |
| **POTOKEN** | Payment Token | VARCHAR | ... |

## Date-Effective Properties

Some properties support historical tracking with date ranges:

**Key Columns**:
- `datestart` - When property became active
- `dateend` - When property was superseded (NULL = current)

**Always filter for current values**:
```sql
WHERE prop.dateend IS NULL
```

**Query historical values**:
```sql
WHERE :as_of_date BETWEEN prop.datestart AND NVL(prop.dateend, TO_DATE('9999-12-31','YYYY-MM-DD'))
```

## System Properties

Global configuration stored in `systemproperty` (no base object table):

```sql
SELECT propertykey, propvalchar, propvalnumber, propvaldate
FROM systemproperty
WHERE propertykey = 'MAXCNTPER';  -- Max contract period
```

Common System Properties:
- `MAXCNTPER` - Maximum contract period
- Various feature flags and configuration values

## Best Practices

1. **Always filter active records**:
   ```sql
   WHERE obj.datedeactive IS NULL
     AND prop.dateend IS NULL
   ```

2. **Use proper data type columns**:
   - Strings: `propvalchar`
   - Numbers: `propvalnumber`
   - Dates: `propvaldate`

3. **Check propertykey case sensitivity**: Always use UPPER case

4. **Join on correct FK columns**: Verify from `propertyfunction`

5. **Consider indexes**: Property tables are large; filter efficiently

6. **Discover properties**: 
   ```sql
   SELECT DISTINCT propertykey 
   FROM {property_table} 
   ORDER BY propertykey;
   ```

## Advanced: Dynamic SQL Generation

HUB Plus UI generates SQL dynamically from metadata:

1. **FROM clause**: Built from `propertyfunction.objecttablename` + `tablename`
2. **SELECT clause**: From `propertysetmbr.virtualcolname`
3. **WHERE clause**: From `propertysetmbr.dfltfiltertype` + user input
4. **Validation**: Triggered by `property.vmkey` or `propertysetmbr.vmkey`

See Confluence: [Understanding Property Sets](https://hansentechnologies.atlassian.net/wiki/spaces/SE/pages/56160669)

---

**Related**:
- [table-mappings.md](table-mappings.md) - Complete object/property table pairs
- [../cheatsheet/index.md](../cheatsheet/index.md) - Real-world query examples
