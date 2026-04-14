---
name: tm:devops
description: Deploy to AWS (Lambda, S3, ECS, EKS), Docker, Kubernetes (kubectl, Helm). Use for serverless, containers, CI/CD, GitOps, IaC, security audit.
metadata: version: 1.00
argument-hint: "[platform] [task]"
---

# DevOps Skill

Deploy and manage cloud infrastructure across AWS, Docker, and Kubernetes.

## When to Use

- Deploy serverless apps with AWS Lambda / Lambda@Edge
- Containerize apps with Docker, push to ECR
- Manage AWS with AWS CLI (EC2, ECS, EKS, RDS, S3)
- Kubernetes on EKS (kubectl, Helm, eksctl)
- GitOps workflows (Argo CD, Flux)
- CI/CD pipelines with CodePipeline/CodeBuild or GitHub Actions
- Infrastructure as Code (CloudFormation, Terraform, CDK)
- Security audits, IAM, VPC, encryption

## Platform Selection

| Need | Choose |
|------|--------|
| Serverless functions | AWS Lambda |
| Edge compute (<50ms) | Lambda@Edge / CloudFront Functions |
| Object storage | Amazon S3 |
| NoSQL database | Amazon DynamoDB |
| Relational database (managed) | Amazon RDS / Aurora |
| Containerized workloads | ECS Fargate / App Runner |
| Enterprise Kubernetes | Amazon EKS |
| Message queue | Amazon SQS |
| Static site + API | AWS Amplify |
| Container orchestration | Kubernetes (EKS) |
| AI/ML inference | Amazon Bedrock |
| IaC | CloudFormation / Terraform (primary), CDK (EKS) |

## Quick Start

```bash
# AWS Lambda (CloudFormation)
aws cloudformation deploy --template-file template.yaml --stack-name my-lambda --capabilities CAPABILITY_IAM

# Docker + ECR
docker build -t myapp . && aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com && docker push <account>.dkr.ecr.<region>.amazonaws.com/myapp

# ECS Fargate (Copilot)
copilot init --app myapp --name api --type "Load Balanced Web Service"

# EKS (eksctl)
eksctl create cluster --name my-cluster --region us-east-1 && kubectl apply -f manifests/

# EKS (CDK)
cdk init app --language typescript && cdk deploy

# Kubernetes
kubectl apply -f manifests/ && kubectl get pods
```

## Reference Navigation

### AWS Platform
- `aws-cli-platform.md` - AWS CLI v2, authentication, profiles, configuration
- `aws-services.md` - EC2, ECS, S3, RDS, Lambda, DynamoDB, SQS, CloudFront, ECR

### AWS Serverless
- `aws-lambda-basics.md` - Handler patterns, event sources, deployment
- `aws-lambda-advanced.md` - Lambda@Edge, Step Functions, Powertools, performance

### AWS Storage & Data
- `aws-s3-storage.md` - Object storage, lifecycle, encryption, CloudFront
- `aws-dynamodb-sqs.md` - DynamoDB, SQS, SNS, data store decisions

### AWS Containers
- `aws-ecs-fargate.md` - ECS, Fargate, App Runner, Copilot, CDK-based EKS

### AWS Infrastructure & CI/CD
- `aws-iac-cicd.md` - CloudFormation, Terraform, CDK, CodePipeline, GitHub Actions

### AWS Security & Monitoring
- `aws-security-monitoring.md` - IAM, VPC, KMS, CloudTrail, CloudWatch, X-Ray

### Docker
- `docker-basics.md` - Dockerfile, images, containers
- `docker-compose.md` - Multi-container apps

### Kubernetes
- `kubernetes-basics.md` - Core concepts, architecture, workloads
- `kubernetes-kubectl.md` - Essential commands, debugging workflow
- `kubernetes-helm.md` / `kubernetes-helm-advanced.md` - Helm charts, templates
- `kubernetes-security.md` / `kubernetes-security-advanced.md` - RBAC, secrets
- `kubernetes-workflows.md` / `kubernetes-workflows-advanced.md` - GitOps, CI/CD
- `kubernetes-troubleshooting.md` / `kubernetes-troubleshooting-advanced.md` - Debug

### Scripts
- `scripts/aws_deploy.py` - Automate AWS deployments (Lambda, ECS, S3)
- `scripts/docker_optimize.py` - Analyze Dockerfiles

## Best Practices

**Security:** IAM least-privilege, non-root containers, Secrets Manager, KMS encryption, VPC isolation
**Performance:** Lambda provisioned concurrency, S3 Transfer Acceleration, CloudFront caching, right-size EC2/Fargate
**Cost:** S3 lifecycle policies, Savings Plans, spot instances, Lambda ARM64
**Development:** Docker Compose local dev, IaC version control, CDK synth for local validation

## Resources

- AWS: https://docs.aws.amazon.com
- Docker: https://docs.docker.com
- Kubernetes: https://kubernetes.io/docs
- Helm: https://helm.sh/docs
- CDK: https://docs.aws.amazon.com/cdk
- Terraform AWS: https://registry.terraform.io/providers/hashicorp/aws
