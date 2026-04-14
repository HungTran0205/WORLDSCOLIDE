# AWS Lambda Basics

## Handler Patterns

### Python

```python
import json, os
from typing import Any

def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        body = json.loads(event.get("body") or "{}")
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"method": event["httpMethod"], "received": body}),
        }
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
```

### Node.js (ESM, Node 18+)

```javascript
// index.mjs
export const handler = async (event, context) => {
    const payload = event.body ? JSON.parse(event.body) : {};
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: event.httpMethod, received: payload }),
    };
};
```

### Java

```java
import com.amazonaws.services.lambda.runtime.*;
import com.amazonaws.services.lambda.runtime.events.*;

public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context ctx) {
        ctx.getLogger().log("Request: " + event.getHttpMethod());
        return new APIGatewayProxyResponseEvent()
            .withStatusCode(200)
            .withBody("{\"path\":\"" + event.getPath() + "\"}");
    }
}
```

---

## Event Sources

### API Gateway REST (proxy integration)
```json
{ "httpMethod": "POST", "path": "/items", "queryStringParameters": {"page":"1"},
  "body": "{\"name\":\"widget\"}", "isBase64Encoded": false }
```

### API Gateway HTTP API (v2)
```json
{ "version": "2.0", "routeKey": "POST /items",
  "requestContext": { "http": { "method": "POST", "path": "/items" } },
  "body": "{\"name\":\"widget\"}" }
```

### S3 Object Created
```json
{ "Records": [{ "eventSource": "aws:s3", "eventName": "ObjectCreated:Put",
  "s3": { "bucket": {"name": "my-bucket"}, "object": {"key": "uploads/file.csv", "size": 1024} } }] }
```

### SQS Message Batch
```json
{ "Records": [{ "messageId": "abc-123", "body": "{\"order_id\":42}",
  "eventSource": "aws:sqs",
  "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:my-queue" }] }
```

### EventBridge Scheduled Rule
```json
{ "source": "aws.events", "detail-type": "Scheduled Event",
  "time": "2026-03-12T00:00:00Z", "detail": {} }
```

### DynamoDB Streams Insert
```json
{ "Records": [{ "eventSource": "aws:dynamodb", "eventName": "INSERT",
  "dynamodb": { "NewImage": { "id": {"S":"42"}, "status": {"S":"active"} } } }] }
```

---

## Context Object

```python
def handler(event, context):
    print(context.function_name)                    # "my-function"
    print(context.memory_limit_in_mb)               # "256"
    print(context.aws_request_id)                   # unique invocation ID
    print(context.log_group_name)                   # "/aws/lambda/my-function"
    print(context.get_remaining_time_in_millis())   # e.g. 28400
    print(context.invoked_function_arn)             # full ARN
```

---

## Environment Variables

```bash
# Set via CLI
aws lambda update-function-configuration \
  --function-name my-function \
  --environment "Variables={DB_HOST=db.example.com,LOG_LEVEL=info}"
```

```python
import os
db_host = os.environ["DB_HOST"]
log_level = os.environ.get("LOG_LEVEL", "warning")
```

```javascript
const dbHost = process.env.DB_HOST;
```

**Reserved (read-only):** `AWS_REGION`, `AWS_LAMBDA_FUNCTION_NAME`, `AWS_LAMBDA_FUNCTION_VERSION`, `AWS_LAMBDA_FUNCTION_MEMORY_SIZE`, `_HANDLER`

---

## Lambda Layers

```bash
# 1. Package for Python
mkdir -p python/lib/python3.12/site-packages
pip install requests -t python/lib/python3.12/site-packages/
zip -r layer.zip python/

# 2. Publish
aws lambda publish-layer-version \
  --layer-name my-deps --zip-file fileb://layer.zip \
  --compatible-runtimes python3.12

# 3. Attach (use ARN from output)
aws lambda update-function-configuration \
  --function-name my-function \
  --layers arn:aws:lambda:us-east-1:123456789012:layer:my-deps:1
```

**Common uses:** shared libraries (`requests`, `pydantic`), DB drivers (`psycopg2`), custom runtimes (`bootstrap` binary), shared certs/config.

---

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Resources:
  ExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: my-function
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt ExecutionRole.Arn
      Architectures: [arm64]
      MemorySize: 256
      Timeout: 30
      Environment:
        Variables:
          LOG_LEVEL: info
      Code:
        S3Bucket: my-deployment-bucket
        S3Key: my-function.zip

  HttpApi:
    Type: AWS::ApiGatewayV2::Api
    Properties: { Name: my-api, ProtocolType: HTTP }

  Integration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref HttpApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub
        arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${MyFunction.Arn}/invocations
      PayloadFormatVersion: "2.0"

  Route:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref HttpApi
      RouteKey: "ANY /{proxy+}"
      Target: !Sub "integrations/${Integration}"

  Stage:
    Type: AWS::ApiGatewayV2::Stage
    Properties: { ApiId: !Ref HttpApi, StageName: "$default", AutoDeploy: true }

  LambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref MyFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${HttpApi}/*"

Outputs:
  ApiUrl:
    Value: !Sub "https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com"
```

---

## Terraform Lambda Resource

```hcl
resource "aws_iam_role" "lambda_exec" {
  name = "my-function-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" },
      Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "logs" {
  name              = "/aws/lambda/my-function"
  retention_in_days = 14
}

resource "aws_lambda_function" "my_function" {
  function_name    = "my-function"
  runtime          = "python3.12"
  handler          = "index.handler"
  role             = aws_iam_role.lambda_exec.arn
  filename         = "my-function.zip"
  source_code_hash = filebase64sha256("my-function.zip")
  architectures    = ["arm64"]
  memory_size      = 256
  timeout          = 30
  environment { variables = { LOG_LEVEL = "info" } }
}

resource "aws_apigatewayv2_api" "http_api" {
  name = "my-api"; protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.my_function.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.http_api.id; name = "$default"; auto_deploy = true
}

resource "aws_lambda_permission" "apigw" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*"
}

output "api_url" { value = aws_apigatewayv2_stage.default.invoke_url }
```

---

## CloudWatch Logging

```python
import json, logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(json.dumps({                    # structured JSON log
        "request_id": context.aws_request_id,
        "event": "order_processed",
        "order_id": event.get("order_id"),
    }))
```

**Log Insights queries:**
```sql
-- Error rate
fields @timestamp | filter @message like /ERROR/ | stats count(*) by bin(5m)

-- Cold start detection
fields @initDuration | filter @type = "REPORT" and ispresent(@initDuration)
  | stats avg(@initDuration) as avg_cold_start by bin(1h)

-- P99 duration
fields @duration | stats pct(@duration, 99) as p99 by bin(1h)
```

---

## Error Handling

```python
class AppError(Exception):
    def __init__(self, msg: str, status: int = 500):
        self.message, self.status_code = msg, status

def handler(event, context):
    try:
        return {"statusCode": 200, "body": json.dumps(process(event))}
    except AppError as e:
        return {"statusCode": e.status_code, "body": json.dumps({"error": e.message})}
    except Exception:
        logger.exception("Unhandled error")
        return {"statusCode": 500, "body": json.dumps({"error": "Internal server error"})}
```

**Dead-letter queue (SQS):**
```bash
aws lambda update-function-configuration \
  --function-name my-function \
  --dead-letter-config TargetArn=arn:aws:sqs:us-east-1:123456789012:my-dlq
```

| Error | Cause | Fix |
|---|---|---|
| Task timed out | Exceeded timeout limit | Increase timeout or optimize code |
| Error 137 (OOM) | Out of memory | Increase `MemorySize` |
| AccessDeniedException | Missing IAM permission | Attach required policy |
| Runtime.ImportModuleError | Missing dependency | Add to package or layer |

---

## Cold Starts

Cold starts occur when Lambda must initialize a new execution environment (download package  start runtime  run init code outside handler).

| Strategy | Effect | Notes |
|---|---|---|
| **Provisioned Concurrency** | Eliminates cold starts | Extra cost; use on latency-critical functions |
| **SnapStart** | ~10x faster init (Java) | Snapshots post-init JVM; restore on invoke |
| **ARM64 / Graviton** | Faster init + 20% cheaper | Change `--architectures arm64` |
| **Smaller package** | Faster download + load | Layers for deps; strip dev artifacts |
| **Avoid VPC** | Remove ~500 ms ENI setup | Use VPC only if private DB access required |
| **Lazy global init** | Reduce init phase | Defer DB connections; lazy-load heavy modules |

```bash
# Provisioned Concurrency
aws lambda put-provisioned-concurrency-config \
  --function-name my-function --qualifier prod \
  --provisioned-concurrent-executions 5

# SnapStart (Java - enable on publish)
aws lambda update-function-configuration \
  --function-name my-java-fn --snap-start ApplyOn=PublishedVersions
```

---

## ARM64 / Graviton2

```bash
# Switch to arm64 (20% cheaper, equal or better throughput)
aws lambda update-function-configuration \
  --function-name my-function --architectures arm64

# Container image for arm64
docker buildx build --platform linux/arm64 -t my-lambda:arm64 .
```

- **Drop-in compatible:** Python, Node.js, Ruby, Go
- **Must recompile:** Native C/C++/Rust extensions - build for `aarch64-linux`
- **Limitation:** SnapStart not available on arm64 (as of 2026)

---

## Function URLs

Direct HTTPS endpoint for Lambda - no API Gateway needed.

```bash
# Create public URL
aws lambda create-function-url-config \
  --function-name my-function --auth-type NONE \
  --cors '{"AllowOrigins":["*"],"AllowMethods":["GET","POST"],"AllowHeaders":["Content-Type"]}'

# Allow public invocations (required for NONE auth)
aws lambda add-permission \
  --function-name my-function \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" --function-url-auth-type NONE

# Get endpoint URL
aws lambda get-function-url-config \
  --function-name my-function --query FunctionUrl --output text
# -> https://<id>.lambda-url.<region>.on.aws/
```

| Auth Type | Use Case |
|---|---|
| `NONE` | Public webhooks, unauthenticated APIs |
| `AWS_IAM` | Internal service-to-service (SigV4 signed requests) |
