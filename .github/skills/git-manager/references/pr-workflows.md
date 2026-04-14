# PR Workflows

## CRITICAL: Use REMOTE diff for PR content

**Why:** PRs are based on remote branches. Local diff includes uncommitted/unpushed changes that won't be in the PR.

## PR TOOL 1: Sync and analyze remote state

```bash
git fetch origin && \
git push -u origin HEAD 2>/dev/null || true && \
BASE=${BASE_BRANCH:-main} && \
HEAD=$(git rev-parse --abbrev-ref HEAD) && \
echo "=== PR: $HEAD → $BASE ===" && \
echo "=== COMMITS ===" && \
git log origin/$BASE...origin/$HEAD --oneline 2>/dev/null || echo "Branch not on remote yet" && \
echo "=== FILES ===" && \
git diff origin/$BASE...origin/$HEAD --stat 2>/dev/null || echo "No remote diff available"
```

**Read output ONCE. Extract:**
- COMMITS: list of commits in PR
- FILES: changed files with insertions/deletions

**If "Branch not on remote yet":**
- Push first: `git push -u origin HEAD`
- Re-run analysis

## PR TOOL 2: Generate PR title and body

```bash
gemini -y -p "Create PR title and body from these commits: $(git log origin/$BASE...origin/$HEAD --oneline). Title: conventional commit format <72 chars. NO release/version numbers in title. Body: ## Summary with 2-3 bullet points, ## Test plan with checklist. No AI attribution." --model gemini-2.5-flash
```

**If gemini unavailable:** Create from commit list yourself.

## PR TOOL 3: Create PR

```bash
gh pr create --base $BASE --head $HEAD --title "TITLE" --body "$(cat <<'EOF'
## Summary
- Bullet points here

## Test plan
- [ ] Test item
EOF
)"
```

## PR Analysis Rules

**DO use (remote comparison):**
- `git diff origin/main...origin/feature`
- `git log origin/main...origin/feature`

**DO NOT use (local comparison):**
- ❌ `git diff main...HEAD` (includes unpushed)
- ❌ `git diff --cached` (staged local)
- ❌ `git status` (local working tree)

## Pre-PR Checklist

- Fetch latest: `git fetch origin`
- Push branch: `git push -u origin HEAD`
- Sync with base: `git merge origin/main` (resolve conflicts if any)
- Verify remote diff matches expected changes

## PR Error Handling

| Error | Detection | Action |
|-------|-----------|--------|
| Branch not on remote | "Branch not on remote yet" output | `git push -u origin HEAD`, retry |
| Empty diff | No commits/files in output | Warn user: "No changes to create PR for" |
| Diverged branches | Push rejected | `git pull --rebase origin $HEAD`, resolve conflicts, push |
| Network failure | Command timeout/failure | Retry once, then report connectivity issue |
| Protected branch | Push rejected with protection msg | Warn user: PR required (cannot push directly) |
| No upstream set | "no upstream branch" error | `git push -u origin HEAD` |

**Fallback for gemini unavailable:**
1. Extract commit subjects: `git log origin/$BASE...origin/$HEAD --pretty=%s`
2. Title: Use first commit subject or summarize if multiple. NO release/version numbers
3. Body: List all commit subjects as bullet points under "## Summary"
