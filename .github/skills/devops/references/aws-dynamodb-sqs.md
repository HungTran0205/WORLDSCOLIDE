# AWS DynamoDB + SQS/SNS

---

## DynamoDB

### Table Design

- **PK (Partition key)** — hashed to select storage partition; must spread load evenly
- **SK (Sort key)** — range dimension within partition; enables prefix/range queries
- **Convention:** entity-type prefix + `#` — `USER#123`, `ORDER#456`

```bash
# PK only, on-demand
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Composite PK+SK, provisioned
aws dynamodb create-table \
  --table-name Orders \
  --attribute-definitions \
      AttributeName=userId,AttributeType=S \
      AttributeName=orderId,AttributeType=S \
  --key-schema \
      AttributeName=userId,KeyType=HASH \
      AttributeName=orderId,KeyType=RANGE \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

| | On-Demand | Provisioned |
|-|-----------|-------------|
| Use case | Spiky / unpredictable traffic | Steady, high-throughput workloads |
| Scaling | Instant, automatic | Manual or Auto Scaling (minutes lag) |
| Cost model | Per request (higher unit cost) | Per RCU/WCU (cheaper at sustained scale) |

---

### CRUD Operations

```bash
# put-item
aws dynamodb put-item --table-name Users \
  --item '{"userId":{"S":"u1"},"name":{"S":"Alice"},"age":{"N":"30"}}'

# get-item
aws dynamodb get-item --table-name Users --key '{"userId":{"S":"u1"}}'

# update-item — SET (overwrite) + REMOVE (delete attr) + ADD (increment) in one expression
aws dynamodb update-item --table-name Users \
  --key '{"userId":{"S":"u1"}}' \
  --update-expression "SET #n = :name REMOVE tempFlag ADD loginCount :one" \
  --expression-attribute-names '{"#n":"name"}' \
  --expression-attribute-values '{":name":{"S":"Alicia"},":one":{"N":"1"}}'
# DELETE verb removes element from a set attribute: "DELETE roles :r"

# delete-item
aws dynamodb delete-item --table-name Users --key '{"userId":{"S":"u1"}}'
```

UpdateExpression verbs: `SET` (write/overwrite), `REMOVE` (delete attribute), `ADD` (increment number or union set), `DELETE` (subtract from set).

---

### Query vs Scan

```bash
# query — efficient; requires known partition key
aws dynamodb query --table-name Orders \
  --key-condition-expression "userId = :uid AND begins_with(orderId, :p)" \
  --expression-attribute-values '{":uid":{"S":"u1"},":p":{"S":"2024-"}}' \
  --limit 20 --exclusive-start-key '{"userId":{"S":"u1"},"orderId":{"S":"LAST_KEY"}}'

# scan — full table read; FilterExpression applied after read (still costs RCU for all items)
aws dynamodb scan --table-name Orders \
  --filter-expression "#s = :v" \
  --expression-attribute-names '{"#s":"status"}' \
  --expression-attribute-values '{":v":{"S":"ACTIVE"}}'
```

Pagination: response has `LastEvaluatedKey`; pass as `--exclusive-start-key` on next call.

**Rule:** use `query` when partition key is known. Use `scan` only on small tables or offline/batch jobs.

---

### Global Secondary Index (GSI)

Max **20 GSIs** per table. Can be added to existing tables. Projection types: `ALL`, `KEYS_ONLY`, `INCLUDE`.

```bash
# Add GSI to existing table
aws dynamodb update-table \
  --table-name Orders \
  --attribute-definitions AttributeName=status,AttributeType=S \
  --global-secondary-index-updates '[{"Create":{
    "IndexName":"status-index",
    "KeySchema":[{"AttributeName":"status","KeyType":"HASH"}],
    "Projection":{"ProjectionType":"ALL"},
    "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
  }}]'

# Query GSI
aws dynamodb query \
  --table-name Orders --index-name status-index \
  --key-condition-expression "#s = :v" \
  --expression-attribute-names '{"#s":"status"}' \
  --expression-attribute-values '{":v":{"S":"PENDING"}}'
```

---

### Local Secondary Index (LSI)

Must be defined **at table creation**  cannot be added later. Same partition key; alternate sort key. Shares table capacity.

| | LSI | GSI |
|-|-----|-----|
| Creation | Table creation only | Anytime |
| Partition key | Same as table | Any attribute |
| Capacity | Shared with table | Own RCU/WCU |

```bash
aws dynamodb create-table --table-name Orders \
  --attribute-definitions \
      AttributeName=userId,AttributeType=S \
      AttributeName=orderId,AttributeType=S \
      AttributeName=status,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=orderId,KeyType=RANGE \
  --local-secondary-indexes '[{"IndexName":"status-lsi","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"status","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST
```

---

### DynamoDB Streams

Ordered log of item-level changes; 24-hour retention. View types: `KEYS_ONLY`, `NEW_IMAGE`, `OLD_IMAGE`, `NEW_AND_OLD_IMAGES`.

```bash
# Enable stream
aws dynamodb update-table --table-name Orders \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES

# Lambda trigger (change data capture)
aws lambda create-event-source-mapping \
  --function-name ProcessChanges \
  --event-source-arn arn:aws:dynamodb:us-east-1:123456789012:table/Orders/stream/2024-01-01T00:00:00.000 \
  --starting-position LATEST --batch-size 100
```

Use cases: audit logging, real-time aggregations, cross-region replication, search index updates.

---

### TTL

```bash
aws dynamodb update-time-to-live --table-name Sessions \
  --time-to-live-specification Enabled=true,AttributeName=expiresAt
```

Items deleted **within 48 hours** of expiry epoch. No RCU/WCU consumed. Use cases: session expiry, token cleanup, soft-delete windows.

---

### DAX (DynamoDB Accelerator)

In-memory write-through cache; reads drop to **microseconds**. SDK: swap `boto3.resource('dynamodb')` for `amazondax.AmazonDaxClient` — same API surface. Cache miss falls through to DynamoDB.

```bash
aws dax create-cluster --cluster-name my-dax --node-type dax.r5.large \
  --replication-factor 3 --iam-role-arn arn:aws:iam::123456789012:role/DAXRole \
  --subnet-group-name my-subnet-group
```

---

### Single-Table Design

One table stores multiple entity types. PK/SK overloaded with entity-type prefixes.

```
PK            SK                 type     attributes
USER#u1       METADATA           user     {name, email}
USER#u1       ORDER#2024-01-10   order    {total, status}
USER#u1       ORDER#2024-01-15   order    {total, status}
PRODUCT#p1    METADATA           product  {name, price}
ORDER#o1      ITEM#i1            lineItem {qty, price}
```

**Patterns:**
- **Entity prefix**  avoids key collisions (`USER#`, `ORDER#`, `PRODUCT#`)
- **GSI reverse lookup**  `GSI1PK=ORDER#o1`, `GSI1SK=USER#u1` to query by order ID
- **Access-pattern-driven design**  model starts from queries, not entities
- **Overloaded indexes**  same GSI serves multiple entity type access patterns

---

## SQS

### Standard vs FIFO

| | Standard | FIFO |
|-|----------|------|
| Ordering | Best-effort | Strict FIFO per message group |
| Deduplication | None | 5-minute dedup window |
| Throughput | Unlimited | 3,000/s (batching), 300/s otherwise |
| Cost | Lower | ~10% higher |
| Naming | Any | Must end in `.fifo` |
| Use case | High throughput, order-agnostic | Financial, inventory, ordered workflows |

---

### Queue Operations

```bash
QURL=https://sqs.us-east-1.amazonaws.com/123456789012/my-queue

aws sqs create-queue --queue-name my-queue
aws sqs create-queue --queue-name my-queue.fifo \
  --attributes ContentBasedDeduplication=true,FifoQueue=true

aws sqs send-message --queue-url $QURL \
  --message-body '{"event":"order.placed","orderId":"o1"}'

# Long-poll (up to 20s) — use to reduce empty responses
aws sqs receive-message --queue-url $QURL \
  --max-number-of-messages 10 --wait-time-seconds 20

aws sqs delete-message --queue-url $QURL --receipt-handle "AQEBwJn..."
aws sqs purge-queue --queue-url $QURL
aws sqs get-queue-attributes --queue-url $QURL --attribute-names All
```

---

### Visibility Timeout

Message hides for the timeout duration after receive (default **30s**); reappears if not deleted. Use `change-message-visibility` as a heartbeat to extend mid-processing.

```bash
# Set queue default
aws sqs set-queue-attributes --queue-url $QURL --attributes VisibilityTimeout=300
# Extend per-message mid-processing
aws sqs change-message-visibility --queue-url $QURL --receipt-handle "AQEBwJn..." --visibility-timeout 60
```

---

### Dead-Letter Queue (DLQ)

```bash
aws sqs create-queue --queue-name my-queue-dlq
DLQ_ARN=$(aws sqs get-queue-attributes --queue-url .../my-queue-dlq \
  --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
# Redrive policy: send to DLQ after 3 failed receives
aws sqs set-queue-attributes --queue-url .../my-queue \
  --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"$DLQ_ARN\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}"}
# Replay DLQ messages back to source
aws sqs start-message-move-task --source-arn "$DLQ_ARN" \
  --destination-arn arn:aws:sqs:us-east-1:123456789012:my-queue
```

---

### Lambda Trigger for SQS

```bash
aws lambda create-event-source-mapping \
  --function-name ProcessOrders \
  --event-source-arn arn:aws:sqs:us-east-1:123456789012:my-queue \
  --batch-size 10 \
  --maximum-batching-window-in-seconds 5 \
  --function-response-types ReportBatchItemFailures
```

| Setting | Notes |
|---------|-------|
| `batch-size` | 110,000 messages per invocation |
| `maximum-batching-window-in-seconds` | Wait up to N seconds to fill batch |
| `ReportBatchItemFailures` | Return failed message IDs; others are deleted |

**Partial failure response:**
```json
{ "batchItemFailures": [{ "itemIdentifier": "<messageId>" }] }
```

---

## SNS

### Topics & Subscriptions

```bash
# Create topic
aws sns create-topic --name OrderEvents

# Subscribe (SQS, Lambda, email)
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:OrderEvents \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:123456789012:inventory-queue

# Publish with message attribute for filtering
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:123456789012:OrderEvents \
  --message '{"orderId":"o1"}' \
  --message-attributes '{"eventType":{"DataType":"String","StringValue":"order.placed"}}'

# Subscription filter policy
aws sns set-subscription-attributes \
  --subscription-arn arn:aws:sns:us-east-1:123456789012:OrderEvents:abc-123 \
  --attribute-name FilterPolicy \
  --attribute-value '{"eventType":["order.placed"]}'
```

---

### Fan-Out Pattern

SNS publishes once  multiple SQS queues receive independently for parallel processing.

```
         +----------------------+
         |   SNS: OrderEvents   |
         +----------+-----------+
          +----------+----------+
          v          v          v
   [inventory-q] [billing-q] [shipping-q]
        Lambda      Lambda      Lambda
      (stock adj) (invoice)  (dispatch)
```

Each subscriber can have a **filter policy** to receive only relevant event types. Publishers decouple from consumers; failures in one consumer do not affect others.

---

## Decision Matrix

| Need | Choose |
|------|--------|
| Key-value, millisecond reads, auto-scaling | DynamoDB |
| Complex queries, joins, ACID transactions | RDS (Aurora / PostgreSQL) |
| Microsecond reads, read-heavy caching | DAX or ElastiCache |
| Full-text search, aggregations | OpenSearch |
| Time-series metrics / IoT | Timestream |
| Async decoupling, at-least-once delivery | SQS Standard |
| Ordered, exactly-once processing | SQS FIFO |
| One-to-many broadcast / fan-out | SNS |
| Real-time streaming with replay | Kinesis Data Streams |
| Blob / object storage | S3 |
