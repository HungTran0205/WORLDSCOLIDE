# OCS Subscriptions with ICCID

**Category**: Subscriptions & Inventory  
**Use Case**: Find OCS provisioned subscriptions with Netcracker ICCID (SIM card identifier)  
**Complexity**: Moderate  
**Data Modification**: Read-only

## Business Context

When troubleshooting SIM card issues or OCS provisioning, you need to find subscriptions by ICCID (Integrated Circuit Card Identifier). This query specifically targets OCS-provisioned subscriptions that have ICCID values populated.

OCS = Oracle Communications Session Controller (Netcracker provisioning system)

## Tables Used

- `invproperty` - Subscription properties (multiple joins for different properties)
- `inventory` - Base subscription table

## Key Property Keys

- `ICCIDSSN` - SIM Card ICCID (Integrated Circuit Card ID)
- `SUBPROVSYS` - Subscription Provisioning System (O=OCS, H=HPIN, B=Both)
- `SNO` - Subscriber Number (MPN)
- `SUBSTATUS` - Subscription Status

## SQL Query

```sql
-- Find OCS subscriptions with ICCID values
SELECT ip_iccid.propvalchar AS iccid,
       ip_provsys.propvalchar AS provisioning_system,
       ip_mpn.propvalchar AS mpn,
       ip_status.propvalchar AS subscription_status,
       i.rootbuid AS customer_account,
       i.inventoryid
FROM invproperty ip_iccid
-- Join for provisioning system
JOIN invproperty ip_provsys 
  ON ip_iccid.inventoryid = ip_provsys.inventoryid
  AND ip_provsys.propertykey = 'SUBPROVSYS'
  AND ip_provsys.propvalchar = 'O'        -- OCS only
  AND ip_provsys.dateend IS NULL
-- Join for MPN
JOIN invproperty ip_mpn
  ON ip_iccid.inventoryid = ip_mpn.inventoryid
  AND ip_mpn.propertykey = 'SNO'
-- Join for subscription status
JOIN invproperty ip_status
  ON ip_iccid.inventoryid = ip_status.inventoryid
  AND ip_status.propertykey = 'SUBSTATUS'
-- Join to inventory table
JOIN inventory i
  ON ip_iccid.inventoryid = i.inventoryid
WHERE ip_iccid.propertykey = 'ICCIDSSN'
  AND ip_iccid.propvalchar IS NOT NULL   -- Must have ICCID
ORDER BY ip_status.propvalchar DESC;
```

## Filter by Subscription Status

Add to WHERE clause:

```sql
-- Only active subscriptions
AND ip_status.propvalchar = 'ACTIVE'

-- Only specific statuses
AND ip_status.propvalchar IN ('ACTIVE', 'SUSPENDED')
```

## Find Specific ICCID

```sql
WHERE ip_iccid.propertykey = 'ICCIDSSN'
  AND ip_iccid.propvalchar = '8944501234567890123'  -- Your ICCID
  AND ip_provsys.propvalchar = 'O'
```

## Alternative Simplified Query

```sql
-- Simpler version focusing on active OCS subs
SELECT ip1.propvalchar AS iccid,
       ip2.propvalchar AS provsys,
       ip3.propvalchar AS mpn,
       i.dateactive,
       i.datedeactive
FROM invproperty ip1
JOIN invproperty ip2 ON ip1.inventoryid = ip2.inventoryid
JOIN invproperty ip3 ON ip1.inventoryid = ip3.inventoryid
JOIN inventory i ON ip1.inventoryid = i.inventoryid
WHERE ip1.propertykey = 'ICCIDSSN' 
  AND ip1.propvalchar IS NOT NULL
  AND ip2.propertykey = 'SUBPROVSYS' 
  AND ip2.propvalchar = 'O'
  AND ip3.propertykey = 'SNO'
  AND ip2.dateend IS NULL
  AND i.datedeactive IS NULL;
```

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `SUBPROVSYS` | Provisioning system | O (OCS), H (HPIN), B (Both) |
| `ICCIDSSN` | SIM ICCID value | 8944501234567890123 |

## Example Output

```
ICCID                    PROVISIONING_SYSTEM  MPN          SUBSCRIPTION_STATUS  CUSTOMER_ACCOUNT  INVENTORYID
-----------------------  -------------------  -----------  -------------------  ----------------  -----------
8944501234567890123      O                    07666123456  ACTIVE               110364555         155166236
8944509876543210987      O                    07777999888  SUSPENDED            110987654         155200100
```

## Notes

- **ICCIDSSN** = ICCID stored in HUB (typically 19-20 digit number on SIM card)
- **OCS provisioning** = 'O' in `SUBPROVSYS` property
- ICCID format: Usually starts with `89` (telecom industry identifier)
- Not all subscriptions have ICCID populated (depends on provisioning flow)
- Use `ip_provsys.dateend IS NULL` to get current provisioning system
- HPIN subscriptions use different property or no ICCID

## HPIN Subscriptions (Alternative)

For HPIN provisioned subscriptions:

```sql
WHERE ip_provsys.propvalchar = 'H'  -- HPIN instead of OCS
```

## Provisioning System Values

- `O` - OCS (Oracle Communications / Netcracker)
- `H` - HPIN (legacy provisioning)
- `B` - Both systems (migration state)

## Related Queries

- [find-subscription-by-mpn.md](find-subscription-by-mpn.md) - Find by mobile number
- [ocs-subscriptions-with-imei.md](ocs-subscriptions-with-imei.md) - Find by device IMEI
- [mpn-unbilled-cdrs-ocs.md](mpn-unbilled-cdrs-ocs.md) - OCS subs with unbilled usage
