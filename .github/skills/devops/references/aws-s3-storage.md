# AWS S3 Storage

## Bucket Operations

### Create Bucket
```bash
# Simple create (us-east-1 — no LocationConstraint needed)
aws s3 mb s3://my-bucket

# Other regions require --create-bucket-configuration
aws s3api create-bucket \
  --bucket my-bucket \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

# With ACL disabled (recommended — Object Ownership: BucketOwnerEnforced)
aws s3api create-bucket \
  --bucket my-bucket \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1 \
  --object-ownership BucketOwnerEnforced
```

**Naming rules:** 3–63 lowercase chars, digits, hyphens; no dots (TLS issues); globally unique across all AWS accounts.

### List & Delete
```bash
aws s3 ls                          # list all buckets
aws s3 ls s3://my-bucket/prefix/   # list objects with prefix
aws s3 rb s3://my-bucket           # remove empty bucket
aws s3 rb s3://my-bucket --force   # remove bucket + all contents
```

---

## Upload & Download

### CLI
```bash
# Copy local → S3
aws s3 cp file.txt s3://my-bucket/uploads/file.txt

# Copy S3 → local
aws s3 cp s3://my-bucket/uploads/file.txt ./file.txt

# Sync directory (only changed files)
aws s3 sync ./dist s3://my-bucket/static/ --delete

# Move (copy + delete source)
aws s3 mv s3://my-bucket/old.txt s3://my-bucket/new.txt

# Delete
aws s3 rm s3://my-bucket/uploads/file.txt
aws s3 rm s3://my-bucket/uploads/ --recursive

# Storage class on upload
aws s3 cp archive.zip s3://my-bucket/ --storage-class GLACIER_IR
```

### SDK — Python (boto3)
```python
import boto3
s3 = boto3.client("s3")

# Upload file from disk
s3.upload_file("local.txt", "my-bucket", "remote/path/local.txt")

# Upload in-memory object
s3.put_object(
    Bucket="my-bucket",
    Key="data/record.json",
    Body=b'{"id": 1}',
    ContentType="application/json",
    StorageClass="STANDARD_IA",
)

# Download file to disk
s3.download_file("my-bucket", "remote/path/local.txt", "downloaded.txt")

# Download into memory
response = s3.get_object(Bucket="my-bucket", Key="data/record.json")
content = response["Body"].read()          # bytes
```

### Presigned URLs
```bash
# CLI — generate download URL (expires in 1 hour)
aws s3 presign s3://my-bucket/private/report.pdf --expires-in 3600
```

```python
import boto3
s3 = boto3.client("s3", region_name="eu-west-1")

# Presigned download URL
url = s3.generate_presigned_url(
    "get_object",
    Params={"Bucket": "my-bucket", "Key": "private/report.pdf"},
    ExpiresIn=3600,
)

# Presigned upload URL (PUT)
url = s3.generate_presigned_url(
    "put_object",
    Params={"Bucket": "my-bucket", "Key": "uploads/user-photo.jpg", "ContentType": "image/jpeg"},
    ExpiresIn=900,
)
# Client uploads with: PUT <url> -H "Content-Type: image/jpeg" --data-binary @photo.jpg
```

**Use cases:** Share private objects without credentials, browser-direct uploads bypassing your API server.

---

## Storage Classes

| Class | Retrieval Time | Min Duration | Relative Cost | Use Case |
|---|---|---|---|---|
| Standard | Milliseconds | None | Highest | Active data, frequent access |
| Standard-IA | Milliseconds | 30 days | ~40% cheaper | Infrequent but fast retrieval |
| One Zone-IA | Milliseconds | 30 days | ~20% cheaper than IA | Re-creatable data, one AZ only |
| Intelligent-Tiering | Milliseconds | None | Auto-optimized | Unknown/changing access pattern |
| Glacier Instant Retrieval | Milliseconds | 90 days | Low | Archives needing fast retrieval |
| Glacier Flexible Retrieval | Minutes–hours | 90 days | Very low | Archives, bulk restore acceptable |
| Glacier Deep Archive | 12–48 hours | 180 days | Lowest | Long-term compliance archives |

---

## Lifecycle Policies

### Example: Log Retention + Archive
```json
{
  "Rules": [
    {
      "ID": "log-archive-delete",
      "Status": "Enabled",
      "Filter": { "Prefix": "logs/" },
      "Transitions": [
        { "Days": 30,  "StorageClass": "STANDARD_IA" },
        { "Days": 90,  "StorageClass": "GLACIER_IR" },
        { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
      ],
      "Expiration": { "Days": 730 }
    },
    {
      "ID": "delete-incomplete-multipart",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    }
  ]
}
```

```bash
# Apply lifecycle config
aws s3api put-bucket-lifecycle-configuration \
  --bucket my-bucket \
  --lifecycle-configuration file://lifecycle.json

# Verify
aws s3api get-bucket-lifecycle-configuration --bucket my-bucket
```

---

## Versioning

```bash
# Enable
aws s3api put-bucket-versioning \
  --bucket my-bucket \
  --versioning-configuration Status=Enabled

# List all versions of an object
aws s3api list-object-versions --bucket my-bucket --prefix data/record.json

# Restore previous version (copy specific version to latest)
aws s3api copy-object \
  --bucket my-bucket \
  --copy-source "my-bucket/data/record.json?versionId=abc123" \
  --key data/record.json

# Delete specific version permanently
aws s3api delete-object --bucket my-bucket --key data/record.json --version-id abc123

# MFA delete (requires MFA serial + code)
aws s3api put-bucket-versioning \
  --bucket my-bucket \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "arn:aws:iam::123456789:mfa/root-device 123456"
```

**Delete marker behavior:** A `DELETE` on a versioned object inserts a delete marker (makes it appear gone); the original versions are preserved. Hard-delete by removing the marker or a specific version ID.

---

## Replication

### Cross-Region Replication (CRR)
```bash
# 1. Enable versioning on both source and destination
aws s3api put-bucket-versioning --bucket source-bucket \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-versioning --bucket dest-bucket-eu \
  --versioning-configuration Status=Enabled

# 2. Create IAM role (trust: s3.amazonaws.com) with replication permissions
# 3. Apply replication config
aws s3api put-bucket-replication \
  --bucket source-bucket \
  --replication-configuration file://replication.json
```

```json
{
  "Role": "arn:aws:iam::123456789:role/s3-replication-role",
  "Rules": [
    {
      "ID": "replicate-all",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "Destination": {
        "Bucket": "arn:aws:s3:::dest-bucket-eu",
        "StorageClass": "STANDARD_IA"
      },
      "DeleteMarkerReplication": { "Status": "Enabled" }
    }
  ]
}
```

**SRR (Same-Region):** Identical setup — destination bucket in same region. Use for log aggregation, test/prod data sync.

---

## Transfer Acceleration

```bash
# Enable
aws s3api put-bucket-accelerate-configuration \
  --bucket my-bucket \
  --accelerate-configuration Status=Enabled

# Upload via accelerated endpoint
aws s3 cp large-file.bin s3://my-bucket/ \
  --endpoint-url https://my-bucket.s3-accelerate.amazonaws.com

# Test speed improvement
aws s3 ls s3://my-bucket \
  --endpoint-url https://my-bucket.s3-accelerate.amazonaws.com
```

**When to use:** Files >1 GB, users distributed globally or far from the bucket region. Uses CloudFront edge → AWS backbone — typically 60–200% faster for distant transfers.

---

## Bucket Policies vs IAM

| | Bucket Policy | IAM Policy |
|---|---|---|
| Attached to | Bucket (resource) | User / Role / Group |
| Cross-account access | Yes (primary mechanism) | Requires both sides |
| Anonymous (public) access | Yes | No |
| Best for | Resource-level permissions | Identity-level permissions |

### Bucket Policy Examples
```json
// Public read for static hosting
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-website-bucket/*"
  }]
}
```

```json
// Cross-account access
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::ACCOUNT-B:root" },
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::shared-bucket/*"
  }]
}
```

```json
// IP restriction
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": ["arn:aws:s3:::secure-bucket", "arn:aws:s3:::secure-bucket/*"],
    "Condition": { "NotIpAddress": { "aws:SourceIp": ["203.0.113.0/24"] } }
  }]
}
```

```bash
aws s3api put-bucket-policy --bucket my-bucket --policy file://policy.json
```

---

## CORS Configuration

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.example.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

```bash
aws s3api put-bucket-cors --bucket my-bucket --cors-configuration file://cors.json
```

---

## Event Notifications

```json
{
  "LambdaFunctionConfigurations": [
    {
      "LambdaFunctionArn": "arn:aws:lambda:us-east-1:123456789:function:process-upload",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": { "Key": { "FilterRules": [{ "Name": "suffix", "Value": ".jpg" }] } }
    }
  ],
  "QueueConfigurations": [
    {
      "QueueArn": "arn:aws:sqs:us-east-1:123456789:s3-events",
      "Events": ["s3:ObjectRemoved:*"]
    }
  ]
}
```

```bash
aws s3api put-bucket-notification-configuration \
  --bucket my-bucket \
  --notification-configuration file://notification.json
```

**Note:** Lambda resource policy must allow `s3.amazonaws.com` to invoke it. SQS queue policy must allow `s3.amazonaws.com` to `sqs:SendMessage`.

---

## Multipart Upload

Use for objects >100 MB. S3 CLI (`aws s3 cp`) handles this automatically.

```bash
# CLI auto-multipart — tune thresholds
aws s3 cp big-file.bin s3://my-bucket/ \
  --expected-size 5368709120 \
  --multipart-threshold 64MB \
  --multipart-chunksize 64MB
```

```python
# Manual multipart via boto3
import boto3, os

s3 = boto3.client("s3")
bucket, key, filepath = "my-bucket", "uploads/big-file.bin", "big-file.bin"

# 1. Initiate
resp = s3.create_multipart_upload(Bucket=bucket, Key=key)
upload_id = resp["UploadId"]

# 2. Upload parts (min 5 MB each except last)
parts, part_num = [], 1
chunk_size = 64 * 1024 * 1024  # 64 MB
with open(filepath, "rb") as f:
    while chunk := f.read(chunk_size):
        part = s3.upload_part(
            Bucket=bucket, Key=key,
            UploadId=upload_id, PartNumber=part_num, Body=chunk
        )
        parts.append({"PartNumber": part_num, "ETag": part["ETag"]})
        part_num += 1

# 3. Complete
s3.complete_multipart_upload(
    Bucket=bucket, Key=key, UploadId=upload_id,
    MultipartUpload={"Parts": parts}
)
```

---

## S3 Select

Query CSV/JSON/Parquet in-place — retrieve only matching rows, reducing data transfer.

```bash
# Query CSV (first row = header)
aws s3api select-object-content \
  --bucket my-bucket \
  --key data/users.csv \
  --expression "SELECT * FROM s3object WHERE s3object.country = 'US'" \
  --expression-type SQL \
  --input-serialization '{"CSV": {"FileHeaderInfo": "Use"}}' \
  --output-serialization '{"CSV": {}}' \
  output.csv
```

```python
response = s3.select_object_content(
    Bucket="my-bucket",
    Key="data/events.json",
    ExpressionType="SQL",
    Expression="SELECT s.userId, s.eventType FROM s3object s WHERE s.amount > 100",
    InputSerialization={"JSON": {"Type": "LINES"}},
    OutputSerialization={"JSON": {}},
)
for event in response["Payload"]:
    if "Records" in event:
        print(event["Records"]["Payload"].decode())
```

**Supported formats:** CSV, JSON (lines), Apache Parquet. Max object size 512 GB.

---

## Static Website Hosting

```bash
# Enable website hosting
aws s3api put-bucket-website \
  --bucket my-website-bucket \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "404.html"}
  }'

# Apply public-read bucket policy (Block Public Access must be disabled first)
aws s3api delete-public-access-block --bucket my-website-bucket

# Upload site
aws s3 sync ./dist s3://my-website-bucket/ --delete

# Website endpoint: http://my-website-bucket.s3-website-us-east-1.amazonaws.com
```

**Recommended:** Put CloudFront in front of S3 for HTTPS, custom domain, and caching (see CloudFront Integration section).

---

## Encryption

| Type | Key Management | Performance | Use Case |
|---|---|---|---|
| SSE-S3 (AES-256) | AWS manages | No overhead | Default, general purpose |
| SSE-KMS | Customer-managed CMK | KMS API calls (cost/throttle) | Audit trail, key rotation |
| SSE-C | Customer-provided | Client must send key on every request | Bring your own key |
| Client-side | Customer full control | Extra latency | Regulatory requirements |

```bash
# Enable bucket-level default encryption (SSE-S3)
aws s3api put-bucket-encryption \
  --bucket my-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'

# Default encryption with KMS key
aws s3api put-bucket-encryption \
  --bucket my-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:us-east-1:123456789:key/mrk-abc123"
      },
      "BucketKeyEnabled": true
    }]
  }'

# Upload with explicit SSE-KMS
aws s3 cp secret.txt s3://my-bucket/ \
  --sse aws:kms \
  --sse-kms-key-id alias/my-key
```

---

## VPC Endpoints (Gateway)

```bash
# Create Gateway endpoint for S3 (free, no NAT required)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-abc123 \
  --service-name com.amazonaws.us-east-1.s3 \
  --vpc-endpoint-type Gateway \
  --route-table-ids rtb-def456

# Endpoint policy (restrict to specific bucket)
aws ec2 modify-vpc-endpoint \
  --vpc-endpoint-id vpce-xyz789 \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }]
  }'
```

**Access from private subnets:** Once the gateway endpoint is associated with a route table, EC2/Lambda in private subnets route to S3 over AWS backbone — no NAT gateway, no internet charges.

---

## CloudFront Integration

### Origin Access Control (OAC) — Recommended over OAI

```bash
# 1. Create OAC
aws cloudfront create-origin-access-control \
  --origin-access-control-config '{
    "Name": "my-bucket-oac",
    "OriginAccessControlOriginType": "s3",
    "SigningBehavior": "always",
    "SigningProtocol": "sigv4"
  }'

# 2. Create distribution with S3 origin
aws cloudfront create-distribution \
  --distribution-config file://cf-distribution.json
```

```json
// cf-distribution.json (simplified)
{
  "Origins": {
    "Items": [{
      "Id": "s3-origin",
      "DomainName": "my-bucket.s3.us-east-1.amazonaws.com",
      "S3OriginConfig": { "OriginAccessIdentity": "" },
      "OriginAccessControlId": "<OAC_ID>"
    }]
  },
  "DefaultCacheBehavior": {
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "AllowedMethods": { "Items": ["GET", "HEAD"], "Quantity": 2 }
  },
  "DefaultRootObject": "index.html",
  "Enabled": true
}
```

```bash
# Bucket policy — grant CloudFront OAC access (NOT public)
# Principal service: cloudfront.amazonaws.com
# Condition: aws:SourceArn = distribution ARN

# Invalidate cache after deploy
aws cloudfront create-invalidation \
  --distribution-id EDFDVBD6EXAMPLE \
  --paths "/*"

# Signed URL for private content (CLI)
aws cloudfront sign \
  --url "https://d123.cloudfront.net/private/file.pdf" \
  --key-pair-id KXXXXX \
  --private-key file://cloudfront-private-key.pem \
  --date-less-than 2026-12-31
```

**Pattern — Private S3 + CloudFront:** Keep bucket fully private (Block Public Access: ON), grant only the OAC principal via bucket policy. All traffic goes through CloudFront with HTTPS + caching + WAF.
