# Table Mappings Reference

> **Source**: Extracted from `propertyfunction` table  
> **Last Updated**: January 24, 2026

## Overview

This document maps base object tables to their associated property tables in the HUB propertyset framework. Use this to construct queries that join objects with their properties.

## Standard Join Pattern

```sql
SELECT obj.*, prop.propertykey, prop.propvalchar, prop.propvalnumber, prop.propvaldate
FROM {ObjectTableName} obj
JOIN {PropertyTableName} prop 
  ON obj.{ObjectTablePKColumn} = prop.{FKColumn}
WHERE prop.propertykey = '{PROPERTY_KEY}'
  AND prop.dateend IS NULL  -- Active properties only
```

## Complete Mappings

| Code | Description | Base Table | Property Table | ID Column | FK Column | UDP |
|------|-------------|------------|----------------|-----------|-----------|-----|
| **INV** | Customer OE IDs | `inventory` | `invproperty` | `inventoryid` | `inventoryid` | ✅ |
| **BU** | Business Unit | `businessunit` | `buproperty` | `buid` | `buid` | ✅ |
| **SO/HIT** | Service Order | `hitransaction` | `hitransactionproperty` | `hitransactionid` | `hitransactionid` | ✅ |
| **PD** | Product Property | `product` | `productmetaproperty` | `productid` | `productid` | ❌ |
| **R** | Receipt | `receipt` | `receiptproperty` | `receiptid` | `receiptid` | ❌ |
| **CS** | Customer Site | `customersite` | `csproperty` | `customersiteid` | `customersiteid` | ❌ |
| **BC/EC** | BU Contact | `bucontact` | `bucontactproperty` | `bucontactid` | `bucontactid` | ❌ |
| **DP** | Discount Plan | `discountplan` | `discountplanproperty` | `discountplanid` | `discountplanid` | ❌ |
| **HM** | Hierarchy Member | `hierarchymbr` | `hmbroproperty` | `hmbrid` | `hmbrid` | ✅ |
| **RP** | Rating Plan | `ratingplan` | `rpproperty` | `ratingplanid` | `ratingplanid` | ❌ |
| **PPP** | Payment Plan | `telcopaymentplan` | `ppproperty` | `paymentplanid` | `paymentplanid` | ✅ |
| **RB** | Receipt Batch | `receiptbatch` | `rbproperty` | `receiptbatchid` | `receiptbatchid` | ❌ |
| **BG** | Billing Group | `billinggroup` | `bgproperty` | `billinggroupid` | `billinggroupid` | ❌ |
| **PM** | Payment Method | `paymentmethod` | N/A | `pmcode` | `pmcode` | ✅ |
| **TP** | Third Party | `thirdparty` | `tpproperty` | `thirdpartyid` | `thirdpartyid` | ❌ |
| **CDTB** | Code Table Line | `codetableline` | `ctlineproperty` | `codetablelineid` | `codetablelineid` | ✅ |
| **UP/UF** | User | `vw_hubuser` / `hubuser` | `userproperty` | `userid` | `userid` | ❌ |
| **SP** | SupplyPoint | `supplypoint` | `spproperty` | `supplypointid` | `supplypointid` | ❌ |
| **DEP** | Deposit | `deposit` | `depositproperty` | `depositid` | `depositid` | ❌ |
| **ADJ** | Adjustments | `invoiceadjustment` | N/A | `invoiceadjustmentid` | `invoiceadjustmentid` | ❌ |

## Key Object Types

### Subscriptions & Inventory

**Base Table**: `inventory`  
**Property Table**: `invproperty`  
**Join**: `i.inventoryid = ip.inventoryid`  
**UDP Support**: Yes

Common Properties:
- `SNO` - Mobile Phone Number (MPN)
- `SUBSTATUS` - Subscription Status
- `DEALTYPE` - Deal Type
- `CNTMTH` - Contract Months
- `ORDREF` - Order Reference
- `ICCIDSSN` - SIM ICCID
- `SUBPROVSYS` - Provisioning System

**Example**:
```sql
SELECT i.rootbuid, i.inventoryid, ip.propertykey, ip.propvalchar
FROM inventory i
JOIN invproperty ip ON i.inventoryid = ip.inventoryid
WHERE i.datedeactive IS NULL
  AND ip.propertykey IN ('SNO', 'SUBSTATUS', 'DEALTYPE')
```

### Customers & Accounts

**Base Table**: `businessunit`  
**Property Table**: `buproperty`  
**Join**: `bu.buid = bup.buid`  
**UDP Support**: Yes

Common Properties:
- `BUSTATUS` - Business Status
- `PROVSYS` - Provisioning System
- `EMAIL` - Email Address

**Example**:
```sql
SELECT bu.buid, bu.name, bup.propertykey, bup.propvalchar
FROM businessunit bu
JOIN buproperty bup ON bu.buid = bup.buid
WHERE bu.butype = 'R'  -- Retail customer
  AND bu.dateend IS NULL
```

### Service Orders

**Base Table**: `hitransaction`  
**Property Table**: `hitransactionproperty`  
**Join**: `h.hitransactionid = hp.hitransactionid`  
**UDP Support**: Yes

Common Properties:
- `ORDREF` - Order Reference
- `PDATE` - Provision Date
- `DEACTRSN` - Deactivation Reason
- `SNO1` - Subscriber Number (for order)

**Example**:
```sql
SELECT h.hitransactionid, h.histatus, hp.propertykey, hp.propvalchar, hp.propvaldate
FROM hitransaction h
JOIN hitransactionproperty hp ON h.hitransactionid = hp.hitransactionid
WHERE h.histatus IN ('COMP', 'INPR')
```

### Products & Tariffs

**Base Table**: `product`  
**Property Table**: `productmetaproperty`  
**Join**: `p.productid = pmp.productid`  
**UDP Support**: No

Common Properties:
- `DEALTYPE` - Deal Type (BAU, AUFREEDOM, AUSTANDARD, AUIMMEDIATE)
- `BUNDLEGRP` - Bundle Group ID
- `REFMASTER` - Reference Master (HUB/MAGENTO)
- `OEORDPRICE` - Order Price
- `AGRMTHCHG` - Agreement Monthly Charge
- `FIRSTSALEDT` - First Sale Date
- `LASTSALESDT` - Last Sales Date

**Example**:
```sql
SELECT p.productcode, pmp.propertykey, pmp.propvalchar, pmp.propvalnumber
FROM product p
JOIN productmetaproperty pmp ON p.productid = pmp.productid
WHERE p.datedeactive IS NULL
  AND pmp.propertykey IN ('DEALTYPE', 'REFMASTER', 'OEORDPRICE')
```

### Payments & Receipts

**Base Table**: `receipt`  
**Property Table**: `receiptproperty`  
**Join**: `r.receiptid = rp.receiptid`  
**UDP Support**: No

Common Properties:
- `PAYMENTID` - Payment Gateway ID
- `MERCHTRANSID` - Merchant Transaction ID
- `POTOKEN` - Payment Token

**Example**:
```sql
SELECT r.receiptid, r.amount, rp.propertykey, rp.propvalchar
FROM receipt r
JOIN receiptproperty rp ON r.receiptid = rp.receiptid
WHERE rp.propertykey IN ('PAYMENTID', 'MERCHTRANSID', 'POTOKEN')
```

## Special Cases

### Views as Base Tables

Some property functions reference views instead of tables:

- **IVC**: `vw_invoice` (read-only invoice view)
- **UP**: `vw_hubuser` (user view)
- **CTBSR**: `vw_codetables` (code table search)
- **RBV**: `vw_receiptbatch` (receipt batch view)

### Self-Referencing Tables

- **PM**: `paymentmethod` - Property table same as base table
- **ADJ**: `invoiceadjustment` - No separate property table
- **PER**: `period` - Period table references itself

## UDP (User Defined Properties)

Tables marked with UDP support allow dynamic property definitions beyond standard properties. Check `udpokflg = 'Y'` in `propertyfunction`.

**UDP-Enabled Tables**:
- `inventory` / `invproperty`
- `businessunit` / `buproperty`
- `hitransaction` / `hitransactionproperty`
- `hierarchymbr` / `hmbroproperty`
- `telcopaymentplan` / `ppproperty`
- `paymentmethod` (self)
- `codetableline` / `ctlineproperty`

## System Properties

**Base Table**: N/A  
**Property Table**: `systemproperty`  
**Code**: `S`

System-wide configuration properties (no base object table):

```sql
SELECT propertykey, propvalchar, propvalnumber
FROM systemproperty
WHERE propertykey = 'MAXCNTPER'  -- Example: Max contract period
```

## Usage Tips

1. **Always filter on active records**:
   ```sql
   WHERE obj.datedeactive IS NULL
     AND prop.dateend IS NULL
   ```

2. **Check propertykey existence**:
   ```sql
   SELECT DISTINCT propertykey 
   FROM {property_table}
   ORDER BY propertykey
   ```

3. **Find table mapping**:
   ```sql
   SELECT * FROM propertyfunction 
   WHERE objecttablename = 'inventory'
   ```

4. **Multi-property filters**:
   ```sql
   WHERE EXISTS (SELECT 1 FROM invproperty ip1 
                 WHERE ip1.inventoryid = i.inventoryid 
                   AND ip1.propertykey = 'SNO' 
                   AND ip1.propvalchar = '07666123456')
     AND EXISTS (SELECT 1 FROM invproperty ip2 
                 WHERE ip2.inventoryid = i.inventoryid 
                   AND ip2.propertykey = 'SUBSTATUS' 
                   AND ip2.propvalchar = 'ACTIVE')
   ```

---

**Note**: This mapping is auto-generated from `propertyfunction` table. For custom properties and business logic, see [propertyset-framework.md](propertyset-framework.md).
