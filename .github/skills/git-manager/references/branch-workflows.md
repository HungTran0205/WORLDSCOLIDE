# Branch Workflows

## Global Rules

1. **Branch Naming**: MUST use `feature/{Jira-Code}` OR `bugfix/{Jira-Code}` (e.g. `feature/HTM-12345`, `bugfix/HTM-9988`)
2. **Base Branch**: ALWAYS create from repository's default branch (e.g. `main`, `release/CI_...`)
3. **Protected Branches**: NEVER commit directly to default branches. ALWAYS work on feature/bugfix branch

## Branch Creation Workflow

**Trigger**: User asks to create/switch branch

**Steps**:
1. Identify Jira Ticket (e.g., HTM-1234) and Type (feature vs bugfix)
2. Fetch and identify default branch
3. Create new branch from origin default

**Command**:
```bash
git fetch origin && \
DEFAULT=$(git remote show origin | sed -n 's/.*HEAD branch: //p') && \
echo "Base branch: $DEFAULT" && \
git checkout -b "feature/HTM-XXXX" "origin/$DEFAULT"
```

Replace `feature/HTM-XXXX` with actual branch name based on Jira ticket and type.

## Branch Check

Before committing, verify not on protected branch:
```bash
CURRENT=$(git branch --show-current) && \
if [[ "$CURRENT" =~ ^(main|master|release.*|release_aws.*) ]]; then 
  echo "❌ STOP. On protected branch: $CURRENT. Switch to feature/* or bugfix/* branch."
  exit 1
fi
```

This check is integrated into commit workflows.
