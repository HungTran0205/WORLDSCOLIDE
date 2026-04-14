# AWS Services — Quick Reference

Practical CLI reference for common AWS services. Each section shows the most useful `aws` CLI commands.

---

## 1. Amazon EC2

### Launch Instance
```bash
# Launch t3.micro from Amazon Linux 2023 AMI
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --key-name my-key-pair \
  --security-group-ids sg-0abc123 \
  --subnet-id subnet-0abc123 \
  --count 1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=my-server}]'

# With user data script
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --user-data file://init.sh \
  --iam-instance-profile Name=EC2InstanceProfile
```

### Security Groups
```bash
# Create security group
aws ec2 create-security-group \
  --group-name web-sg --description "Web traffic" --vpc-id vpc-0abc123

# Allow inbound HTTP/HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-0abc123 --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress \
  --group-id sg-0abc123 --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress \
  --group-id sg-0abc123 --protocol tcp --port 22 --cidr 10.0.0.0/8

# Revoke rule
aws ec2 revoke-security-group-ingress \
  --group-id sg-0abc123 --protocol tcp --port 22 --cidr 10.0.0.0/8
```

### Instance Lifecycle & Key Pairs
```bash
# Key pair
aws ec2 create-key-pair --key-name my-key --query 'KeyMaterial' --output text > my-key.pem
chmod 400 my-key.pem

# Start / stop / terminate
aws ec2 start-instances   --instance-ids i-0abc123
aws ec2 stop-instances    --instance-ids i-0abc123
aws ec2 terminate-instances --instance-ids i-0abc123

# Elastic IP
aws ec2 allocate-address --domain vpc
aws ec2 associate-address --instance-id i-0abc123 --allocation-id eipalloc-0abc123

# List instances (running)
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].[InstanceId,PublicIpAddress,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

### Instance Types Cheat Sheet

| Family | Types | Use Case |
|--------|-------|----------|
| General | t3, t4g, m6i | Web, app servers |
| Compute | c6i, c7g | CPU-intensive workloads |
| Memory | r6i, x2idn | Databases, caching |
| Storage | i3, d3 | High IOPS, MapReduce |
| GPU | p4d, g5 | ML training, rendering |

---

## 2. Amazon ECS / Fargate

### Cluster & Task Definition
```bash
# Create cluster
aws ecs create-cluster --cluster-name prod-cluster

# Register task definition (Fargate)
aws ecs register-task-definition --cli-input-json file://task-def.json
```

**task-def.json**
```json
{
  "family": "web-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "containerDefinitions": [{
    "name": "app",
    "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/web-app:latest",
    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
    "environment": [{"name": "ENV", "value": "prod"}],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/web-app",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
```

### Service Operations
```bash
# Create service with ALB
aws ecs create-service \
  --cluster prod-cluster \
  --service-name web-svc \
  --task-definition web-app:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0abc,subnet-0def],securityGroups=[sg-0abc],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=8080"

# Update (rolling deploy)
aws ecs update-service --cluster prod-cluster --service web-svc \
  --task-definition web-app:2 --force-new-deployment

# Auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/prod-cluster/web-svc \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 --max-capacity 10

# Inspect tasks
aws ecs list-tasks    --cluster prod-cluster --service-name web-svc
aws ecs describe-tasks --cluster prod-cluster --tasks <task-arn>
```

---

## 3. AWS App Runner

```bash
# Deploy from ECR image
aws apprunner create-service \
  --service-name my-api \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "123456789.dkr.ecr.us-east-1.amazonaws.com/my-api:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {"Port": "8080"}
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::123456789:role/AppRunnerECRAccessRole"
    }
  }' \
  --instance-configuration 'Cpu=1 vCPU,Memory=2 GB'

# Auto-scaling config
aws apprunner create-auto-scaling-configuration \
  --auto-scaling-configuration-name prod-scale \
  --max-concurrency 100 --min-size 2 --max-size 10

# Custom domain
aws apprunner associate-custom-domain \
  --service-arn arn:aws:apprunner:us-east-1:123:service/my-api/abc \
  --domain-name api.example.com

# Update (redeploy)
aws apprunner start-deployment \
  --service-arn arn:aws:apprunner:us-east-1:123:service/my-api/abc
```

---

## 4. Amazon S3

```bash
# Bucket operations
aws s3 mb s3://my-bucket --region us-east-1
aws s3 rb s3://my-bucket --force          # Delete non-empty bucket

# Upload / download / list
aws s3 cp file.txt s3://my-bucket/
aws s3 cp s3://my-bucket/file.txt ./
aws s3 ls s3://my-bucket --recursive --human-readable

# Sync directory
aws s3 sync ./dist s3://my-bucket --delete --cache-control "max-age=86400"

# Presigned URL (expires 1 hour)
aws s3 presign s3://my-bucket/file.txt --expires-in 3600

# Versioning & website hosting
aws s3api put-bucket-versioning \
  --bucket my-bucket --versioning-configuration Status=Enabled
aws s3 website s3://my-bucket --index-document index.html --error-document error.html
```

---

## 5. Amazon RDS / Aurora

### Create & Manage
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier prod-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password MySecurePass123 \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-0abc123 \
  --db-subnet-group-name my-subnet-group \
  --backup-retention-period 7 \
  --no-publicly-accessible

# Create Aurora cluster (PostgreSQL-compatible)
aws rds create-db-cluster \
  --db-cluster-identifier prod-aurora \
  --engine aurora-postgresql \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password MySecurePass123 \
  --vpc-security-group-ids sg-0abc123 \
  --db-subnet-group-name my-subnet-group

aws rds create-db-instance \
  --db-instance-identifier prod-aurora-writer \
  --db-cluster-identifier prod-aurora \
  --db-instance-class db.r6g.large \
  --engine aurora-postgresql
```

### Snapshots & Read Replicas
```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier prod-db \
  --db-snapshot-identifier prod-db-snap-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier prod-db-restored \
  --db-snapshot-identifier prod-db-snap-20240101 \
  --db-instance-class db.t3.micro

# Read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier prod-db-replica \
  --source-db-instance-identifier prod-db

# Describe / wait
aws rds describe-db-instances --db-instance-identifier prod-db \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]' --output text
aws rds wait db-instance-available --db-instance-identifier prod-db
```

---

## 6. AWS Lambda

```bash
# Create function
aws lambda create-function \
  --function-name my-func \
  --runtime python3.12 \
  --role arn:aws:iam::123456789:role/lambda-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 --memory-size 256

# Update function code
aws lambda update-function-code \
  --function-name my-func --zip-file fileb://function.zip

# Invoke (sync)
aws lambda invoke --function-name my-func \
  --payload '{"key":"value"}' --cli-binary-format raw-in-base64-out response.json

# Add SQS event source
aws lambda create-event-source-mapping \
  --function-name my-func \
  --event-source-arn arn:aws:sqs:us-east-1:123:my-queue \
  --batch-size 10

# Layers & env vars
aws lambda update-function-configuration \
  --function-name my-func \
  --layers arn:aws:lambda:us-east-1:123:layer:my-layer:1 \
  --environment "Variables={DB_HOST=rds.example.com,LOG_LEVEL=INFO}"

aws lambda list-functions --query 'Functions[*].[FunctionName,Runtime,LastModified]' --output table
```

---

## 7. Amazon DynamoDB

```bash
# Create table with GSI
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[{
    "IndexName": "email-index",
    "KeySchema": [{"AttributeName":"email","KeyType":"HASH"}],
    "Projection": {"ProjectionType":"ALL"}
  }]'

# CRUD operations
aws dynamodb put-item --table-name Users \
  --item '{"userId":{"S":"u1"},"email":{"S":"user@example.com"},"name":{"S":"Alice"}}'

aws dynamodb get-item --table-name Users \
  --key '{"userId":{"S":"u1"}}'

aws dynamodb update-item --table-name Users \
  --key '{"userId":{"S":"u1"}}' \
  --update-expression "SET #n = :val" \
  --expression-attribute-names '{"#n":"name"}' \
  --expression-attribute-values '{":val":{"S":"Alice Smith"}}'

# Query with GSI
aws dynamodb query --table-name Users \
  --index-name email-index \
  --key-condition-expression "email = :e" \
  --expression-attribute-values '{":e":{"S":"user@example.com"}}'

aws dynamodb scan --table-name Users \
  --filter-expression "begins_with(userId, :prefix)" \
  --expression-attribute-values '{":prefix":{"S":"u"}}'
```

---

## 8. Amazon SQS / SNS

### SQS
```bash
# Create standard / FIFO queue
aws sqs create-queue --queue-name my-queue
aws sqs create-queue --queue-name my-queue.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true

# Send, receive, delete
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123/my-queue \
  --message-body '{"event":"order.created","orderId":"42"}'

aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123/my-queue \
  --max-number-of-messages 10 --wait-time-seconds 20

aws sqs delete-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123/my-queue \
  --receipt-handle <receipt-handle>
```

### SNS
```bash
# Create topic and subscribe
aws sns create-topic --name my-topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123:my-topic \
  --protocol email --notification-endpoint team@example.com

# SQS subscription (fan-out)
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123:my-topic \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:123:my-queue

# Publish
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:123:my-topic \
  --subject "Alert" \
  --message "Deployment completed successfully"
```

---

## 9. Amazon CloudFront

```bash
# Create distribution (simplified)
aws cloudfront create-distribution \
  --origin-domain-name my-bucket.s3.amazonaws.com \
  --default-root-object index.html

# From JSON config
aws cloudfront create-distribution \
  --distribution-config file://cf-distribution.json

# Invalidate cache (deploy flush)
aws cloudfront create-invalidation \
  --distribution-id E1ABCDEF12345 \
  --paths "/*"

aws cloudfront create-invalidation \
  --distribution-id E1ABCDEF12345 \
  --paths "/api/*" "/static/app.js"

# List distributions
aws cloudfront list-distributions \
  --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output table
```

---

## 10. Amazon Route 53

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name example.com \
  --caller-reference "$(date +%s)"

# List hosted zones
aws route53 list-hosted-zones \
  --query 'HostedZones[*].[Name,Id]' --output table

# Upsert A record (change batch JSON)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "1.2.3.4"}]
      }
    }]
  }'

# Health check
aws route53 create-health-check \
  --caller-reference "$(date +%s)" \
  --health-check-config \
    "Type=HTTPS,FullyQualifiedDomainName=api.example.com,Port=443,ResourcePath=/health"

# Alias record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "my-alb-1234.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

---

## 11. Amazon ECR

```bash
# Create repository
aws ecr create-repository \
  --repository-name my-app \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS \
    --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag my-app:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest
docker push        123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest

# Pull image
docker pull 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest

# Lifecycle policy (keep last 10 images)
aws ecr put-lifecycle-policy \
  --repository-name my-app \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {"tagStatus": "any", "countType": "imageCountMoreThan", "countNumber": 10},
      "action": {"type": "expire"}
    }]
  }'

# List images / describe findings
aws ecr list-images --repository-name my-app
aws ecr describe-image-scan-findings \
  --repository-name my-app --image-id imageTag=latest
```

---

## 12. AWS Elastic Beanstalk

```bash
# Initialize (run once in project root)
eb init my-app --platform "Python 3.11" --region us-east-1

# Create environment
eb create prod-env \
  --instance-type t3.small \
  --min-instances 2 \
  --max-instances 6 \
  --elb-type application

# Deploy current directory
eb deploy prod-env

# Open app in browser
eb open prod-env

# Logs and SSH
eb logs prod-env
eb ssh  prod-env

# Scaling and env vars
aws elasticbeanstalk update-environment \
  --environment-name prod-env \
  --option-settings \
    Namespace=aws:autoscaling:asg,OptionName=MinSize,Value=2 \
    Namespace=aws:autoscaling:asg,OptionName=MaxSize,Value=10 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=LOG_LEVEL,Value=INFO

# Terminate environment
eb terminate prod-env --force
```

---

## 13. Quick Reference Table

| Service | Primary Command Prefix | Common Operations |
|---------|----------------------|-------------------|
| EC2 | `aws ec2` | `run-instances`, `stop-instances`, `describe-instances` |
| ECS | `aws ecs` | `create-cluster`, `register-task-definition`, `update-service` |
| App Runner | `aws apprunner` | `create-service`, `start-deployment`, `associate-custom-domain` |
| S3 | `aws s3` / `aws s3api` | `cp`, `sync`, `mb`, `presign`, `put-bucket-versioning` |
| RDS / Aurora | `aws rds` | `create-db-instance`, `create-db-snapshot`, `restore-db-instance-from-db-snapshot` |
| Lambda | `aws lambda` | `create-function`, `update-function-code`, `invoke` |
| DynamoDB | `aws dynamodb` | `create-table`, `put-item`, `query`, `scan` |
| SQS | `aws sqs` | `create-queue`, `send-message`, `receive-message` |
| SNS | `aws sns` | `create-topic`, `subscribe`, `publish` |
| CloudFront | `aws cloudfront` | `create-distribution`, `create-invalidation`, `list-distributions` |
| Route 53 | `aws route53` | `create-hosted-zone`, `change-resource-record-sets`, `create-health-check` |
| ECR | `aws ecr` | `create-repository`, `get-login-password`, `put-lifecycle-policy` |
| Beanstalk | `eb` / `aws elasticbeanstalk` | `eb init`, `eb create`, `eb deploy` |

### Output Format Tips
```bash
# Table output for humans
aws ec2 describe-instances --output table

# JSON query filtering
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' \
  --output table

# Grep for quick lookups
aws lambda list-functions --output text | grep my-func
```
