# AWS CLI v2 — Platform Reference

Comprehensive reference for AWS CLI v2: installation, authentication, configuration, and usage patterns.

---

## 1. Installation

### Linux (x86_64)

```bash
# Download and install
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Upgrade existing install
sudo ./aws/install --update
```

### Linux (ARM64)

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### macOS (pkg installer)

```bash
# Download and open the macOS pkg
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Or via Homebrew
brew install awscli
```

### Windows (MSI)

```powershell
# Download MSI from:
# https://awscli.amazonaws.com/AWSCLIV2.msi
# Or silent install:
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi /qn
```

### Docker

```bash
# Pull and run
docker run --rm -it amazon/aws-cli --version

# Mount credentials
docker run --rm -it \
  -v ~/.aws:/root/.aws \
  -e AWS_PROFILE=dev \
  amazon/aws-cli s3 ls
```

### Verify Installation

```bash
aws --version
# aws-cli/2.x.x Python/3.x.x Linux/... botocore/2.x.x
```

---

## 2. Authentication

### 2.1 Access Keys (Static Credentials)

```bash
# Interactive setup — prompts for key, secret, region, output format
aws configure

# Non-interactive setup
aws configure set aws_access_key_id AKIAIOSFODNN7EXAMPLE
aws configure set aws_secret_access_key wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
aws configure set region us-east-1
aws configure set output json
```

Credentials file (`~/.aws/credentials`):

```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[dev]
aws_access_key_id = AKIAI44QH8DHBEXAMPLE
aws_secret_access_key = je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY
```

Config file (`~/.aws/config`):

```ini
[default]
region = us-east-1
output = json

[profile dev]
region = eu-west-1
output = table

[profile prod]
region = us-east-1
output = json
```

### 2.2 SSO / IAM Identity Center

```bash
# Configure an SSO profile
aws configure sso

# Prompts for:
#   SSO session name: my-sso
#   SSO start URL: https://my-org.awsapps.com/start
#   SSO region: us-east-1
#   SSO registration scopes: sso:account:access

# Login (opens browser)
aws sso login --profile dev

# Logout
aws sso logout --profile dev
```

Config entry created by `aws configure sso`:

```ini
[profile dev-sso]
sso_session = my-sso
sso_account_id = 123456789012
sso_role_name = DeveloperAccess
region = us-east-1
output = json

[sso-session my-sso]
sso_start_url = https://my-org.awsapps.com/start
sso_region = us-east-1
sso_registration_scopes = sso:account:access
```

### 2.3 Assume Role (Cross-Account / Elevated Privileges)

```bash
# Manually assume a role
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/MyRole \
  --role-session-name MySession \
  --duration-seconds 3600

# Output returns AccessKeyId, SecretAccessKey, SessionToken
# Export to environment:
eval $(aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/MyRole \
  --role-session-name MySession \
  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
  --output text | awk '{print "export AWS_ACCESS_KEY_ID="$1"\nexport AWS_SECRET_ACCESS_KEY="$2"\nexport AWS_SESSION_TOKEN="$3}')
```

Profile-based assume role (`~/.aws/config`):

```ini
[profile assume-dev]
role_arn = arn:aws:iam::123456789012:role/DevRole
source_profile = default
region = us-east-1
```

### 2.4 OIDC Federation (CI/CD)

For GitHub Actions, use OIDC instead of long-lived access keys:

```bash
# 1. Create an IAM OIDC provider for GitHub Actions
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Create an IAM role with a trust policy (see CI/CD section for full YAML)
aws iam create-role \
  --role-name GitHubActionsRole \
  --assume-role-policy-document file://trust-policy.json
```

### 2.5 Environment Variables

```bash
# Static credentials
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_DEFAULT_REGION=us-east-1

# Temporary session credentials (from STS assume-role)
export AWS_ACCESS_KEY_ID=ASIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_SESSION_TOKEN=AQoDYXdzEJr...

# Profile selection
export AWS_PROFILE=dev

# Other useful variables
export AWS_DEFAULT_OUTPUT=json
export AWS_CONFIG_FILE=~/.aws/config
export AWS_SHARED_CREDENTIALS_FILE=~/.aws/credentials
```

**Credential resolution order:**

| Priority | Source |
|----------|--------|
| 1 | Command-line `--profile` flag |
| 2 | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` env vars |
| 3 | `AWS_PROFILE` env var |
| 4 | `~/.aws/credentials` `[default]` |
| 5 | `~/.aws/config` `[default]` |
| 6 | Container credentials (ECS task role) |
| 7 | EC2 instance metadata (instance profile) |

---

## 3. Named Profiles

### Define Profiles

`~/.aws/credentials`:

```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[dev]
aws_access_key_id = AKIAI44QH8DHBEXAMPLE
aws_secret_access_key = je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY

[prod]
aws_access_key_id = AKIAIOSFODNN7PRODEXM
aws_secret_access_key = prodSecretKeyExampleValue1234567890abcd
```

`~/.aws/config`:

```ini
[default]
region = us-east-1
output = json

[profile dev]
region = eu-west-1
output = table
mfa_serial = arn:aws:iam::111111111111:mfa/myuser

[profile prod]
region = us-east-1
output = json
role_arn = arn:aws:iam::999999999999:role/ProdReadOnly
source_profile = default
```

### Use Profiles

```bash
# Flag-based
aws s3 ls --profile dev
aws ec2 describe-instances --profile prod

# Environment variable
export AWS_PROFILE=dev
aws s3 ls  # uses dev profile

# Temporary override
AWS_PROFILE=prod aws ec2 describe-instances
```

---

## 4. Configuration

```bash
# List all config values
aws configure list

# List all profiles
aws configure list-profiles

# Get specific value
aws configure get region
aws configure get aws_access_key_id

# Get value for specific profile
aws configure get region --profile dev

# Set value for specific profile
aws configure set region ap-southeast-1 --profile staging

# Import credentials from CSV (exported from IAM console)
aws configure import --csv credentials.csv
```

**Available regions (common):**

| Region Code | Location |
|-------------|----------|
| us-east-1 | N. Virginia |
| us-east-2 | Ohio |
| us-west-1 | N. California |
| us-west-2 | Oregon |
| eu-west-1 | Ireland |
| eu-central-1 | Frankfurt |
| ap-southeast-1 | Singapore |
| ap-northeast-1 | Tokyo |
| ap-south-1 | Mumbai |

---

## 5. Output Formats

```bash
# JSON (default) — machine-readable, full structure
aws ec2 describe-instances --output json

# YAML — human-readable structured output
aws ec2 describe-instances --output yaml

# Table — aligned columns for terminal reading
aws s3api list-buckets --output table

# Text — tab-separated, suitable for shell scripting
aws s3api list-buckets --output text

# Set default output format
aws configure set output table
```

**JSON output example:**
```json
{
  "Buckets": [
    { "Name": "my-bucket", "CreationDate": "2024-01-01T00:00:00+00:00" }
  ]
}
```

**Table output example:**
```
----------------------------------
|         ListBuckets            |
+------------+-------------------+
|    Name    |   CreationDate    |
+------------+-------------------+
|  my-bucket | 2024-01-01...     |
+------------+-------------------+
```

---

## 6. JMESPath Filtering (`--query`)

```bash
# Get only instance IDs
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].InstanceId' \
  --output text

# Filter running instances
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[?State.Name==`running`].{ID:InstanceId,Type:InstanceType,IP:PublicIpAddress}' \
  --output table

# Get specific S3 bucket names
aws s3api list-buckets \
  --query 'Buckets[*].Name' \
  --output text

# Get bucket names created after a date
aws s3api list-buckets \
  --query 'Buckets[?CreationDate>=`2024-01-01`].Name' \
  --output text

# Extract single field
aws sts get-caller-identity \
  --query 'Account' \
  --output text

# Latest AMI ID
aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
  --query 'sort_by(Images,&CreationDate)[-1].ImageId' \
  --output text

# Get running ECS tasks ARNs
aws ecs list-tasks \
  --cluster my-cluster \
  --query 'taskArns[*]' \
  --output text

# Filter Lambda functions by runtime
aws lambda list-functions \
  --query 'Functions[?Runtime==`nodejs20.x`].{Name:FunctionName,Memory:MemorySize}' \
  --output table
```

---

## 7. Multi-Account Setup

### AWS Organizations Structure

```bash
# List accounts in the organization
aws organizations list-accounts \
  --query 'Accounts[*].{ID:Id,Name:Name,Email:Email}' \
  --output table

# List OUs under root
aws organizations list-roots
aws organizations list-organizational-units-for-parent \
  --parent-id r-xxxx \
  --query 'OrganizationalUnits[*].{ID:Id,Name:Name}' \
  --output table
```

### Per-Account Named Profiles

`~/.aws/config`:

```ini
[profile org-management]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
region = us-east-1

[profile dev-account]
role_arn = arn:aws:iam::111111111111:role/OrganizationAccountAccessRole
source_profile = org-management
region = us-east-1

[profile staging-account]
role_arn = arn:aws:iam::222222222222:role/OrganizationAccountAccessRole
source_profile = org-management
region = us-east-1

[profile prod-account]
role_arn = arn:aws:iam::333333333333:role/OrganizationAccountAccessRole
source_profile = org-management
region = us-east-1
```

```bash
# Deploy to different accounts
aws s3 ls --profile dev-account
aws s3 ls --profile prod-account

# Check which account you're operating in
aws sts get-caller-identity --profile dev-account
```

### Cross-Account Role Assumption with MFA

```ini
[profile prod-mfa]
role_arn = arn:aws:iam::333333333333:role/ProdAdmin
source_profile = default
mfa_serial = arn:aws:iam::000000000000:mfa/myuser
role_session_name = ProdSession
```

---

## 8. Terraform AWS Provider Configuration

### Basic Provider

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}
```

### Shared Credentials File

```hcl
provider "aws" {
  region                   = "us-east-1"
  shared_credentials_files = ["~/.aws/credentials"]
  profile                  = "dev"
}
```

### Assume Role

```hcl
provider "aws" {
  region = "us-east-1"

  assume_role {
    role_arn     = "arn:aws:iam::123456789012:role/TerraformRole"
    session_name = "TerraformSession"
    external_id  = "my-external-id"  # optional, for 3rd-party access
  }
}
```

### Environment Variables (CI/CD)

```hcl
# No credentials in provider block — resolved from environment
provider "aws" {
  region = var.aws_region
}
```

```bash
# Set in CI pipeline
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...
terraform apply
```

### Multi-Region / Multi-Account with Aliases

```hcl
provider "aws" {
  alias  = "us_east"
  region = "us-east-1"
}

provider "aws" {
  alias   = "eu_west"
  region  = "eu-west-1"
  profile = "prod"
}

# Use alias in resources
resource "aws_s3_bucket" "eu_bucket" {
  provider = aws.eu_west
  bucket   = "my-eu-bucket"
}
```

### Backend with S3

```hcl
terraform {
  backend "s3" {
    bucket         = "my-tfstate-bucket"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-lock"
    encrypt        = true
  }
}
```

---

## 9. CI/CD Integration

### GitHub Actions with OIDC (Recommended — No Stored Secrets)

Trust policy for IAM role (`trust-policy.json`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:*"
        }
      }
    }
  ]
}
```

GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write   # Required for OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          role-session-name: GitHubActionsSession
          aws-region: us-east-1

      - name: Deploy to S3
        run: aws s3 sync ./dist s3://my-bucket --delete
```

### Environment Variables Approach (Legacy)

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      AWS_DEFAULT_REGION: us-east-1
    steps:
      - uses: actions/checkout@v4
      - run: aws s3 sync ./dist s3://my-bucket
```

### AWS CodeBuild with IAM Role

In `buildspec.yml`, CodeBuild automatically inherits the IAM role — no credential management needed:

```yaml
version: 0.2

phases:
  install:
    commands:
      - aws --version  # Already authenticated via service role

  pre_build:
    commands:
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | \
          docker login --username AWS --password-stdin $ECR_REGISTRY

  build:
    commands:
      - docker build -t $IMAGE_TAG .
      - docker push $IMAGE_TAG

  post_build:
    commands:
      - aws ecs update-service --cluster my-cluster --service my-service --force-new-deployment
```

---

## 10. Best Practices

### Credential Security

```bash
# NEVER do this — credentials in code or environment
# export AWS_ACCESS_KEY_ID=AKIA...  # in a script committed to git

# Check for accidentally committed credentials
git secrets --scan
trufflehog filesystem .

# Use IAM roles for compute resources (not access keys)
# EC2 → Instance Profile
# ECS → Task Role
# Lambda → Execution Role
# CodeBuild → Service Role
```

### Least-Privilege IAM

```bash
# Validate a policy document
aws iam validate-policy --policy-document file://policy.json --policy-type IDENTITY_POLICY

# View effective permissions (IAM Access Analyzer)
aws accessanalyzer validate-policy \
  --policy-document file://policy.json \
  --policy-type IDENTITY_POLICY

# Generate a least-privilege policy from CloudTrail events
aws iam generate-service-last-accessed-details \
  --arn arn:aws:iam::123456789012:role/MyRole
```

### Access Key Rotation

```bash
# List access keys for a user
aws iam list-access-keys --user-name myuser

# Create a new key
aws iam create-access-key --user-name myuser

# Update key status (deactivate old key first)
aws iam update-access-key \
  --user-name myuser \
  --access-key-id AKIAIOSFODNN7EXAMPLE \
  --status Inactive

# Delete old key after confirming new key works
aws iam delete-access-key \
  --user-name myuser \
  --access-key-id AKIAIOSFODNN7EXAMPLE
```

### Enable MFA

```bash
# Add virtual MFA device
aws iam create-virtual-mfa-device \
  --virtual-mfa-device-name MyMFA \
  --outfile QRCode.png \
  --bootstrap-method QRCodePNG

# Enable MFA device (requires two consecutive TOTP codes)
aws iam enable-mfa-device \
  --user-name myuser \
  --serial-number arn:aws:iam::123456789012:mfa/MyMFA \
  --authentication-code1 123456 \
  --authentication-code2 789012
```

### Enable CloudTrail

```bash
# Create a trail (logs all management events)
aws cloudtrail create-trail \
  --name my-org-trail \
  --s3-bucket-name my-cloudtrail-bucket \
  --is-multi-region-trail \
  --enable-log-file-validation

# Start logging
aws cloudtrail start-logging --name my-org-trail

# Verify trail is active
aws cloudtrail get-trail-status --name my-org-trail \
  --query '{Logging:IsLogging,LatestDelivery:LatestDeliveryTime}'
```

---

## 11. Troubleshooting

### Common Errors

| Error Code | Cause | Fix |
|------------|-------|-----|
| `ExpiredTokenException` | Session token or STS credentials expired | Re-run `aws sso login` or re-assume role |
| `AccessDeniedException` | Insufficient IAM permissions | Attach required policy or fix trust relationship |
| `InvalidClientTokenId` | Invalid or deleted access key | Verify key is active in IAM console |
| `AuthFailure` | Wrong credentials or region mismatch | Run `aws configure` and verify region |
| `NoCredentialProviders` | No credentials found in any source | Set `AWS_ACCESS_KEY_ID` or configure profile |
| `SignatureDoesNotMatch` | Clock skew or incorrect secret key | Sync system clock; verify secret key |
| `RequestExpired` | System clock too far off | Sync NTP: `sudo ntpdate pool.ntp.org` |

### Diagnostic Commands

```bash
# Verify current identity
aws sts get-caller-identity
# Returns: Account, UserId, Arn

# List configured profiles
aws configure list-profiles

# View effective configuration
aws configure list
aws configure list --profile dev

# Test connectivity
aws s3 ls 2>&1 | head -5

# Enable debug output (verbose request/response logging)
aws s3 ls --debug 2>&1 | head -100

# Check token expiry (for SSO)
aws sts get-caller-identity --profile dev-sso

# Decode authorization error messages (requires sts:DecodeAuthorizationMessage)
aws sts decode-authorization-message \
  --encoded-message <encoded-error-from-AccessDenied>
```

### SSO / Identity Center Issues

```bash
# Force re-authentication
aws sso logout --profile dev-sso
aws sso login --profile dev-sso

# Clear cached token (Linux/macOS)
rm -rf ~/.aws/sso/cache/*

# Clear cached token (Windows)
Remove-Item -Recurse "$env:USERPROFILE\.aws\sso\cache\*"
```

---

## 12. Quick Reference — Common Commands

| Category | Command | Description |
|----------|---------|-------------|
| **Identity** | `aws sts get-caller-identity` | Show current account/user/role |
| **IAM** | `aws iam list-users` | List IAM users |
| **IAM** | `aws iam list-roles --query 'Roles[*].RoleName'` | List IAM roles |
| **S3** | `aws s3 ls` | List all buckets |
| **S3** | `aws s3 ls s3://my-bucket/` | List bucket contents |
| **S3** | `aws s3 cp file.txt s3://my-bucket/` | Upload file |
| **S3** | `aws s3 sync ./dist s3://my-bucket/ --delete` | Sync directory |
| **S3** | `aws s3 presign s3://my-bucket/file.txt --expires-in 3600` | Generate presigned URL |
| **EC2** | `aws ec2 describe-instances --output table` | List instances |
| **EC2** | `aws ec2 start-instances --instance-ids i-1234567890abcdef0` | Start instance |
| **EC2** | `aws ec2 describe-vpcs` | List VPCs |
| **ECS** | `aws ecs list-clusters` | List ECS clusters |
| **ECS** | `aws ecs list-services --cluster my-cluster` | List services |
| **ECS** | `aws ecs update-service --cluster c --service s --force-new-deployment` | Force redeploy |
| **ECR** | `aws ecr get-login-password \| docker login --username AWS --password-stdin <registry>` | Docker login |
| **ECR** | `aws ecr describe-repositories` | List repositories |
| **Lambda** | `aws lambda list-functions` | List Lambda functions |
| **Lambda** | `aws lambda invoke --function-name my-fn out.json` | Invoke function |
| **Lambda** | `aws lambda update-function-code --function-name my-fn --zip-file fileb://fn.zip` | Deploy code |
| **CF** | `aws cloudformation list-stacks` | List CF stacks |
| **CF** | `aws cloudformation describe-stacks --stack-name my-stack` | Stack details |
| **CF** | `aws cloudformation deploy --template-file t.yaml --stack-name my-stack` | Deploy stack |
| **SSM** | `aws ssm get-parameter --name /my/param --with-decryption` | Get secret |
| **SSM** | `aws ssm put-parameter --name /my/param --value val --type SecureString` | Store secret |
| **Secrets** | `aws secretsmanager get-secret-value --secret-id my-secret` | Get secret value |
| **RDS** | `aws rds describe-db-instances` | List RDS instances |
| **Route53** | `aws route53 list-hosted-zones` | List hosted zones |
| **EKS** | `aws eks list-clusters` | List EKS clusters |
| **EKS** | `aws eks update-kubeconfig --name my-cluster --region us-east-1` | Configure kubectl |
| **Logs** | `aws logs describe-log-groups` | List log groups |
| **Logs** | `aws logs tail /aws/lambda/my-fn --follow` | Tail logs live |
| **SNS** | `aws sns list-topics` | List SNS topics |
| **SQS** | `aws sqs list-queues` | List SQS queues |

---

## See Also

- [AWS CLI Command Reference](https://docs.aws.amazon.com/cli/latest/reference/)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub OIDC with AWS](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
