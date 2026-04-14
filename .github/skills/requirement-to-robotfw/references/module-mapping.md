# Module Mapping Reference

## Keyword-to-Module Mapping

| Keywords in Requirement | Target Module | Primary Keywords File |
|------------------------|---------------|----------------------|
| OWS, Order, createOrder, Oakwood | `OrderingWS/` | `OrderingWS_Keywords.robot` |
| SIM, eSIM, ICCID, SSN, Dispatch | `OrderingWS/` | `eSIM_*_Keywords.robot` |
| Care, Customer, Portal, Hub Net | `Care/` | `Care_Keywords.robot` |
| API, REST, endpoint, request, response | `API/` | `API_Keywords.robot` |
| Payment, Invoice, Credit, Balance | `Payments/` | `Payments_Keywords.robot` |
| Billing, EDR, CDR, Usage | `Billing/` | `Billing_Keywords.robot` |
| Batch, Job, Schedule, Process | `Batch/` | `Batch_Keywords.robot` |
| Netcracker, NC, Soft Reserve | `Commons/` | `MARS_Common_Keywords.robot` |
| SelfCare, MyAccount, Portal | `SelfCare/` | `SelfCare_Keywords.robot` |
| Treatment, Collection, Debt | `Treatments/` | `Treatments_Keywords.robot` |

## Module Detection Algorithm

```python
def detect_module(content: str) -> str:
    """Score-based module detection."""
    scores = {
        'OrderingWS': count_matches(content, ['OWS', 'Order', 'Oakwood', 'SIM', 'eSIM']),
        'Care': count_matches(content, ['Care', 'Customer', 'Portal', 'Hub Net']),
        'API': count_matches(content, ['API', 'REST', 'endpoint']),
        'Payments': count_matches(content, ['Payment', 'Invoice', 'Credit']),
        'Billing': count_matches(content, ['Billing', 'EDR', 'CDR']),
        'Batch': count_matches(content, ['Batch', 'Job', 'Schedule']),
    }
    return max(scores, key=scores.get)
```

## Existing Keywords Search

Before generating, search for reusable keywords:

```
# Search patterns
grep -r "Given.*Order" tests/OrderingWS/*_Keywords.robot
grep -r "When.*Process" tests/Commons/*_Keywords.robot
grep -r "Then.*Should" tests/{Module}/*_Keywords.robot
```

## Output Path Template

```
ccb-hu-tm-automation-robotfw/
└── tests/
    └── {Module}/
        ├── {Jira-ID}_Test.robot
        └── {Jira-ID}_Keywords.robot
```

**Example for HTM-34762 (OWS/Oakwood content):**
```
ccb-hu-tm-automation-robotfw/
└── tests/
    └── OrderingWS/
        ├── HTM-34762_Test.robot
        └── HTM-34762_Keywords.robot
```
