# AWS Lambda Advanced

## Lambda@Edge

Runs Lambda at **CloudFront edge locations** (200+ PoPs). Reduces latency by executing close to the user.

**Use cases:** A/B testing, URL rewriting, auth at edge, geo-routing, header manipulation.

| Event | Trigger | Memory | Timeout |
|---|---|---|---|
| `viewer-request` | Before cache check | 128 MB | 5s |
| `viewer-response` | After cache response | 128 MB | 5s |
| `origin-request` | Cache miss  before origin | 128 MB | 30s |
| `origin-response` | After origin response | 128 MB | 30s |

```javascript
// viewer-request handler  auth check + URL normalization
export const handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    if (request.uri !== "/" && request.uri.endsWith("/"))
        request.uri = request.uri.slice(0, -1);

    if (!headers["x-api-key"]?.[0]?.value)
        return { status: "401", statusDescription: "Unauthorized", body: "Missing API key" };

    return request;
};
```

```bash
# Must deploy in us-east-1; associate versioned ARN with CloudFront behavior
aws lambda publish-version --function-name my-edge-fn --region us-east-1
```

**Limitations:** `us-east-1` only. No VPC. No env vars (viewer events). No layers (viewer events).

---

## CloudFront Functions

Sub-millisecond execution. **JavaScript (ES5.1) only**  no npm, no network calls.

```javascript
function handler(event) {
    var uri = event.request.uri;
    event.request.uri = uri.toLowerCase();
    if (uri.endsWith("/")) event.request.uri += "index.html";
    return event.request;
}
```

**Comparison:**

| Feature | CloudFront Functions | Lambda@Edge |
|---|---|---|
| Runtime | JS ES5.1 | Node.js, Python |
| Memory | 2 MB | 128 MB |
| Timeout | 1ms | 5s viewer / 30s origin |
| Network access | No | Yes (origin events) |
| Env variables | No | Yes |
| Package size | 10 KB | 1 MB zip |
| Pricing | $0.10/1M | $0.60/1M + compute |
| Events | viewer req/res only | All 4 types |

---

## Provisioned Concurrency

Eliminates cold starts by keeping instances **pre-initialized**.

```bash
aws lambda put-provisioned-concurrency-config \
  --function-name my-function --qualifier prod \
  --provisioned-concurrent-executions 10

# Auto-scale at 70% utilization
aws application-autoscaling put-scaling-policy \
  --policy-name pc-tracking --service-namespace lambda \
  --resource-id function:my-function:prod \
  --scalable-dimension lambda:function:ProvisionedConcurrency \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration \
    '{"TargetValue":0.7,"PredefinedMetricSpecification":{"PredefinedMetricType":"LambdaProvisionedConcurrencyUtilization"}}'
```

~$0.015/GB-hour always charged. Use only for latency-sensitive prod paths; skip for batch/async/dev.

---

## Step Functions

Orchestrate Lambda workflows via **Amazon States Language (ASL)**.

```json
{
  "Comment": "Order processing pipeline",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:validate-order",
      "Next": "ProcessPayment",
      "Retry": [{ "ErrorEquals": ["Lambda.ServiceException"], "MaxAttempts": 3, "IntervalSeconds": 2 }],
      "Catch": [{ "ErrorEquals": ["States.ALL"], "Next": "OrderFailed", "ResultPath": "$.error" }]
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:process-payment",
      "Next": "FulfillOrder"
    },
    "FulfillOrder": {
      "Type": "Parallel",
      "Branches": [
        { "StartAt": "SendEmail", "States": { "SendEmail": { "Type": "Task", "Resource": "arn:aws:lambda:us-east-1:123456789012:function:send-email", "End": true } } },
        { "StartAt": "UpdateInventory", "States": { "UpdateInventory": { "Type": "Task", "Resource": "arn:aws:lambda:us-east-1:123456789012:function:update-inventory", "End": true } } }
      ],
      "Next": "OrderComplete"
    },
    "OrderComplete": { "Type": "Succeed" },
    "OrderFailed": { "Type": "Fail", "Error": "OrderError" }
  }
}
```

```bash
aws stepfunctions create-state-machine --name order-pipeline \
  --definition file://state-machine.json \
  --role-arn arn:aws:iam::123456789012:role/StepFunctionsRole --type STANDARD
```

**Standard** (1 year, exactly-once, audit log) vs **Express** (5 min, at-least-once, high throughput, cheaper).

---

## Lambda Powertools

```bash
pip install aws-lambda-powertools
```

```python
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.utilities.idempotency import idempotent, DynamoDBPersistenceLayer

logger = Logger(service="order-service")
tracer = Tracer(service="order-service")
metrics = Metrics(namespace="OrderService", service="order-service")
app = APIGatewayRestResolver()

@app.get("/orders/<order_id>")
@tracer.capture_method
def get_order(order_id: str):
    logger.info("Fetching order", extra={"order_id": order_id})
    metrics.add_metric(name="OrderFetch", unit=MetricUnit.Count, value=1)
    return {"orderId": order_id, "status": "CONFIRMED"}

@logger.inject_lambda_context(correlation_id_path="requestContext.requestId")
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event, context):
    return app.resolve(event, context)

# Idempotency  safe retries via DynamoDB
persistence = DynamoDBPersistenceLayer(table_name="IdempotencyTable")

@idempotent(persistence_store=persistence)
def process_payment(event, context):
    return charge(event["paymentId"])
```

---

## Dead-Letter Queues & Destinations

```bash
# Attach SQS DLQ (catches failed async invocations after 2 retries)
aws lambda update-function-configuration --function-name my-fn \
  --dead-letter-config TargetArn=arn:aws:sqs:us-east-1:123456789012:my-fn-dlq

# Prefer on-failure destinations (richer payload + more targets)
aws lambda put-function-event-invoke-config --function-name my-fn \
  --destination-config \
    '{"OnFailure":{"Destination":"arn:aws:sqs:us-east-1:123456789012:failures"},"OnSuccess":{"Destination":"arn:aws:sns:us-east-1:123456789012:success"}}'
```

| | DLQ | On-Failure Destination |
|---|---|---|
| Payload | Original event | Event + execution metadata |
| Targets | SQS, SNS | SQS, SNS, Lambda, EventBridge |
| Event source mappings | No | Yes |

---

## Event Filtering

Filter at the **event source mapping** level  Lambda only invoked when patterns match.

```bash
aws lambda update-event-source-mapping --uuid <mapping-uuid> \
  --filter-criteria '{
    "Filters": [{
      "Pattern": "{\"body\":{\"eventType\":[\"ORDER_CREATED\"],\"amount\":[{\"numeric\":[\">\",100]}]}}"
    }]
  }'
```

Common patterns: exact match `["ACTIVE"]`, prefix `[{"prefix":"usr-"}]`, numeric range `[{"numeric":[">=",80]}]`, exists check `[{"exists":true}]`, DynamoDB new image `{"dynamodb":{"NewImage":{"status":{"S":["PENDING"]}}}}`.

---

## Container Images

Package Lambda as a Docker image (up to **10 GB**).

```dockerfile
FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ${LAMBDA_TASK_ROOT}/
CMD ["app.handler"]
```

```bash
aws ecr get-login-password | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t my-lambda .
docker tag my-lambda:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-lambda-repo:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-lambda-repo:latest

aws lambda create-function --function-name my-container-fn \
  --package-type Image \
  --code ImageUri=123456789012.dkr.ecr.us-east-1.amazonaws.com/my-lambda-repo:latest \
  --role arn:aws:iam::123456789012:role/lambda-role
```

---

## SnapStart (Java)

Snapshot memory after init, restore on cold start. **~10x cold start reduction** (3s  ~200ms).

```bash
aws lambda update-function-configuration --function-name my-java-fn \
  --snap-start ApplyOn=PublishedVersions
aws lambda publish-version --function-name my-java-fn
```

Supported: Java 11, 17, 21. Avoid caching open network connections or unique IDs at init  implement `CacheInterface` hooks for restore-safe state.

---

## VPC Lambda

Required for accessing **private resources** (RDS, ElastiCache, internal ALB).

```bash
aws lambda update-function-configuration --function-name my-fn \
  --vpc-config SubnetIds=subnet-aaa,subnet-bbb,SecurityGroupIds=sg-12345
```

Use private subnets + NAT Gateway for internet outbound. Add **VPC Endpoints** for AWS services (S3, DynamoDB, SQS) to skip NAT costs. ENI warm pool (since 2020) eliminates most cold start penalty; use provisioned concurrency for the remainder.

---

## Performance Tuning

**Memory  CPU:** Linear relationship. 1,792 MB = 1 vCPU; 3,584 MB = 2 vCPUs.

```bash
# Power Tuning  Step Functions state machine finds optimal memory
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:123456789012:stateMachine:powerTuningStateMachine \
  --input '{"lambdaARN":"arn:aws:lambda:us-east-1:123456789012:function:my-fn","num":50,"payload":{},"strategy":"cost"}'

# Node.js  esbuild bundle, exclude runtime-provided AWS SDK v3
esbuild src/index.ts --bundle --platform=node --target=node20 --external:@aws-sdk/* --outfile=dist/index.js
```

```javascript
// Connection reuse  module-level, survives warm invocations
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";
const client = new DynamoDBClient({
    requestHandler: new NodeHttpHandler({ httpsAgent: new https.Agent({ keepAlive: true }) })
});
```

---

## Monitoring

| Metric | What it tracks |
|---|---|
| `Invocations` | Total calls (includes throttles) |
| `Duration` | Execution time (p50/p99) |
| `Errors` | Unhandled exceptions |
| `Throttles` | Requests rejected at concurrency limit |
| `ConcurrentExecutions` | In-flight executions |
| `InitDuration` | Cold start initialization time |

```bash
aws cloudwatch put-metric-alarm --alarm-name lambda-errors \
  --metric-name Errors --namespace AWS/Lambda \
  --dimensions Name=FunctionName,Value=my-fn \
  --period 60 --evaluation-periods 2 --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --statistic Sum --alarm-actions arn:aws:sns:us-east-1:123456789012:alerts

aws lambda update-function-configuration --function-name my-fn --tracing-config Mode=Active
```

**EMF custom metrics** free  parsed by CloudWatch directly from structured log output (see Powertools `metrics.add_metric()`).

---

## Terraform Modules for Lambda

```hcl
module "lambda_function" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "my-api-handler"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 30
  source_path   = "${path.module}/src"

  environment_variables = {
    TABLE_NAME = var.dynamodb_table_name
    ENV        = var.environment
  }

  attach_policy_json = true
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"]
      Resource = var.dynamodb_table_arn
    }]
  })

  provisioned_concurrent_executions = var.environment == "prod" ? 5 : -1
  tags = var.tags
}

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = "my-api"
  protocol_type = "HTTP"
  integrations = {
    "ANY /{proxy+}" = {
      lambda_arn             = module.lambda_function.lambda_function_invoke_arn
      payload_format_version = "2.0"
    }
  }
}

resource "aws_lambda_permission" "api_gw" {
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_function.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.apigatewayv2_api_execution_arn}/*"
}

variable "environment"         { type = string }
variable "dynamodb_table_name" { type = string }
variable "dynamodb_table_arn"  { type = string }
variable "tags"                { type = map(string); default = {} }

output "function_arn" { value = module.lambda_function.lambda_function_arn }
output "api_endpoint" { value = module.api_gateway.apigatewayv2_api_api_endpoint }
```
