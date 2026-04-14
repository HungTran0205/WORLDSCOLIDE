# Data Patch Creation Guide

## Overview

Data patches (PDM files) are SQL scripts used to create or modify reference data in the Tesco Mobile HUB database. They follow strict naming and structural conventions to ensure traceability, audit compliance, and consistent deployment.

## File Location

All data patches are stored in:
```
cis-hu-tm-server/Patches/pdm/
```

## Naming Convention

Pattern: `pdm{YYMMDD}{initials}{sequence}.sql`

- **YYMMDD**: Date in year-month-day format (e.g., `260112` for 12 Jan 2026)
- **initials**: Developer initials (3-4 letters, e.g., `tge`, `tps`, `trf`)
- **sequence**: Two-digit sequence number if multiple patches on same day (e.g., `01`, `02`)

**Examples**:
- `pdm260112tge01.sql` - First patch by `tge` on 12 Jan 2026
- `pdm250129tge01.sql` - Patch by Maritoni Leyco (tge) on 29 Jan 2025
- `pdm241127tps01.sql` - Patch for system properties on 27 Nov 2024

## Standard Structure

Every data patch must follow this template:

```sql
--    Module      : pdm{YYMMDD}{initials}{sequence}.sql
--    Application : Hansen Universal Billing (HUB)
--    #Author     : {Full Name}
--    #Client     : Tesco Mobile
--    #Usage      : {HTM-XXXXX} {Brief Description}
--    -------------------------------------------------------------
--
SET TERM ON
SET SERVEROUTPUT ON SIZE 1000000

DECLARE 
    lAudit          PLS_INTEGER;
    lAuthor         VARCHAR2(20)  := '{Author Name}';
    lPatch          VARCHAR2(20)  := 'pdm{YYMMDD}{initials}{sequence}.sql';
    lWR             VARCHAR2(10)  := '{HTM-XXXXX}';
    lPurpose        VARCHAR2(250) := '{Detailed purpose of the patch}';
    lUser           VARCHAR2(50);
    lCount          PLS_INTEGER := 0;
    
    --------------------------------------------------------------------------------------------
    PROCEDURE log(istr VARCHAR2) IS
    BEGIN
        dbms_output.put_line(substr(istr, 1,250));
    END LOG;
    --------------------------------------------------------------------------------------------
BEGIN
    LOG('Patch being applied is ' || lPatch);
    LOG('Patch author is        ' || lAuthor);
    LOG('Patch Purpose is       ' || lPurpose);
    LOG('Patch start time       ' || to_char(SYSDATE, 'dd-mm-yyyy hh24:mi:ss'));
    LOG('----------------------------------------------');
    --------------------------------------------------------------------------------------------
    lAudit := pkg_Audit.SetInfo(lPatch,pkg_util.SysPropVal('ADMIN_USERID', 'N'));
    --------------------------------------------------------------------------------------------
    
    -- YOUR DATA CHANGES HERE
    
    --------------------------------------------------------------------------------------------
    LOG('Patch end time         ' || to_char(SYSDATE, 'dd-mm-yyyy hh24:mi:ss'));
    LOG('----------------------------------------------');
    LOG(lPatch || ' Complete.');
    LOG('----------------------------------------------');
END;
/
```

## Common Use Cases

### 1. Creating Properties and Property Sets

Use `pkg_prop` procedures for property management:

```sql
-- Create a new property set
pkg_prop.InsertPropertySet(
    l_PFCode => 'DP',                    -- Property family code
    l_Descr  => 'Description of property set',
    l_PSKey  => 'PS_KEY_NAME'            -- Unique property set key
);

-- Add properties to the set
pkg_prop.InsertProperty(
    l_PSID    => pkg_prop.g_PSID,        -- Uses last created property set ID
    l_PKey    => 'PROPKEY',               -- Property key (unique identifier)
    l_PDescr  => 'Property Description',
    l_DType   => 'C',                     -- Data type: C=Character, N=Number, D=Date
    l_PFCode  => 'DP',                    -- Property family code
    l_Read    => 'Y',                     -- Readable flag
    l_Write   => 'Y',                     -- Writable flag
    l_Req     => 'N',                     -- Required flag
    l_Page    => 'General'                -- UI page grouping
);
```

**Property Data Types**:
- `C` - Character/String
- `N` - Number
- `D` - Date
- `B` - Boolean

### 2. Creating Domains

Domains define reference data lookup tables:

```sql
-- Create domain using pkg_prop
pkg_prop.InsertDomain(
    l_Domain      => 'DOMAINKEY',        -- Domain key (unique identifier)
    l_descr       => 'Domain Description',
    l_upd         => 'D',                -- Update flag: D=Dynamic, S=Static
    l_tablename   => 'VW_DOMAIN_VIEW',   -- Source view/table name
    l_pkeycolname => 'ID_COLUMN',        -- Primary key column
    l_descrcolname=> 'DESCR_COLUMN'      -- Description column
);

-- Update domain flags if needed
UPDATE Domain 
SET    AlwaysRefreshFlg = 'Y'
WHERE  DomainKey = 'DOMAINKEY';
```

**Update Flags**:
- `D` - Dynamic (data can change)
- `S` - Static (reference data rarely changes)

### 3. Creating Client Objects

Client objects define security and navigation structures:

```sql
-- Get parent client object ID
SELECT c.clientobjectid
INTO   lParentCObjID
FROM   clientobject c
WHERE  c.objectname = 'PARENT_OBJECT_NAME';

-- Insert new client object
pkg_prop.InsertClientObject(
    l_ObjectName      => 'NEW_OBJECT_NAME',
    l_ObjectIndex     => 99,              -- Display order
    l_Descr           => 'Object Description',
    l_ObjectType      => 'SECCT',         -- Object type: SECCT, TAB, etc.
    l_ParentObjectId  => lParentCObjID,
    l_RequiredFlag    => 'N',
    l_SecurityFlag    => 'Y',
    l_ValidationFlag  => 'N'
);
```

**Common Object Types**:
- `SECCT` - Security context/section
- `TAB` - Tab page
- `FIELD` - Individual field

### 4. Creating System Properties

System-wide configuration properties:

```sql
-- Insert system property
INSERT INTO systemproperty (propertykey, propvalchar, descr)
SELECT 'SYSPROP_KEY', 'default_value', 'Property Description'
FROM   dual
WHERE  NOT EXISTS (SELECT 1 FROM systemproperty WHERE propertykey = 'SYSPROP_KEY');

LOG('System property created: ' || SQL%ROWCOUNT);
```

### 5. Updating Property Visibility

Hide or show properties from users:

```sql
UPDATE propertysetmbr pm
SET    pm.userreadflg = 'N',
       pm.userwriteflg = 'N'
WHERE  pm.propertykey IN ('PROP1', 'PROP2', 'PROP3')
AND    (pm.userreadflg != 'N' OR pm.userwriteflg != 'N');

LOG('Number of Properties updated: ' || SQL%ROWCOUNT);
```

### 6. Creating Third-Party Configurations

Third-party integration settings:

```sql
-- Insert third-party configuration
INSERT INTO thirdparty (thirdpartyid, thirdpartyname, descr, status)
SELECT seq_thirdparty.NEXTVAL, 'THIRDPARTY_NAME', 'Description', 'A'
FROM   dual
WHERE  NOT EXISTS (SELECT 1 FROM thirdparty WHERE thirdpartyname = 'THIRDPARTY_NAME');

-- Get the third-party ID
SELECT thirdpartyid
INTO   lThirdPartyID
FROM   thirdparty
WHERE  thirdpartyname = 'THIRDPARTY_NAME';

-- Insert third-party properties
INSERT INTO thirdpartyproperty (thirdpartyid, propertykey, propvalchar)
SELECT lThirdPartyID, 'ENDPOINT_URL', 'https://api.example.com'
FROM   dual
WHERE  NOT EXISTS (SELECT 1 FROM thirdpartyproperty 
                   WHERE thirdpartyid = lThirdPartyID 
                   AND propertykey = 'ENDPOINT_URL');
```

### 7. Domain Code Management

Insert values into domain code tables:

```sql
-- Insert domain code
INSERT INTO domaincode (domainkey, code, descr, orderby, activeflg)
SELECT 'DOMAINKEY', 'CODE_VALUE', 'Code Description', 10, 'Y'
FROM   dual
WHERE  NOT EXISTS (SELECT 1 FROM domaincode 
                   WHERE domainkey = 'DOMAINKEY' 
                   AND code = 'CODE_VALUE');

LOG('Domain code inserted: ' || SQL%ROWCOUNT);
```

## Best Practices

### 1. Always Use Audit Logging

```sql
lAudit := pkg_Audit.SetInfo(lPatch, pkg_util.SysPropVal('ADMIN_USERID', 'N'));
```

This ensures all changes are tracked in the audit trail.

### 2. Check Existence Before Insert

Always use `WHERE NOT EXISTS` to prevent duplicate data:

```sql
INSERT INTO table_name (column1, column2)
SELECT value1, value2
FROM   dual
WHERE  NOT EXISTS (SELECT 1 FROM table_name WHERE column1 = value1);
```

### 3. Log Row Counts

After each DML operation, log the number of affected rows:

```sql
LOG('Number of records updated: ' || SQL%ROWCOUNT);
LOG('Number of records inserted: ' || SQL%ROWCOUNT);
LOG('Number of records deleted: ' || SQL%ROWCOUNT);
```

### 4. Use Variables for Reusability

Declare variables at the top for values used multiple times:

```sql
DECLARE
    lDomainKey      VARCHAR2(50) := 'MYDOMAIN';
    lPropertyKey    VARCHAR2(50) := 'MYPROP';
    lPSID           PLS_INTEGER;
```

### 5. Comment Complex Logic

Add inline comments for non-obvious operations:

```sql
-- Update bundle discount method from Permitted to One-Off Bundle Group
-- This affects all upgrade bundles configured in UPGBUNDCODE domain
UPDATE discountplan dp
SET    dp.discountmethod = 'TMPBUNDGRP'
WHERE  dp.discountplanid IN (SELECT t.groupplanid FROM vw_bundlegrpmap t);
```

### 6. Use Cursors for Bulk Operations

When processing multiple rows with complex logic:

```sql
CURSOR cDomain IS
    SELECT 'DOMKEY1' domkey, 'Description 1' domdescr FROM dual
    UNION ALL
    SELECT 'DOMKEY2' domkey, 'Description 2' domdescr FROM dual;

FOR rec IN cDomain LOOP
    pkg_prop.InsertDomain(
        l_Domain => rec.domkey,
        l_descr  => rec.domdescr,
        l_upd    => 'D',
        l_tablename => 'VW_' || rec.domkey
    );
    LOG('Domain created: ' || rec.domkey);
END LOOP;
```

### 7. Handle Validation Methods

When properties require validation:

```sql
-- Create validation method
INSERT INTO validationmethod (vmkey, basemsgkey, descr, procname)
SELECT 'VALIDATION_KEY', 'V_SYS', 'Validation Description', 'pkg_val.postupdate'
FROM   dual
WHERE  NOT EXISTS (SELECT 1 FROM validationmethod WHERE vmkey = 'VALIDATION_KEY');

-- Link to property
UPDATE property p
SET    p.vmkey = 'VALIDATION_KEY'
WHERE  p.propertykey = 'PROPERTY_KEY';
```

## Common Package Procedures

### pkg_prop Package

- `InsertPropertySet()` - Create property set
- `InsertProperty()` - Add property to property set
- `InsertDomain()` - Create domain
- `InsertClientObject()` - Create client object
- `g_PSID` - Global variable holding last created property set ID

### pkg_audit Package

- `SetInfo(patch_name, userid)` - Initialize audit logging
- `log_change(entity, action, details)` - Log specific changes

### pkg_util Package

- `SysPropVal(key, default)` - Get system property value

## Validation Checklist

Before finalizing a data patch:

- [ ] File name follows `pdm{YYMMDD}{initials}{sequence}.sql` convention
- [ ] Header contains all required metadata (Module, Author, Client, Usage)
- [ ] HTM ticket reference included in Usage field
- [ ] Audit logging initialized with `pkg_Audit.SetInfo()`
- [ ] All inserts use `WHERE NOT EXISTS` to prevent duplicates
- [ ] Row counts logged after each DML operation
- [ ] Start and end timestamps logged
- [ ] Patch completion message logged
- [ ] Complex logic has inline comments
- [ ] Tested on development database before deployment

## Execution

Data patches are typically executed:

1. **During Development**: Test on DEV database
2. **During Deployment**: Executed as part of release deployment scripts
3. **Rollback**: Create reverse patch if needed (use `pdmDrop*` prefix)

## Example: Complete Property Set Creation

```sql
--    Module      : pdm260122tge01.sql
--    Application : Hansen Universal Billing (HUB)
--    #Author     : Your Name
--    #Client     : Tesco Mobile
--    #Usage      : HTM-XXXXX Create Credit Check Configuration Properties
--    -------------------------------------------------------------

SET TERM ON
SET SERVEROUTPUT ON SIZE 1000000

DECLARE 
    lAudit          PLS_INTEGER;
    lAuthor         VARCHAR2(20)  := 'Your Name';
    lPatch          VARCHAR2(20)  := 'pdm260122tge01.sql';
    lWR             VARCHAR2(10)  := 'HTM-XXXXX';
    lPurpose        VARCHAR2(250) := 'Create Credit Check Configuration Properties';
    lParentCObjID   clientobject.clientobjectid%TYPE;
    
    PROCEDURE log(istr VARCHAR2) IS
    BEGIN
        dbms_output.put_line(substr(istr, 1,250));
    END LOG;
    
BEGIN
    LOG('Patch being applied is ' || lPatch);
    LOG('Patch author is        ' || lAuthor);
    LOG('Patch Purpose is       ' || lPurpose);
    LOG('Patch start time       ' || to_char(SYSDATE, 'dd-mm-yyyy hh24:mi:ss'));
    LOG('----------------------------------------------');
    
    lAudit := pkg_Audit.SetInfo(lPatch, pkg_util.SysPropVal('ADMIN_USERID', 'N'));
    
    -- Create property set
    pkg_prop.InsertPropertySet(
        l_PFCode => 'SYS',
        l_Descr  => 'Credit Check Configuration',
        l_PSKey  => 'SYS_CREDIT_CHECK'
    );
    
    LOG('Property set created: SYS_CREDIT_CHECK');
    
    -- Add endpoint property
    pkg_prop.InsertProperty(
        l_PSID    => pkg_prop.g_PSID,
        l_PKey    => 'CC_ENDPOINT',
        l_PDescr  => 'Credit Check API Endpoint',
        l_DType   => 'C',
        l_PFCode  => 'SYS',
        l_Read    => 'Y',
        l_Write   => 'Y',
        l_Req     => 'Y',
        l_Page    => 'General'
    );
    
    -- Add timeout property
    pkg_prop.InsertProperty(
        l_PSID    => pkg_prop.g_PSID,
        l_PKey    => 'CC_TIMEOUT',
        l_PDescr  => 'Credit Check Timeout (seconds)',
        l_DType   => 'N',
        l_PFCode  => 'SYS',
        l_Read    => 'Y',
        l_Write   => 'Y',
        l_Req     => 'Y',
        l_Page    => 'General',
        l_AddAfterProperty => 'CC_ENDPOINT'
    );
    
    -- Add enabled flag property
    pkg_prop.InsertProperty(
        l_PSID    => pkg_prop.g_PSID,
        l_PKey    => 'CC_ENABLED',
        l_PDescr  => 'Credit Check Enabled',
        l_DType   => 'C',
        l_PFCode  => 'SYS',
        l_Read    => 'Y',
        l_Write   => 'Y',
        l_Req     => 'Y',
        l_Page    => 'General',
        l_AddAfterProperty => 'CC_TIMEOUT'
    );
    
    LOG('Properties created: 3');
    
    -- Insert default system property values
    INSERT INTO systemproperty (propertykey, propvalchar, descr)
    SELECT 'CC_ENABLED', 'Y', 'Enable credit check integration'
    FROM   dual
    WHERE  NOT EXISTS (SELECT 1 FROM systemproperty WHERE propertykey = 'CC_ENABLED');
    
    LOG('System properties inserted: ' || SQL%ROWCOUNT);
    
    LOG('Patch end time         ' || to_char(SYSDATE, 'dd-mm-yyyy hh24:mi:ss'));
    LOG('----------------------------------------------');
    LOG(lPatch || ' Complete.');
    LOG('----------------------------------------------');
END;
/
```

## Troubleshooting

### Common Errors

**ORA-00001: unique constraint violated**
- Cause: Attempting to insert duplicate data
- Fix: Add `WHERE NOT EXISTS` clause or check existing data first

**ORA-02291: integrity constraint violated**
- Cause: Foreign key constraint violation
- Fix: Ensure parent records exist before inserting child records

**Property set not found**
- Cause: Using `pkg_prop.g_PSID` before creating property set
- Fix: Call `InsertPropertySet()` first, then use `g_PSID`

**Procedure compilation errors**
- Cause: Missing BEGIN/END or syntax errors
- Fix: Validate SQL syntax, ensure all procedures are properly closed

## Related References

- [naming-conventions.md](naming-conventions.md) - Naming standards for properties and domains
- [error-handling.md](error-handling.md) - Error handling patterns for patches
- [package-patterns.md](package-patterns.md) - Common package usage patterns
