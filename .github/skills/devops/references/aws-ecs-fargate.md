# AWS ECS/Fargate + CDK-Based EKS

---

## ECS Core

### ECS Concepts

**Key primitives:**
- **Cluster** — logical grouping of compute (Fargate capacity or EC2 instances)
- **Task Definition** — blueprint (image, CPU/memory, env vars, IAM roles, ports)
- **Service** — maintains desired count of running tasks, integrates with ALB
- **Task** — running instantiation of a task definition (one or more containers)
- **Container Instance** — EC2 node registered to cluster (EC2 launch type only)

```
CLUSTER
├── Service (desired count, load balancer)
│   ├── Task (running container group)
│   │   ├── Container A
│   │   └── Container B (sidecar)
│   └── Task
└── Service
```

---

### Fargate Launch Type

Fargate is **serverless containers** — no EC2 instances to provision, patch, or scale. AWS manages the underlying compute.

| Attribute        | Fargate                          | EC2 Launch Type                  |
|------------------|----------------------------------|----------------------------------|
| Infrastructure   | Fully managed by AWS             | You manage EC2 instances         |
| Scaling          | Task-level (no node scaling)     | Node + task scaling required     |
| Pricing          | Per vCPU/GB-second used          | EC2 instance cost (always-on)    |
| Use case         | Microservices, variable load     | GPU workloads, dense packing     |
| Networking       | ENI per task (awsvpc only)       | bridge, host, or awsvpc          |
| Startup time     | ~30s cold start                  | Faster (pre-warmed nodes)        |

**Fargate Spot** — up to 70% savings; tasks may be interrupted. Use for batch/background jobs, not latency-sensitive services.

```bash
# Fargate Spot via capacity provider
aws ecs create-service \
  --cluster my-cluster \
  --service-name my-svc \
  --capacity-provider-strategy \
      capacityProvider=FARGATE_SPOT,weight=2 \
      capacityProvider=FARGATE,weight=1 \
  --task-definition my-task:1 \
  --desired-count 3
```

---

### Task Definition

```json
{
  "family": "my-api",
  "cpu": "512",
  "memory": "1024",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-api:latest",
      "essential": true,
      "portMappings": [
        { "containerPort": 8080, "protocol": "tcp" }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "8080" }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/db-password"
        },
        {
          "name": "API_KEY",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/prod/api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-def.json

# List revisions
aws ecs list-task-definitions --family-prefix my-api
```

---

### Service Creation

```bash
aws ecs create-service \
  --cluster my-cluster \
  --service-name my-api-svc \
  --task-definition my-api:1 \
  --launch-type FARGATE \
  --desired-count 2 \
  --load-balancers \
      targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/my-tg/abc123,\
      containerName=api,containerPort=8080 \
  --network-configuration \
      "awsvpcConfiguration={
        subnets=[subnet-11111,subnet-22222],
        securityGroups=[sg-33333],
        assignPublicIp=DISABLED
      }"
```

```bash
# Update service (rolling deploy)
aws ecs update-service \
  --cluster my-cluster \
  --service my-api-svc \
  --task-definition my-api:2 \
  --force-new-deployment
```

---

### Auto-Scaling

```bash
# Register ECS service as scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/my-cluster/my-api-svc \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 10

# Target tracking — CPU utilization
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/my-cluster/my-api-svc \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'

# Scheduled scaling (scale up before peak)
aws application-autoscaling put-scheduled-action \
  --service-namespace ecs \
  --resource-id service/my-cluster/my-api-svc \
  --scalable-dimension ecs:service:DesiredCount \
  --scheduled-action-name scale-up-morning \
  --schedule "cron(0 7 * * ? *)" \
  --scalable-target-action MinCapacity=4,MaxCapacity=10
```

---

### ALB Integration

```bash
# Create target group (IP mode required for Fargate awsvpc)
aws elbv2 create-target-group \
  --name my-api-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-12345 \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Path-based routing rule
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:...:listener/app/... \
  --conditions '[{"Field":"path-pattern","Values":["/api/*"]}]' \
  --actions '[{"Type":"forward","TargetGroupArn":"arn:..."}]' \
  --priority 10
```

---

## Operations

### App Runner Alternative

| Attribute        | App Runner                        | ECS Fargate                       |
|------------------|-----------------------------------|-----------------------------------|
| Simplicity       | Very high (no infra config)       | Medium (VPC, SG, ALB required)    |
| Control          | Low (managed entirely)            | High (full networking/IAM control)|
| Pricing          | Per vCPU/memory second            | Per vCPU/memory second            |
| VPC integration  | Optional (connector required)     | Native awsvpc per task            |
| Load balancer    | Built-in (auto-provisioned)       | ALB/NLB (you configure)           |
| Use case         | Simple web APIs, quick deploys    | Microservices, complex networking |

```bash
# App Runner from ECR image
aws apprunner create-service \
  --service-name my-api \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-api:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {"NODE_ENV": "production"}
      }
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::123456789012:role/AppRunnerECRAccessRole"
    }
  }' \
  --instance-configuration 'Cpu=1 vCPU,Memory=2 GB'
```

---

### Copilot CLI

AWS Copilot abstracts ECS/Fargate setup into developer-friendly workflows.

```bash
# Quick workflow
copilot init          # guided setup: app name, svc type, Dockerfile, env
copilot env init      # create environment (dev/staging/prod) — provisions VPC+ALB
copilot svc deploy    # build image → push to ECR → deploy to ECS

# Individual commands
copilot app init my-app
copilot svc init --name api --svc-type "Load Balanced Web Service" --dockerfile ./Dockerfile
copilot env init --name prod --profile prod-aws-profile
copilot svc deploy --name api --env prod

# Pipeline
copilot pipeline init   # creates buildspec.yml + pipeline manifest
copilot pipeline deploy
```

**`copilot/api/manifest.yml` structure:**
```yaml
name: api
type: Load Balanced Web Service
image:
  build: Dockerfile
  port: 8080
http:
  path: /
  healthcheck: /health
cpu: 512
memory: 1024
count:
  range: 1-10
  cpu_percentage: 70
variables:
  NODE_ENV: production
secrets:
  DB_PASSWORD: /prod/db-password   # SSM path
```

---

### ECR Integration

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Create repo and push
aws ecr create-repository --repository-name my-api --image-scanning-configuration scanOnPush=true
docker build -t my-api .
docker tag my-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-api:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-api:latest

# Lifecycle policy (keep last 10 tagged images)
aws ecr put-lifecycle-policy \
  --repository-name my-api \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "selection": {"tagStatus":"tagged","tagPrefixList":["v"],"countType":"imageCountMoreThan","countNumber":10},
      "action": {"type":"expire"}
    }]
  }'
```

---

### Secrets Management

Reference Secrets Manager or SSM Parameter Store in task definition via `secrets` block:

```json
"secrets": [
  {
    "name": "DB_PASSWORD",
    "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/db-password-AbCdEf"
  },
  {
    "name": "STRIPE_KEY",
    "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/stripe-key:STRIPE_KEY::"
  },
  {
    "name": "CONFIG_VALUE",
    "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/prod/config-value"
  }
]
```

`executionRoleArn` must have `secretsmanager:GetSecretValue` and `ssm:GetParameters` permissions.

---

### Logging

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/my-api
aws logs put-retention-policy --log-group-name /ecs/my-api --retention-in-days 30
```

**awslogs driver** (task definition): streams `stdout`/`stderr` to CloudWatch. Log stream pattern: `{prefix}/{container}/{taskId}`.

**FireLens (Fluent Bit sidecar)** for advanced routing to S3/Kinesis/Datadog:
```json
{
  "name": "log_router",
  "image": "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable",
  "essential": true,
  "firelensConfiguration": { "type": "fluentbit" },
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/firelens",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "firelens"
    }
  }
}
```
Application container then uses `logDriver: awsfirelens` with custom options.

---

### Blue-Green Deployment

Uses **AWS CodeDeploy** with ECS deployment type for zero-downtime traffic shifting.

```bash
# Create CodeDeploy application + deployment group
aws deploy create-application --application-name my-api-app --compute-platform ECS
aws deploy create-deployment-group \
  --application-name my-api-app \
  --deployment-group-name my-api-dg \
  --deployment-config-name CodeDeployDefault.ECSLinear10PercentEvery1Minutes \
  --ecs-services clusterName=my-cluster,serviceName=my-api-svc \
  --load-balancer-info \
      targetGroupPairInfoList='[{
        "targetGroups":[{"name":"my-api-tg-blue"},{"name":"my-api-tg-green"}],
        "prodTrafficRoute":{"listenerArns":["arn:..."]},
        "testTrafficRoute":{"listenerArns":["arn:...test..."]}
      }]'
```

**`appspec.yml`:**
```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "arn:aws:ecs:us-east-1:123456789012:task-definition/my-api:2"
        LoadBalancerInfo:
          ContainerName: "api"
          ContainerPort: 8080
Hooks:
  - BeforeAllowTraffic: "arn:aws:lambda:...:function:pre-traffic-hook"
  - AfterAllowTraffic: "arn:aws:lambda:...:function:post-traffic-hook"
```

**Traffic shifting configs:**
- `ECSAllAtOnce` — instant cutover
- `ECSLinear10PercentEvery1Minutes` — canary ramp
- `ECSCanary10Percent5Minutes` — 10% then 100% after 5 min

---

### VPC Networking

**awsvpc mode** (required for Fargate): each task gets a dedicated ENI with its own private IP and security group.

```
Private Subnet A          Private Subnet B
  Task ENI (sg-app)         Task ENI (sg-app)
       |                         |
  NAT Gateway               NAT Gateway
       |                         |
  Internet Gateway (outbound only)
```

**VPC Endpoints** (avoid NAT costs for AWS API calls):
```bash
aws ec2 create-vpc-endpoint --vpc-id vpc-12345 --service-name com.amazonaws.us-east-1.ecr.api --vpc-endpoint-type Interface
aws ec2 create-vpc-endpoint --vpc-id vpc-12345 --service-name com.amazonaws.us-east-1.ecr.dkr --vpc-endpoint-type Interface
aws ec2 create-vpc-endpoint --vpc-id vpc-12345 --service-name com.amazonaws.us-east-1.s3 --vpc-endpoint-type Gateway
aws ec2 create-vpc-endpoint --vpc-id vpc-12345 --service-name com.amazonaws.us-east-1.logs --vpc-endpoint-type Interface
```

---

### Service Discovery (Cloud Map)

```bash
# Create namespace
aws servicediscovery create-private-dns-namespace \
  --name internal.myapp.local --vpc vpc-12345

# Create service record
aws servicediscovery create-service \
  --name api \
  --dns-config 'NamespaceId=ns-xxx,DnsRecords=[{Type=A,TTL=10}]' \
  --health-check-custom-config FailureThreshold=1

# ECS service with service discovery
aws ecs create-service ... \
  --service-registries registryArn=arn:aws:servicediscovery:...:service/srv-xxx
```

Services connect via DNS: `api.internal.myapp.local` → resolves to task IPs. Supports A records (IP) and SRV records (IP + port).

---

## CDK-Based EKS

### EKS with CDK (TypeScript)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { KubectlV31Layer } from '@aws-cdk/lambda-layer-kubectl-v31';

export class EksStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC — 2 AZs, private + public subnets
    const vpc = new ec2.Vpc(this, 'EksVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // EKS Cluster (L2 construct)
    const cluster = new eks.Cluster(this, 'MyCluster', {
      vpc,
      version: eks.KubernetesVersion.V1_31,
      kubectlLayer: new KubectlV31Layer(this, 'KubectlLayer'),
      defaultCapacity: 0,           // managed separately below
      clusterName: 'my-cluster',
      endpointAccess: eks.EndpointAccess.PRIVATE,
    });

    // Managed node group
    cluster.addNodegroupCapacity('AppNodes', {
      instanceTypes: [new ec2.InstanceType('m5.large')],
      minSize: 2,
      maxSize: 10,
      desiredSize: 3,
      diskSize: 50,
      amiType: eks.NodegroupAmiType.AL2_X86_64,
    });

    // Fargate profile for system namespaces
    cluster.addFargateProfile('SystemProfile', {
      selectors: [
        { namespace: 'kube-system' },
        { namespace: 'fargate-only', labels: { 'compute': 'fargate' } },
      ],
    });

    // IRSA — IAM Role for Service Account (S3 read access example)
    const s3ServiceAccount = cluster.addServiceAccount('AppServiceAccount', {
      name: 'app-sa',
      namespace: 'default',
    });
    s3ServiceAccount.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
    );

    // Deploy Kubernetes manifest
    cluster.addManifest('AppDeployment', {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'my-app', namespace: 'default' },
      spec: {
        replicas: 2,
        selector: { matchLabels: { app: 'my-app' } },
        template: {
          metadata: { labels: { app: 'my-app' } },
          spec: {
            serviceAccountName: 'app-sa',
            containers: [{
              name: 'api',
              image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/my-api:latest',
              ports: [{ containerPort: 8080 }],
            }],
          },
        },
      },
    });

    // Helm chart — AWS Load Balancer Controller
    cluster.addHelmChart('AwsLbController', {
      chart: 'aws-load-balancer-controller',
      repository: 'https://aws.github.io/eks-charts',
      namespace: 'kube-system',
      values: {
        clusterName: cluster.clusterName,
        serviceAccount: { create: false, name: 'aws-load-balancer-controller' },
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
    new cdk.CfnOutput(this, 'KubeconfigCommand', {
      value: `aws eks update-kubeconfig --name ${cluster.clusterName} --region ${this.region}`,
    });
  }
}
```

```bash
# Deploy workflow
npm install
cdk bootstrap aws://123456789012/us-east-1
cdk synth        # preview CloudFormation
cdk diff         # show changes
cdk deploy EksStack
aws eks update-kubeconfig --name my-cluster --region us-east-1
kubectl get nodes
```

---

### EKS CDK vs eksctl

| Attribute          | CDK (TypeScript)                        | eksctl                                |
|--------------------|-----------------------------------------|---------------------------------------|
| Reproducibility    | Full IaC, versioned in Git              | YAML config, stateless CLI            |
| Complexity         | Higher (CDK constructs + TypeScript)    | Lower (simple YAML or flags)          |
| State management   | CloudFormation stacks (cfn-managed)     | No state file (imperative)            |
| Extensibility      | Mix EKS with VPC/RDS/IAM in one stack   | EKS-focused only                      |
| Drift detection    | `cdk diff` shows config drift           | Manual (`eksctl get cluster`)         |
| Learning curve     | Moderate (CDK concepts)                 | Low (kubectl-like UX)                 |
| CI/CD integration  | Native (`cdk deploy` in pipeline)       | Shell scripts or GitHub Actions       |
| Use case           | Production, multi-resource stacks       | Quick clusters, dev/testing           |
