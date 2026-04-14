# Find Subscription by MPN

**Category**: Subscriptions & Inventory  
**Use Case**: Look up customer account and subscription details using mobile phone number  
**Complexity**: Simple  
**Data Modification**: Read-only

## Business Context

When customers call support, the most common lookup is by Mobile Phone Number (MPN). This query finds the subscription record, inventory ID, customer account number, and current status.

## Tables Used

- `inventory` - Base subscription table
- `invproperty` - Subscription properties

## Key Property Keys

- `SNO` - Subscriber Number (Mobile Phone Number/MPN)
- `SUBSTATUS` - Subscription Status (ACTIVE, SUSPENDED, etc.)
- `SUBPROVSYS` - Provisioning System (O=OCS, H=HPIN)

## SQL Query

```sql
-- Find subscription by MPN (Mobile Phone Number)
SELECT i.inventoryid,           -- HUB Internal ID
       i.rootbuid,               -- Customer Account Number
       ip_mpn.propvalchar AS mpn,
       ip_status.propvalchar AS substatus,
       ip_provsys.propvalchar AS provisioning_system,
       i.dateactive,
       i.datedeactive
FROM inventory i
-- Join for MPN property
JOIN invproperty ip_mpn 
  ON i.inventoryid = ip_mpn.inventoryid 
  AND ip_mpn.propertykey = 'SNO'
  AND ip_mpn.propvalchar = :mpn   -- Replace with actual MPN
-- Join for subscription status
LEFT JOIN invproperty ip_status 
  ON i.inventoryid = ip_status.inventoryid 
  AND ip_status.propertykey = 'SUBSTATUS'
  AND ip_status.dateend IS NULL
-- Join for provisioning system
LEFT JOIN invproperty ip_provsys 
  ON i.inventoryid = ip_provsys.inventoryid 
  AND ip_provsys.propertykey = 'SUBPROVSYS'
  AND ip_provsys.dateend IS NULL
WHERE i.datedeactive IS NULL;    -- Active subscriptions only
```

## Simplified Version (Just find inventoryid)

```sql
-- Quick lookup: Just get inventory ID and account
SELECT i.inventoryid, i.rootbuid, ip.propvalchar AS mpn
FROM inventory i
JOIN invproperty ip ON i.inventoryid = ip.inventoryid
WHERE ip.propertykey = 'SNO'
  AND ip.propvalchar = '07666123456'  -- Replace with MPN
  AND i.datedeactive IS NULL;
```

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `:mpn` | Mobile Phone Number | 07666123456 |

## Example Output

```
INVENTORYID  ROOTBUID     MPN          SUBSTATUS  PROVISIONING_SYSTEM  DATEACTIVE   DATEDEACTIVE
-----------  -----------  -----------  ---------  -------------------  -----------  ------------
155166236    110364555    07666123456  ACTIVE     O                    2024-01-15   NULL
```

## Notes

- **SNO = Subscriber Number** in HUB terminology (commonly called MPN externally)
- Always filter `datedeactive IS NULL` for active subscriptions
- Use `dateend IS NULL` on properties to get current values
- If MPN returns no results, customer may have been deactivated (remove datedeactive filter)
- OCS provisioning = 'O', HPIN provisioning = 'H'

## Finding All Properties for Found Subscription

Once you have `inventoryid`, get all properties:

```sql
SELECT propertykey, propvalchar, propvalnumber, propvaldate
FROM invproperty
WHERE inventoryid = 155166236  -- From previous query
  AND dateend IS NULL
ORDER BY propertykey;
```

## Related Queries

- [ocs-subscriptions-with-iccid.md](ocs-subscriptions-with-iccid.md) - Find by SIM ICCID
- [ocs-subscriptions-with-imei.md](ocs-subscriptions-with-imei.md) - Find by device IMEI
- [active-subscriptions-with-tariff.md](active-subscriptions-with-tariff.md) - Include tariff details
