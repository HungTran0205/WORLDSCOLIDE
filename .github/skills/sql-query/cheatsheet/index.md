# SQL Query Cheatsheet Index

> **Source**: [Confluence Cheatsheet - SQL Queries](https://hansentechnologies.atlassian.net/wiki/spaces/HTM/pages/543294900)  
> **Last Updated**: January 24, 2026

## Overview

Pre-validated queries for common use cases in Tesco Mobile HUB. Each query file includes:
- Business context and use case
- Tables and property keys used
- Annotated SQL with explanations
- Example output
- When to use / avoid

## Quick Navigation

**By Category**:
- [Subscriptions & Inventory](#subscriptions--inventory)
- [Service Orders](#service-orders)
- [Payments & Billing](#payments--billing)
- [Products & Tariffs](#products--tariffs)
- [Customers & Accounts](#customers--accounts)
- [Bundles & Discounts](#bundles--discounts)
- [CDR & Usage](#cdr--usage)
- [System & Administration](#system--administration)

---

## Subscriptions & Inventory

### Active Subscriptions

| Query | Description | File |
|-------|-------------|------|
| **Active subscriptions with tariff details** | Find subscriptions with current tariff, data/mins/SMS allowances | [active-subscriptions-with-tariff.md](active-subscriptions-with-tariff.md) |
| **Find subscription by MPN** | Lookup customer account by mobile phone number | [find-subscription-by-mpn.md](find-subscription-by-mpn.md) |
| **OCS subscriptions with ICCID** | Find OCS provisioned subscriptions with SIM ICCID | [ocs-subscriptions-with-iccid.md](ocs-subscriptions-with-iccid.md) |
| **OCS subscriptions with IMEI** | Find OCS subscriptions with device IMEI value | [ocs-subscriptions-with-imei.md](ocs-subscriptions-with-imei.md) |
| **Subscriptions with CCP bundles** | Find accounts with ClubCard Plus offers | [subscriptions-with-ccp-bundles.md](subscriptions-with-ccp-bundles.md) |
| **HFH eligible subscriptions** | Find subscriptions with Home From Home eligibility flags | [hfh-eligible-subscriptions.md](hfh-eligible-subscriptions.md) |

### Deal Types & Contracts

| Query | Description | File |
|-------|-------------|------|
| **Customers by deal type** | Identify customers on BAU, SIMO, AUSTANDARD, AUIMMEDIATE | [customers-by-deal-type.md](customers-by-deal-type.md) |
| **Deal type updated after date** | Find inventory with AUFREEDOM after specific date | [deal-type-updated-after-date.md](deal-type-updated-after-date.md) |
| **BAU out of contract** | Find BAU customers whose contract has expired | [bau-out-of-contract.md](bau-out-of-contract.md) |

---

## Service Orders

| Query | Description | File |
|-------|-------------|------|
| **Service orders by status** | Find SO by completion/in-progress/failed status | [service-orders-by-status.md](service-orders-by-status.md) |
| **SO with provision wait** | Orders stuck in provision wait status | [so-with-provision-wait.md](so-with-provision-wait.md) |
| **NC async requests in progress** | Netcracker async activate subscription SOs | [nc-async-in-progress.md](nc-async-in-progress.md) |
| **Inflight orders** | Orders in processing state | [inflight-orders.md](inflight-orders.md) |
| **Orders stuck in async** | Failed workflow sessions from async processing | [orders-stuck-in-async.md](orders-stuck-in-async.md) |
| **Deactivate account by treatment** | Find deactivation SOs by treatment process | [deactivate-by-treatment.md](deactivate-by-treatment.md) |

---

## Payments & Billing

| Query | Description | File |
|-------|-------------|------|
| **ReDs gateway status** | Find payment gateway transaction status | [reds-gateway-status.md](reds-gateway-status.md) |
| **Remove stored refund card** | Manually clear POTOKEN for stored cards | [remove-stored-refund-card.md](remove-stored-refund-card.md) |

---

## Products & Tariffs

### Device Products

| Query | Description | File |
|-------|-------------|------|
| **Devices by deal type** | Find devices by AUSTANDARD/AUFREEDOM/AUIMMEDIATE | [devices-by-deal-type.md](devices-by-deal-type.md) |
| **Device deal type lookup** | Get deal type for specific device product code | [device-deal-type-lookup.md](device-deal-type-lookup.md) |
| **Device from Oakwood by EAN** | Find HUB product from supplier EAN/SKU | [device-from-oakwood-ean.md](device-from-oakwood-ean.md) |
| **Device non-return price** | Get non-return price for device | [device-non-return-price.md](device-non-return-price.md) |

### Tariff Products

| Query | Description | File |
|-------|-------------|------|
| **Deal products (HUB/Magento)** | Tariff + Device + Bundles + Deal type | [deal-products-hub-magento.md](deal-products-hub-magento.md) |
| **HUB tariffs with bundles** | Find HUB tariff and associated bundle groups | [hub-tariffs-with-bundles.md](hub-tariffs-with-bundles.md) |
| **Magento tariffs with bundles** | Find Magento tariff and bundle associations | [magento-tariffs-with-bundles.md](magento-tariffs-with-bundles.md) |
| **Number of HUB tariffs** | Count active subscriptions per tariff | [count-hub-tariffs.md](count-hub-tariffs.md) |

---

## Customers & Accounts

| Query | Description | File |
|-------|-------------|------|
| **Find anonymized customers** | Customers with anonymized data (XXX name) | [anonymized-customers.md](anonymized-customers.md) |
| **Update customer MPN** | Change mobile phone number in database | [update-customer-mpn.md](update-customer-mpn.md) |
| **Customers after CR_02 script** | Accounts updated by device deal type script | [customers-after-cr02.md](customers-after-cr02.md) |
| **Account with subscription TBC** | Accounts with "To Be Confirmed" subscriptions | [account-subscription-tbc.md](account-subscription-tbc.md) |

---

## Bundles & Discounts

| Query | Description | File |
|-------|-------------|------|
| **Child bundles by group code** | Find child bundles within bundle group | [child-bundles-by-group.md](child-bundles-by-group.md) |

---

## CDR & Usage

| Query | Description | File |
|-------|-------------|------|
| **MPN with unbilled CDRs (OCS)** | Find OCS subscriptions with unbilled usage | [mpn-unbilled-cdrs-ocs.md](mpn-unbilled-cdrs-ocs.md) |
| **MPN with unbilled CDRs (HPIN)** | Find HPIN subscriptions with unbilled usage | [mpn-unbilled-cdrs-hpin.md](mpn-unbilled-cdrs-hpin.md) |
| **View CDRs loaded** | See loaded CDRs or usage errors from file | [view-cdrs-loaded.md](view-cdrs-loaded.md) |
| **View charge accumulator** | Query tchargeaccum for subscription | [view-charge-accumulator.md](view-charge-accumulator.md) |

---

## System & Administration

| Query | Description | File |
|-------|-------------|------|
| **Find HUB user** | Look up CareHUB user by email/username | [find-hub-user.md](find-hub-user.md) |
| **Update selfcare password** | Reset selfcare user to default password | [update-selfcare-password.md](update-selfcare-password.md) |
| **Backdate order date** | Move order date backwards using procedure | [backdate-order-date.md](backdate-order-date.md) |
| **Backdate tariffs** | Update product active dates | [backdate-tariffs.md](backdate-tariffs.md) |
| **Cancel service order** | Force SO status to CANCL/PRREJ/COMP | [cancel-service-order.md](cancel-service-order.md) |
| **Extend airtime to 36 months** | Update contract months (testing only) | [extend-airtime-36-months.md](extend-airtime-36-months.md) |

---

## How to Use

1. **Browse by category** to find relevant query
2. **Open query file** for full details and SQL
3. **Copy and modify** parameters for your use case
4. **Execute via SQLcl**: 
   ```
   mcp_sqlcl_-_sql_d_run-sql "YOUR_QUERY_HERE"
   ```

## Query Template Structure

Each query file contains:

```markdown
# Query Title

**Category**: [Category Name]  
**Use Case**: [When to use this query]  
**Complexity**: Simple | Moderate | Complex  
**Data Modification**: Read-only | Updates Data

## Business Context

[Explanation of why/when you need this query]

## Tables Used

- `table1` - Description
- `table2` - Description

## Key Property Keys

- `PROPERTYKEY1` - Meaning
- `PROPERTYKEY2` - Meaning

## SQL Query

```sql
-- Annotated query with explanations
SELECT ...
FROM ...
WHERE ...
```

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `:param1` | ... | ... |

## Example Output

[Sample result set]

## Notes

- Important considerations
- Gotchas or edge cases
- Performance tips

## Related Queries

- [Other relevant query]
```

---

**Contributing**: To add new queries, follow the template above and update this index.
