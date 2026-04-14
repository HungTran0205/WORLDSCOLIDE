# ReDs Gateway Payment Status

**Category**: Payments & Billing  
**Use Case**: Check payment gateway transaction status and troubleshoot failed payments  
**Complexity**: Simple  
**Data Modification**: Read-only

## Business Context

ReDs is the payment gateway used for processing card payments. This query tracks payment requests and responses to:
- Verify payment was sent to gateway
- Check gateway response status
- Troubleshoot failed transactions
- Find gateway request ID for support tickets

## Tables Used

- `paymentgtwrequest` - Payment gateway requests sent from HUB
- `paymentgtwresponse` - Responses received from payment gateway

## Key Columns

### paymentgtwrequest
- `paymentgtwrequestid` - Unique request ID
- `createtimestamp` - When request was created
- `action` - Payment action (AUTHORIZE, CAPTURE, REFUND, etc.)
- `amount` - Transaction amount
- `division` - Business division
- `saleschannel` - Sales channel origin

### paymentgtwresponse
- `status` - Response status from gateway
- `gatewayrequestid` - Gateway's internal request ID (starts with 4xxxxxxxxxx for ReDs Test)
- `gatewaystatus` - Gateway-specific status code

## SQL Query (Summary View)

```sql
-- Get latest payment gateway transactions (last 24 hours)
SELECT preq.paymentgtwrequestid,
       preq.createtimestamp,
       preq.action,
       preq.amount,
       preq.division,
       preq.saleschannel,
       pres.status AS response_status,
       pres.gatewayrequestid,
       pres.gatewaystatus
FROM paymentgtwrequest preq
LEFT JOIN paymentgtwresponse pres 
  ON preq.paymentgtwrequestid = pres.paymentgtwrequestid
WHERE preq.createtimestamp > SYSDATE - 1  -- Last 1 day
ORDER BY preq.createtimestamp DESC;
```

## Extended Time Range

```sql
-- Last 10 days of transactions
WHERE preq.createtimestamp > SYSDATE - 10
```

## Full Details Query

```sql
-- Get ALL columns from both tables
SELECT preq.*,
       pres.*
FROM paymentgtwrequest preq
LEFT JOIN paymentgtwresponse pres 
  ON preq.paymentgtwrequestid = pres.paymentgtwrequestid
WHERE preq.createtimestamp > SYSDATE - 1
ORDER BY preq.createtimestamp DESC;
```

## Filter by Specific Request ID

```sql
WHERE preq.paymentgtwrequestid = 123456789
```

## Filter by Gateway Status

```sql
WHERE pres.gatewaystatus = 'APPROVED'
-- or
WHERE pres.status = 'SUCCESS'
```

## Filter Failed Transactions

```sql
WHERE pres.status IN ('FAILED', 'ERROR', 'DECLINED')
   OR pres.status IS NULL  -- No response received
```

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `SYSDATE - n` | Days to look back | SYSDATE - 7 (last week) |
| `action` | Payment action type | AUTHORIZE, CAPTURE, REFUND |
| `amount` | Transaction amount | 25.00 |

## Example Output

```
PAYMENTGTWREQUESTID  CREATETIMESTAMP      ACTION     AMOUNT  DIVISION  SALESCHANNEL  RESPONSE_STATUS  GATEWAYREQUESTID  GATEWAYSTATUS
-------------------  -------------------  ---------  ------  --------  ------------  ---------------  ----------------  -------------
987654321            2026-01-24 10:15:23  AUTHORIZE  25.00   RETAIL    WEB           SUCCESS          410000414793      APPROVED
987654320            2026-01-24 09:30:11  CAPTURE    10.00   RETAIL    CARE          SUCCESS          410000414792      APPROVED
987654319            2026-01-24 08:45:00  REFUND     15.50   RETAIL    WEB           FAILED           410000414791      DECLINED
```

## Notes

- **GATEWAYREQUESTID** starting with `410000...` indicates **ReDs Test environment**
- **LEFT JOIN** ensures you see requests even without responses (failed to send)
- **createtimestamp**: Uses `SYSDATE - n` where n = number of days to look back
- NULL `response_status` = No response received from gateway (network/timeout issue)
- Common actions: AUTHORIZE (hold funds), CAPTURE (take funds), REFUND (return funds)

## Gateway Status Values

| Status | Meaning |
|--------|---------|
| APPROVED | Payment successful |
| DECLINED | Card declined by bank |
| ERROR | Technical error |
| PENDING | Awaiting response |

## Troubleshooting

**No response received** (pres.status IS NULL):
```sql
SELECT preq.*
FROM paymentgtwrequest preq
WHERE NOT EXISTS (
  SELECT 1 FROM paymentgtwresponse pres
  WHERE pres.paymentgtwrequestid = preq.paymentgtwrequestid
)
AND preq.createtimestamp > SYSDATE - 1;
```

**Find by order ID** (if stored in additional columns):
Check for order reference in other `paymentgtwrequest` columns.

## Environment Detection

- **Test**: `gatewayrequestid` starts with `410000`
- **Production**: `gatewayrequestid` starts with different prefix (check with team)

## Related Queries

- [remove-stored-refund-card.md](remove-stored-refund-card.md) - Clear stored payment tokens
- Receipt queries - Link payments to receipts
