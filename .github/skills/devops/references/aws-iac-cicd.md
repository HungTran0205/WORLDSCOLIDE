# AWS IaC + CI/CD Reference

---

## CloudFormation (PRIMARY)

### Template Anatomy

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "VPC + Public Subnet + EC2 instance"

Parameters:
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues: [t3.micro, t3.small, t3.medium]
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName

Mappings:
  RegionAMI:
    us-east-1:
      AMI: ami-0c55b159cbfafe1f0
    us-west-2:
      AMI: ami-01f08ef3e76b957e5

Conditions:
  IsProduction: !Equals [!Ref AWS::AccountId, "111122223333"]

Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true

  IGW:
    Type: AWS::EC2::InternetGateway

  IGWAttach:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyVPC
      InternetGatewayId: !Ref IGW

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true

  RouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC

  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref RouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref IGW

  SubnetRouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref RouteTable

  InstanceSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow SSH
      VpcId: !Ref MyVPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 22, ToPort: 22, CidrIp: 0.0.0.0/0 }

  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      ImageId: !FindInMap [RegionAMI, !Ref AWS::Region, AMI]
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds: [!Ref InstanceSG]
      Tags:
        - Key: Name
          Value: !Sub "web-server-${AWS::StackName}"

Outputs:
  InstanceId:
    Value: !Ref MyInstance
  PublicIP:
    Value: !GetAtt MyInstance.PublicIp
    Export:
      Name: !Sub "${AWS::StackName}-PublicIP"
  VpcId:
    Value: !Ref MyVPC
    Export:
      Name: !Sub "${AWS::StackName}-VpcId"
```

---

### Intrinsic Functions

| Function | Example |
|---|---|
| `!Ref` | `!Ref MyBucket` → resource ID or parameter value |
| `!GetAtt` | `!GetAtt MyBucket.Arn` → resource attribute |
| `!Sub` | `!Sub "arn:aws:s3:::${BucketName}/*"` → string substitution |
| `!Join` | `!Join [",", [a, b, c]]` → `"a,b,c"` |
| `!Select` | `!Select [0, !GetAZs ""]` → first AZ in region |
| `!If` | `!If [IsProduction, t3.large, t3.micro]` |
| `!ImportValue` | `!ImportValue "base-stack-VpcId"` → cross-stack reference |
| `!FindInMap` | `!FindInMap [RegionAMI, !Ref AWS::Region, AMI]` |

---

### Stack Operations

```bash
# Create / update (idempotent deploy)
aws cloudformation deploy \
  --stack-name my-stack \
  --template-file template.yaml \
  --parameter-overrides InstanceType=t3.small \
  --capabilities CAPABILITY_IAM

# From S3
aws cloudformation create-stack \
  --stack-name my-stack \
  --template-url https://s3.amazonaws.com/my-bucket/template.yaml \
  --capabilities CAPABILITY_NAMED_IAM

aws cloudformation describe-stacks --stack-name my-stack
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
aws cloudformation delete-stack --stack-name my-stack
aws cloudformation wait stack-delete-complete --stack-name my-stack
```

---

### Nested Stacks

Parent template references child templates in S3. Use when a template exceeds 51,200 bytes or to reuse common components (VPC, IAM) across projects.

```yaml
Resources:
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/network.yaml
      Parameters:
        VpcCidr: 10.0.0.0/16

  AppStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: NetworkStack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/app.yaml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetId: !GetAtt NetworkStack.Outputs.PublicSubnetId
```

---

### Change Sets — Safe Deployment Workflow

```bash
# 1. Create
aws cloudformation create-change-set \
  --stack-name my-stack --change-set-name my-changes \
  --template-body file://template-v2.yaml --capabilities CAPABILITY_IAM

# 2. Review
aws cloudformation wait change-set-create-complete \
  --stack-name my-stack --change-set-name my-changes
aws cloudformation describe-change-set \
  --stack-name my-stack --change-set-name my-changes

# 3. Execute (or delete to abandon)
aws cloudformation execute-change-set \
  --stack-name my-stack --change-set-name my-changes
```

---

### Drift Detection

```bash
aws cloudformation detect-stack-drift --stack-name my-stack
# → StackDriftDetectionId

aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <id>

aws cloudformation describe-stack-resource-drifts \
  --stack-name my-stack \
  --stack-resource-drift-status-filters MODIFIED DELETED
```

---

## Terraform (PRIMARY)

### AWS Provider + Authentication

```hcl
# versions.tf
terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

# Shared credentials profile (local dev)
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile   # reads ~/.aws/credentials
}

# Assume role (cross-account / CI — set AWS_* env vars or use OIDC)
provider "aws" {
  region = "us-east-1"
  assume_role {
    role_arn     = "arn:aws:iam::TARGET_ACCOUNT:role/TerraformRole"
    session_name = "TerraformSession"
  }
}
```

---

### S3 + DynamoDB Backend

```bash
# Bootstrap backend resources (one-time setup)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
BUCKET="my-tfstate-$ACCOUNT"

aws s3api create-bucket --bucket $BUCKET --region us-east-1
aws s3api put-bucket-versioning --bucket $BUCKET \
  --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket $BUCKET \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket $BUCKET \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region us-east-1
```

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-tfstate-123456789012"
    key            = "envs/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

```bash
# Per-environment key override
terraform init -backend-config="key=envs/staging/terraform.tfstate"
```

---

### Workspaces

```bash
terraform workspace new staging
terraform workspace new production
terraform workspace select staging
terraform workspace list
```

```hcl
locals {
  env_config = {
    staging    = { instance_type = "t3.small",  min_size = 1 }
    production = { instance_type = "t3.medium", min_size = 2 }
  }
  config = local.env_config[terraform.workspace]
}
resource "aws_instance" "app" {
  instance_type = local.config.instance_type
}
```

---

### Modules

**Module structure:** `modules/ecs-service/` → `main.tf`, `variables.tf`, `outputs.tf`

```hcl
# Local module
module "api_service" {
  source           = "./modules/ecs-service"
  cluster_arn      = aws_ecs_cluster.main.arn
  task_image       = "${aws_ecr_repository.api.repository_url}:latest"
  desired_count    = 2
  container_port   = 8080
  target_group_arn = aws_lb_target_group.api.arn
}

# Public registry — VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"
  name = "my-vpc"; cidr = "10.0.0.0/16"
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  enable_nat_gateway = true; single_nat_gateway = true
}

# Public registry — EKS
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.8"
  cluster_name = "my-cluster"; cluster_version = "1.29"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  eks_managed_node_groups = {
    workers = {
      instance_types = ["t3.medium"]
      min_size = 1; max_size = 5; desired_size = 2
    }
  }
}
```

---

### Plan/Apply Workflow

```bash
terraform init                          # download providers + modules
terraform fmt                           # format .tf files
terraform validate                      # syntax + schema check
terraform plan -out=plan.tfplan         # preview + save plan
terraform show plan.tfplan              # human-readable review
terraform apply plan.tfplan             # apply saved plan (no prompt)
terraform apply -auto-approve           # apply without prompt (CI)

# State management
terraform state list
terraform state show aws_ecs_service.app
terraform import aws_s3_bucket.b bucket-name
terraform destroy -target aws_instance.web
```

---

### Example: VPC + ECS Fargate

```hcl
locals { name = "myapp"; region = "us-east-1" }

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"
  name = local.name; cidr = "10.0.0.0/16"
  azs = ["us-east-1a", "us-east-1b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]
  enable_nat_gateway = true; single_nat_gateway = true
}

resource "aws_ecs_cluster" "main" { name = local.name }

resource "aws_ecr_repository" "app" {
  name                 = local.name
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_iam_role" "exec" {
  name = "${local.name}-exec"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}
resource "aws_iam_role_policy_attachment" "exec" {
  role       = aws_iam_role.exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_task_definition" "app" {
  family                   = local.name
  cpu = "256"; memory = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.exec.arn
  container_definitions = jsonencode([{
    name = local.name
    image = "${aws_ecr_repository.app.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 8080 }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${local.name}"
        "awslogs-region"        = local.region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_lb" "main" {
  name = local.name; internal = false; load_balancer_type = "application"
  subnets = module.vpc.public_subnets
}
resource "aws_lb_target_group" "app" {
  name = local.name; port = 8080; protocol = "HTTP"
  vpc_id = module.vpc.vpc_id; target_type = "ip"
  health_check { path = "/health" }
}
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn; port = 80; protocol = "HTTP"
  default_action { type = "forward"; target_group_arn = aws_lb_target_group.app.arn }
}

resource "aws_security_group" "alb" {
  name = "${local.name}-alb"; vpc_id = module.vpc.vpc_id
  ingress { from_port = 80; to_port = 80; protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0;  to_port = 0;  protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}
resource "aws_security_group" "tasks" {
  name = "${local.name}-tasks"; vpc_id = module.vpc.vpc_id
  ingress { from_port = 8080; to_port = 8080; protocol = "tcp"; security_groups = [aws_security_group.alb.id] }
  egress  { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_ecs_service" "app" {
  name = local.name; cluster = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count = 2; launch_type = "FARGATE"
  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.tasks.id]
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name = local.name; container_port = 8080
  }
}

output "alb_dns" { value = aws_lb.main.dns_name }
```

---

## CDK (EKS / Complex Infra)

### CDK Basics

```bash
npm install -g aws-cdk
cdk init app --language typescript   # scaffold: bin/, lib/, cdk.json
cdk synth        # synthesize CloudFormation (inspect cdk.out/)
cdk diff         # compare deployed vs local
cdk deploy
cdk deploy --require-approval never  # CI/CD non-interactive
cdk destroy
```

**Construct levels:**
- **L1 (`Cfn*`)** — 1:1 CloudFormation resource, full control
- **L2** — Higher-level with smart defaults (`ec2.Vpc`, `ecs.FargateService`)
- **L3 (Patterns)** — Complete patterns (`ecs_patterns.ApplicationLoadBalancedFargateService`)

### CDK VPC + Lambda

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public',  subnetType: ec2.SubnetType.PUBLIC },
        { name: 'private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      ],
    });

    new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/'),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: { NODE_ENV: 'production' },
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
    });
  }
}
```

> For CDK-based EKS (managed node groups, Fargate profiles, IRSA), see [aws-ecs-fargate.md](aws-ecs-fargate.md).

---

## CI/CD

### CodePipeline + CodeBuild + CodeDeploy

**Flow:** `Source (GitHub/CodeCommit) → Build (CodeBuild) → Deploy (CodeDeploy/ECS)`

```yaml
# appspec.yml — ECS blue-green deploy
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "<TASK_DEFINITION>"
        LoadBalancerInfo:
          ContainerName: "api"
          ContainerPort: 8080
Hooks:
  - BeforeAllowTraffic: "MyPreTrafficHook"
  - AfterAllowTraffic:  "MyPostTrafficHook"
```

---

### buildspec.yml — Docker + ECR + ECS

```yaml
version: 0.2

env:
  variables:
    AWS_DEFAULT_REGION: us-east-1
    ECR_REPO_NAME: my-api
    ECS_SERVICE: my-api-service
    ECS_CLUSTER: my-cluster
  parameter-store:
    DB_PASSWORD: /myapp/prod/db-password

phases:
  install:
    runtime-versions:
      docker: 20

  pre_build:
    commands:
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - IMAGE_TAG=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c1-7)
      - ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPO_NAME

  build:
    commands:
      - docker build -t $ECR_REPO_NAME:$IMAGE_TAG .
      - docker tag $ECR_REPO_NAME:$IMAGE_TAG $ECR_URI:$IMAGE_TAG
      - docker tag $ECR_REPO_NAME:$IMAGE_TAG $ECR_URI:latest

  post_build:
    commands:
      - docker push $ECR_URI:$IMAGE_TAG
      - docker push $ECR_URI:latest
      - aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment
      - printf '[{"name":"api","imageUri":"%s"}]' $ECR_URI:$IMAGE_TAG > imagedefinitions.json

cache:
  paths:
    - /root/.cache/pip/**/*

artifacts:
  files:
    - imagedefinitions.json

reports:
  unit-tests:
    files: ["test-results/**/*.xml"]
    file-format: JUNITXML
```

---

### GitHub Actions with OIDC (No Stored Secrets)

**Setup OIDC trust in AWS (one-time):**

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

cat > trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:ORG/REPO:*" }
    }
  }]
}
EOF
aws iam create-role --role-name GitHubActionsRole --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
```

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS
on:
  push:
    branches: [main]

permissions:
  id-token: write   # required for OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
          aws-region: us-east-1

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & push image
        id: build
        env:
          IMAGE: ${{ steps.ecr.outputs.registry }}/my-api:${{ github.sha }}
        run: |
          docker build -t $IMAGE .
          docker push $IMAGE
          echo "image=$IMAGE" >> $GITHUB_OUTPUT

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-def.json
          service: my-api-service
          cluster: my-cluster
          wait-for-service-stability: true

      # Deploy Lambda (alternative to ECS)
      - name: Deploy Lambda
        if: false   # toggle as needed
        run: |
          zip -r function.zip src/
          aws lambda update-function-code \
            --function-name my-fn --zip-file fileb://function.zip

      # Deploy CloudFormation stack
      - name: Deploy CloudFormation
        if: false   # toggle as needed
        run: |
          aws cloudformation deploy \
            --stack-name my-stack --template-file template.yaml \
            --capabilities CAPABILITY_IAM --no-fail-on-empty-changeset
```

---

### ECR → ECS Pipeline with Rollback

```
Push code → GitHub Actions → docker build + push ($SHA tag) to ECR
  → ECS task definition updated → rolling update (200% max / 100% min healthy)
  → health checks pass → old tasks drained
  → on failure: ECS circuit breaker auto-rolls back
```

```bash
# Enable ECS deployment circuit breaker (automatic rollback on failure)
aws ecs update-service \
  --cluster my-cluster --service my-service \
  --deployment-configuration \
    "deploymentCircuitBreaker={enable=true,rollback=true},maximumPercent=200,minimumHealthyPercent=100"

# Manual rollback to previous task definition revision
aws ecs update-service --cluster my-cluster --service my-service \
  --task-definition my-task:PREVIOUS_REVISION
```

---

### Lambda Pipeline

```bash
# Zip + S3 + update function code
zip -r function.zip src/ requirements.txt
aws s3 cp function.zip s3://my-deploy-bucket/lambda/function-$VERSION.zip
aws lambda update-function-code \
  --function-name my-fn \
  --s3-bucket my-deploy-bucket \
  --s3-key lambda/function-$VERSION.zip
aws lambda wait function-updated --function-name my-fn
aws lambda publish-version --function-name my-fn

# SAM-based (CloudFormation under the hood)
sam build
sam deploy --stack-name my-lambda \
  --s3-bucket my-deploy-bucket \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset
```

---

### Terraform in CI/CD (GitHub Actions)

```yaml
# .github/workflows/terraform.yml
name: Terraform
on:
  pull_request:
    branches: [main]
    paths: ["infra/**"]
  push:
    branches: [main]
    paths: ["infra/**"]

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infra/

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.7.5"

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/TerraformRole
          aws-region: us-east-1

      - run: terraform init
      - run: terraform fmt -check
      - run: terraform validate

      - name: Terraform Plan (PR)
        if: github.event_name == 'pull_request'
        id: plan
        run: terraform plan -no-color -out=plan.tfplan
        continue-on-error: true

      - name: Comment plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const output = `#### Terraform Plan\n\`\`\`\n${{ steps.plan.outputs.stdout }}\n\`\`\``;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner, repo: context.repo.repo, body: output
            });

      - name: Upload plan artifact
        if: github.event_name == 'pull_request'
        uses: actions/upload-artifact@v4
        with:
          name: tfplan
          path: infra/plan.tfplan
          retention-days: 5

      - name: Terraform Apply (main branch only)
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: |
          terraform plan -out=plan.tfplan
          terraform apply -auto-approve plan.tfplan
```

> **State locking:** DynamoDB prevents concurrent applies automatically. Use `terraform force-unlock <LOCK_ID>` only when the lock is confirmed stale (no concurrent apply running).

---

## Quick Reference

### CloudFormation

| Task | Command |
|---|---|
| Deploy (create or update) | `aws cloudformation deploy --template-file t.yaml --stack-name s` |
| Describe stack | `aws cloudformation describe-stacks --stack-name s` |
| Preview changes | `create-change-set` → `describe-change-set` → `execute-change-set` |
| Detect drift | `aws cloudformation detect-stack-drift --stack-name s` |
| Wait for complete | `aws cloudformation wait stack-create-complete --stack-name s` |

### Terraform

| Task | Command |
|---|---|
| Init + validate | `terraform init && terraform fmt && terraform validate` |
| Plan + review | `terraform plan -out=plan.tfplan && terraform show plan.tfplan` |
| Apply | `terraform apply plan.tfplan` |
| List state | `terraform state list` |
| Import resource | `terraform import aws_s3_bucket.b bucket-name` |
| Workspace switch | `terraform workspace select staging` |

### IaC Tool Selection

| Tool | Best For |
|---|---|
| CloudFormation | AWS-native, no extra tooling, tight service integration |
| Terraform | Multi-account, multi-cloud, mature module ecosystem |
| CDK | Complex logic, EKS, type-safe infra (TypeScript/Python) |
| SAM | Lambda-first serverless, local invoke/test |
