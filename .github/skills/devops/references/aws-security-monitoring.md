# AWS Security & Monitoring Reference

Security (IAM, VPC, encryption, threat detection) and observability (CloudWatch, X-Ray, cost) patterns.

---

## IAM

### Users, Groups, Roles

```bash
# Create user + add to group
aws iam create-user --user-name alice
aws iam create-group --group-name developers
aws iam add-user-to-group --user-name alice --group-name developers
aws iam attach-group-policy --group-name developers \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

# Create role (trust policy allows EC2 to assume it)
aws iam create-role --role-name AppRole \
  --assume-role-policy-document file://trust-policy.json

# Assume role (returns temporary credentials)
aws sts assume-role --role-arn arn:aws:iam::123456789012:role/AppRole \
  --role-session-name my-session
```

> **Best practice:** Use IAM roles over long-lived user credentials. Assign roles to EC2/ECS/Lambda rather than embedding access keys. Rotate access keys immediately if leaked.

---

### Policies

**Managed vs Inline:** AWS-managed policies are reusable and AWS-maintained. Customer-managed policies are reusable but you maintain them. Inline policies are embedded in a single identity — avoid except for strict one-to-one permission bindings.

**Policy JSON structure:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadS3Objects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "StringEquals": { "s3:prefix": ["uploads/"] }
      }
    }
  ]
}
```

**Common example policies:**

```json
// Lambda invoke
{ "Effect": "Allow", "Action": "lambda:InvokeFunction",
  "Resource": "arn:aws:lambda:us-east-1:123456789012:function:my-fn" }

// DynamoDB per-table
{ "Effect": "Allow",
  "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:Query"],
  "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable" }
```

```bash
# Attach managed policy to role
aws iam attach-role-policy --role-name AppRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Test with policy simulator
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:role/AppRole \
  --action-names s3:GetObject \
  --resource-arns arn:aws:s3:::my-bucket/file.txt
```

---

### Permission Boundaries

A permission boundary caps the maximum permissions an identity policy can grant. Used to safely delegate admin (e.g., let a team create roles, but never grant permissions beyond the boundary).

```bash
# Attach boundary to role — effective permissions = identity policy ∩ boundary
aws iam put-role-permissions-boundary --role-name DevRole \
  --permissions-boundary arn:aws:iam::123456789012:policy/DevBoundary

# Attach boundary to user
aws iam put-user-permissions-boundary --user-name alice \
  --permissions-boundary arn:aws:iam::123456789012:policy/DevBoundary
```

**Effective permissions = identity policy ∩ permission boundary** (AND of both — neither alone is sufficient to allow an action).

---

### IRSA — IAM Roles for Service Accounts (EKS)

IRSA lets Kubernetes pods assume IAM roles without node-level credentials.

```bash
# 1. Associate OIDC provider with cluster
eksctl utils associate-iam-oidc-provider \
  --region us-east-1 --cluster my-cluster --approve

# 2. Get OIDC issuer URL
OIDC=$(aws eks describe-cluster --name my-cluster \
  --query "cluster.identity.oidc.issuer" --output text)

# 3. Create trust policy (web identity)
cat > irsa-trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::123456789012:oidc-provider/${OIDC#https://}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "${OIDC#https://}:sub": "system:serviceaccount:default:my-sa"
      }
    }
  }]
}
EOF

# 4. Create IAM role with trust policy
aws iam create-role --role-name EKSPodRole --assume-role-policy-document file://irsa-trust.json
aws iam attach-role-policy --role-name EKSPodRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# 5. Annotate Kubernetes service account
kubectl annotate serviceaccount my-sa -n default \
  eks.amazonaws.com/role-arn=arn:aws:iam::123456789012:role/EKSPodRole
```

Pod automatically receives temporary credentials via projected token volume. No AWS credentials in pod spec.

---

## VPC Security

### Subnets

- **Public subnet:** Route table has `0.0.0.0/0 → Internet Gateway`. Resources get public IPs.
- **Private subnet:** Route table has `0.0.0.0/0 → NAT Gateway`. Resources have no public IPs; egress via NAT.
- Distribute across ≥2 AZs for HA. NAT Gateway is per-AZ — create one per AZ for fault isolation.

```bash
aws ec2 create-nat-gateway --subnet-id subnet-public-id \
  --allocation-id <eip-alloc-id>
# Then update private route table:
aws ec2 create-route --route-table-id rtb-private \
  --destination-cidr-block 0.0.0.0/0 --nat-gateway-id nat-xxxxx
```

---

### Security Groups

Stateful — return traffic is automatically allowed. Attach to ENIs (EC2, RDS, Lambda VPC, ALB).

```bash
# Create SG
aws ec2 create-security-group --group-name web-sg \
  --description "Web tier" --vpc-id vpc-xxxxx

# Ingress rules
aws ec2 authorize-security-group-ingress --group-id sg-web \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-web \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# SG chaining: allow app tier only from ALB SG (not CIDR)
aws ec2 authorize-security-group-ingress --group-id sg-app \
  --protocol tcp --port 8080 --source-group sg-alb

# Allow DB tier only from app SG
aws ec2 authorize-security-group-ingress --group-id sg-db \
  --protocol tcp --port 5432 --source-group sg-app
```

**Common pattern (3-tier):**

| SG | Inbound | From |
|----|---------|------|
| `sg-alb` | 80, 443 | `0.0.0.0/0` |
| `sg-app` | 8080 | `sg-alb` |
| `sg-db` | 5432/3306 | `sg-app` |

---

### NACLs

Stateless — must explicitly allow both request and response (including ephemeral ports 1024–65535).

```bash
aws ec2 create-network-acl-entry --network-acl-id acl-xxxxx \
  --rule-number 100 --protocol tcp --rule-action allow \
  --ingress --cidr-block 0.0.0.0/0 --port-range From=443,To=443
```

| Feature | Security Groups | NACLs |
|---------|----------------|-------|
| State | Stateful | Stateless |
| Applies to | ENI | Subnet |
| Rules | Allow only | Allow + Deny |
| Evaluation | All rules | Ordered by rule number |
| Use for | Fine-grained per-resource | Subnet-level block/allow (e.g., block IP ranges) |

---

### VPC Endpoints

```bash
# Gateway endpoint — S3 (free, stays in AWS network)
aws ec2 create-vpc-endpoint --vpc-id vpc-xxxxx \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids rtb-private

# Interface endpoint — Secrets Manager (ENI-based, ~$7/mo/AZ)
aws ec2 create-vpc-endpoint --vpc-id vpc-xxxxx \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.us-east-1.secretsmanager \
  --subnet-ids subnet-private-1 subnet-private-2 \
  --security-group-ids sg-endpoint
```

**When to use:** Private subnets accessing S3/DynamoDB → gateway endpoints (free, no NAT cost). For compliance requiring traffic never leave AWS backbone → interface endpoints.

---

### VPC Flow Logs

```bash
# Enable flow logs → CloudWatch Logs
aws ec2 create-flow-logs --resource-type VPC \
  --resource-ids vpc-xxxxx \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/flowlogs \
  --deliver-logs-permission-arn arn:aws:iam::123456789012:role/FlowLogsRole

# Query rejected traffic with Athena (after S3 destination)
# CREATE EXTERNAL TABLE vpc_flow_logs (...)
# SELECT srcaddr, dstaddr, dstport, action, COUNT(*) AS cnt
# FROM vpc_flow_logs WHERE action = 'REJECT'
# GROUP BY srcaddr, dstaddr, dstport ORDER BY cnt DESC LIMIT 20;
```

---

## Encryption

### KMS

```bash
# Create CMK (customer-managed key)
aws kms create-key --description "App encryption key" \
  --key-usage ENCRYPT_DECRYPT

# Create alias
aws kms create-alias --alias-name alias/app-key \
  --target-key-id <key-id>

# Enable automatic yearly rotation
aws kms enable-key-rotation --key-id alias/app-key

# Encrypt / decrypt
aws kms encrypt --key-id alias/app-key \
  --plaintext "my-secret" --output text --query CiphertextBlob | \
  base64 --decode > encrypted.bin

aws kms decrypt --ciphertext-blob fileb://encrypted.bin \
  --output text --query Plaintext | base64 --decode
```

**CMK vs AWS-managed keys:** CMK = you control key policy, rotation, deletion. AWS-managed = AWS creates/manages per-service (e.g., `aws/s3`), no custom key policies, free.

---

### Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret --name prod/db/password \
  --secret-string '{"username":"admin","password":"s3cr3t"}'

# Get secret value
aws secretsmanager get-secret-value --secret-id prod/db/password \
  --query SecretString --output text

# Enable automatic rotation (RDS native)
aws secretsmanager rotate-secret --secret-id prod/db/password \
  --rotation-rules AutomaticallyAfterDays=30
```

**Python (boto3):**
```python
import boto3, json
client = boto3.client("secretsmanager")
secret = json.loads(client.get_secret_value(SecretId="prod/db/password")["SecretString"])
```

**Node.js:**
```js
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const secret = JSON.parse((await new SecretsManagerClient({}).send(
  new GetSecretValueCommand({ SecretId: "prod/db/password" }))).SecretString);
```

**Secrets Manager vs Parameter Store:**

| Feature | Secrets Manager | Parameter Store (SecureString) |
|---------|----------------|-------------------------------|
| Encryption | KMS (always) | KMS (optional) |
| Auto rotation | Yes (Lambda) | No |
| Cost | ~$0.40/secret/mo | Free (standard), $0.05/10K API |
| Versioning | Yes (AWSCURRENT/AWSPREVIOUS) | Yes |
| Size limit | 65KB | 8KB (standard) / 8KB (advanced) |
| RDS native rotation | Yes | No |

---

## Audit & Threat Detection

### CloudTrail

```bash
# Create multi-region trail → S3
aws cloudtrail create-trail --name org-trail \
  --s3-bucket-name my-cloudtrail-bucket \
  --is-multi-region-trail \
  --enable-log-file-validation

aws cloudtrail start-logging --name org-trail

# Enable data events (S3 object-level, Lambda invokes)
aws cloudtrail put-event-selectors --trail-name org-trail \
  --event-selectors '[{"ReadWriteType":"All","IncludeManagementEvents":true,
    "DataResources":[{"Type":"AWS::S3::Object","Values":["arn:aws:s3"]}]}]'
```

**Athena query examples (after Glue crawler on S3 bucket):**

```sql
-- Who deleted an S3 object?
SELECT eventtime, useridentity.arn, requestparameters
FROM cloudtrail_logs
WHERE eventsource = 's3.amazonaws.com' AND eventname = 'DeleteObject'
  AND eventtime > '2026-01-01'
ORDER BY eventtime DESC LIMIT 50;

-- All API calls from a suspicious IP
SELECT eventtime, eventname, eventsource, errorcode
FROM cloudtrail_logs
WHERE sourceipaddress = '1.2.3.4'
ORDER BY eventtime DESC;
```

**CloudTrail Lake:** Managed event store — query without S3/Glue setup. Retention up to 7 years.

---

### GuardDuty

```bash
# Enable (per region)
aws guardduty create-detector --enable --finding-publishing-frequency FIFTEEN_MINUTES

# List findings
aws guardduty list-findings --detector-id <id> \
  --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}'
```

**Finding types:** `UnauthorizedAccess:IAMUser/MaliciousIPCaller`, `Recon:EC2/PortProbeUnprotectedPort`, `Exfiltration:S3/ObjectRead.Unusual`

**Auto-remediation pattern:** GuardDuty finding → EventBridge rule → Lambda → isolate EC2 (remove SG, attach deny-all), notify SNS.

```bash
# Suppress findings (known-good patterns)
aws guardduty create-filter --detector-id <id> \
  --name suppress-pentest --action ARCHIVE \
  --finding-criteria '{"Criterion":{"service.action.networkConnectionAction.remoteIpDetails.ipAddressV4":{"Equals":["10.0.0.5"]}}}'
```

---

## Monitoring

### CloudWatch Logs

```bash
# Create log group with retention
aws logs create-log-group --log-group-name /app/api
aws logs put-retention-policy --log-group-name /app/api \
  --retention-in-days 30

# Filter pattern (errors only)
aws logs filter-log-events --log-group-name /app/api \
  --filter-pattern "ERROR" --start-time $(date -d '1 hour ago' +%s000)

# Subscription filter → Lambda for real-time processing
aws logs put-subscription-filter --log-group-name /app/api \
  --filter-name errors-to-lambda --filter-pattern "ERROR" \
  --destination-arn arn:aws:lambda:us-east-1:123456789012:function:log-processor
```

**CloudWatch Agent (EC2):** Install via SSM: `amazon-cloudwatch-agent-config-wizard` → generates `config.json` → `/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start`.

---

### CloudWatch Metrics & Alarms

```bash
# Publish custom metric
aws cloudwatch put-metric-data \
  --namespace MyApp --metric-name OrdersProcessed \
  --value 42 --dimensions Environment=prod

# Create alarm (p99 latency > 1000ms for 3 consecutive 5-min periods)
aws cloudwatch put-metric-alarm \
  --alarm-name high-latency \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic p99 --period 300 --evaluation-periods 3 \
  --threshold 1.0 --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:alerts \
  --dimensions Name=LoadBalancer,Value=app/my-alb/xxx

# Composite alarm (alert only when both CPU high AND error rate high)
aws cloudwatch put-composite-alarm \
  --alarm-name composite-critical \
  --alarm-rule "ALARM(high-cpu) AND ALARM(high-errors)"
```

---

### CloudWatch Dashboards

```bash
# Create dashboard from JSON definition
aws cloudwatch put-dashboard --dashboard-name AppOverview \
  --dashboard-body file://dashboard.json
```

```json
{
  "widgets": [
    { "type": "metric", "properties": {
        "title": "Lambda Errors", "period": 60,
        "metrics": [["AWS/Lambda","Errors","FunctionName","my-fn"]],
        "stat": "Sum", "view": "timeSeries" }},
    { "type": "log", "properties": {
        "title": "Error Logs", "query": "fields @message | filter @message like /ERROR/",
        "logGroupNames": ["/app/api"] }},
    { "type": "text", "properties": { "markdown": "## App Overview\nLast updated: auto" }}
  ]
}
```

---

### CloudWatch Log Insights

```bash
aws logs start-query \
  --log-group-name /app/api \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 50'
```

**Useful queries:**

```
# Error rate by minute
fields @timestamp
| filter @message like /ERROR/
| stats count(*) as errors by bin(1m)
| sort @timestamp asc

# Latency percentiles
fields @timestamp, duration
| filter ispresent(duration)
| stats avg(duration), pct(duration,50), pct(duration,95), pct(duration,99) by bin(5m)

# Top 10 slowest endpoints
fields @timestamp, path, duration
| filter ispresent(path)
| stats avg(duration) as avg_ms by path
| sort avg_ms desc | limit 10

# Lambda cold starts
fields @timestamp, @message
| filter @message like /Init Duration/
| parse @message "Init Duration: * ms" as init_ms
| stats count(*) as cold_starts, avg(init_ms) as avg_init_ms by bin(1h)
```

---

### Container Insights

```bash
# Enable for ECS cluster
aws ecs update-cluster-settings --cluster my-cluster \
  --settings name=containerInsights,value=enabled

# Enable for EKS (CloudWatch agent via Helm)
helm repo add aws-observability https://aws.github.io/eks-charts
helm install aws-cloudwatch-metrics aws-observability/aws-cloudwatch-metrics \
  --namespace amazon-cloudwatch --create-namespace \
  --set clusterName=my-cluster
```

Metrics collected: CPU/memory/network/disk per task, service, cluster. Generates `PerformanceInsights` log events queryable via Log Insights. Pre-built Container Insights dashboard available in CloudWatch console.

---

### X-Ray Tracing

```bash
# Lambda: enable active tracing
aws lambda update-function-configuration \
  --function-name my-fn --tracing-config Mode=Active
```

**Python SDK instrumentation:**

```python
from aws_xray_sdk.core import xray_recorder, patch_all
patch_all()  # auto-patches boto3, requests, SQLAlchemy

@xray_recorder.capture("process_order")
def process_order(order_id: str):
    xray_recorder.current_segment().put_annotation("order_id", order_id)
    xray_recorder.current_segment().put_metadata("debug", {"raw": order_id})
    with xray_recorder.in_subsegment("db_query"):
        # DB call here
        pass
```

**Sampling rule (reduce cost — trace 5% of requests):**

```bash
aws xray create-sampling-rule --sampling-rule '{
  "RuleName": "LowTrafficSampling",
  "Priority": 9000, "FixedRate": 0.05, "ReservoirSize": 5,
  "ServiceName": "*", "ServiceType": "*",
  "Host": "*", "HTTPMethod": "*", "URLPath": "*", "ResourceARN": "*"
}'
```

Service map shows inter-service call graph. Annotations are indexed and filterable; metadata is not.

---

## Cost Management

### Cost Explorer

```bash
# Monthly cost by service
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Cost by tag (requires tag cost allocation enabled)
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY --metrics BlendedCost \
  --group-by Type=TAG,Key=Environment

# 3-month forecast
aws ce get-cost-forecast \
  --time-period Start=2026-03-01,End=2026-06-01 \
  --granularity MONTHLY --metric BLENDED_COST
```

---

### Budgets

```bash
# Create $500/month budget with 80% alert → SNS
aws budgets create-budget --account-id 123456789012 --budget '{
  "BudgetName": "monthly-500",
  "BudgetLimit": {"Amount": "500", "Unit": "USD"},
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}' --notifications-with-subscribers '[{
  "Notification": {
    "NotificationType": "ACTUAL",
    "ComparisonOperator": "GREATER_THAN",
    "Threshold": 80, "ThresholdType": "PERCENTAGE"
  },
  "Subscribers": [{"SubscriptionType": "SNS",
    "Address": "arn:aws:sns:us-east-1:123456789012:billing-alerts"}]
}]'
```

Auto-remediation: attach SCP via Organizations to deny resource creation when budget breached (Lambda triggered by SNS → apply SCP).

---

### Savings Plans & Reserved Instances

| Type | Commitment | Flexibility | Best For |
|------|-----------|-------------|----------|
| Compute Savings Plan | 1 or 3 yr, $/hr | Any EC2, Fargate, Lambda | Mixed/variable workloads |
| EC2 Instance RI | 1 or 3 yr | Specific instance family + region | Steady-state EC2 |
| RDS RI | 1 or 3 yr | Specific DB engine + class | Steady-state RDS |

**Compute Savings Plan** is the most flexible — applies across regions, instance families, and even Lambda/Fargate. Start with Cost Explorer's savings recommendations (90-day lookback) before purchasing.
