# Kubernetes Workflows Advanced

## CI/CD Pipeline
```yaml
# GitHub Actions — ECR + EKS
name: Build and Deploy
on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
  ECR_REPOSITORY: myapp

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build and push image to ECR
      run: |
        IMAGE=${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}
        docker build . -t $IMAGE
        docker push $IMAGE

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
      with:
        repository: myorg/gitops-repo
        token: ${{ secrets.GITOPS_TOKEN }}
    - run: |
        IMAGE=${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}
        sed -i "s|image:.*|image: $IMAGE|" k8s/deployment.yaml
        git commit -am "Update image to ${{ github.sha }}" && git push
```

## Kustomize

```
kustomize/
├── base/
│   ├── kustomization.yaml
│   └── deployment.yaml
└── overlays/
    └── prod/
        └── kustomization.yaml
```

### Base
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
commonLabels:
  app: myapp
```

### Prod Overlay
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base
replicas:
- name: myapp
  count: 5
```

```bash
kubectl apply -k overlays/prod/
```

## Flux CD
```bash
flux bootstrap github \
  --owner=myorg \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/my-cluster
```
