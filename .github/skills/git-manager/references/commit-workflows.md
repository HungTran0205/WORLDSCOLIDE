# Commit Workflows

Execute in EXACTLY 2-4 tool calls. No exploration phase.

## TOOL 1: Branch Check + Stage + Security + Metrics + Split Analysis

Execute this compound command:
```bash
CURRENT=$(git branch --show-current) && \
if [[ "$CURRENT" =~ ^(main|master|release.*|release_aws.*) ]]; then echo "❌ STOP. On protected branch: $CURRENT. Switch to feature/* or bugfix/* branch."; exit 1; fi && \
git add -A && \
echo "=== STAGED FILES ===" && \
git diff --cached --stat && \
echo "=== METRICS ===" && \
git diff --cached --shortstat | awk '{ins=$4; del=$6; print "LINES:"(ins+del)}' && \
git diff --cached --name-only | awk 'END {print "FILES:"NR}' && \
echo "=== SECURITY ===" && \
git diff --cached | grep -c -iE "(api[_-]?key|token|password|secret|private[_-]?key|credential)" | awk '{print "SECRETS:"$1}' && \
echo "=== FILE GROUPS ===" && \
git diff --cached --name-only | awk -F'/' '{
  if ($0 ~ /\.(md|txt)$/) print "docs:"$0
  else if ($0 ~ /test|spec/) print "test:"$0
  else if ($0 ~ /\.github\/(skills|agents|commands|rules)/) print "config:"$0
  else if ($0 ~ /package\.json|yarn\.lock|pnpm-lock/) print "deps:"$0
  else if ($0 ~ /\.github|\.gitlab|ci\.yml/) print "ci:"$0
  else print "code:"$0
}'
```

**Read output ONCE. Extract:**
- LINES: total insertions + deletions
- FILES: number of files changed
- SECRETS: count of secret patterns
- FILE GROUPS: categorized file list

**If SECRETS > 0:**
- STOP immediately
- Show matched lines: `git diff --cached | grep -iE -C2 "(api[_-]?key|token|password|secret)"`
- Block commit, suggest .gitignore
- EXIT

## Split Decision Logic

Analyze FILE GROUPS. **Split into multiple commits if ANY:**
1. Different types mixed (feat + fix, or feat + docs, or code + deps)
2. Multiple scopes in code files (frontend + backend, auth + payments)
3. Config/deps + code mixed together
4. FILES > 10 with unrelated changes

**Keep single commit if:**
- All files same type/scope
- FILES ≤ 3
- LINES ≤ 50
- All files logically related (e.g., all auth feature files)

## TOOL 2: Split Strategy (If needed)

**A) Single Commit (keep as is):**
- Skip to TOOL 3
- All changes go into one commit

**B) Multi Commit (split required):**
Delegate to Gemini for split analysis:
```bash
gemini -y -p "Analyze these files and create logical commit groups: $(git diff --cached --name-status). Rules: 1) Group by type (feat/fix/docs/chore/deps/ci). 2) Group by scope if same type. 3) Never mix deps with code. 4) Never mix config with features. Output format: GROUP1: type(scope): description | file1,file2,file3 | GROUP2: ... Max 4 groups. <72 chars per message." --model gemini-2.5-flash
```

**Parse output into groups:**
- Extract commit message and file list for each group
- Store for sequential commits in TOOL 3+4

**If gemini unavailable:** Create groups yourself from FILE GROUPS:
- Group 1: All `config:` files → `chore(config): ...`
- Group 2: All `deps:` files → `chore(deps): ...`
- Group 3: All `test:` files → `test: ...`
- Group 4: All `code:` files → `feat|fix: ...`
- Group 5: All `docs:` files → `docs: ...`

## TOOL 3: Generate Commit Message(s)

**A) Single Commit - Simple (LINES ≤ 30 AND FILES ≤ 3):**
- Create message yourself from Tool 1 stat output
- Format: `HTM-XXXX : description` (Extract HTM id from branch name)

**B) Single Commit - Complex (LINES > 30 OR FILES > 3):**
```bash
BRANCH=$(git branch --show-current) && \
JIRA_ID=$(echo "$BRANCH" | grep -o "HTM-[0-9]*") && \
if [ -z "$JIRA_ID" ]; then JIRA_ID="HTM-XXXX"; fi && \
gemini -y -p "Create commit message from diff: $(git diff --cached | head -300). Format: '$JIRA_ID : description'. <72 chars. Focus on WHAT changed. No AI attribution." --model gemini-2.5-flash
```

**C) Multi Commit:**
- Use messages from Tool 2 split groups (Adjust format to `HTM-XXXX : description`)
- Prepare commit sequence

**If gemini unavailable:** Fallback to creating message yourself.

## TOOL 4: Commit + Push

**A) Single Commit:**
```bash
git commit -m "HTM-XXXX : DESCRIPTION" && \
HASH=$(git rev-parse --short HEAD) && \
echo "✓ commit: $HASH $(git log -1 --pretty=%s)" && \
if git push 2>&1; then echo "✓ pushed: yes"; else echo "✓ pushed: no (run 'git push' manually)"; fi
```

**B) Multi Commit (sequential):**
For each group from Tool 2:
```bash
git reset && \
git add file1 file2 file3 && \
git commit -m "HTM-XXXX : DESCRIPTION" && \
HASH=$(git rev-parse --short HEAD) && \
echo "✓ commit $N: $HASH $(git log -1 --pretty=%s)"
```

After all commits:
```bash
if git push 2>&1; then echo "✓ pushed: yes (N commits)"; else echo "✓ pushed: no (run 'git push' manually)"; fi
```

Replace HTM-XXXX : DESCRIPTION with generated messages.
Replace file1 file2 file3 with group's file list.

**Only push if user explicitly requested** (keywords: "push", "and push", "commit and push").

## Error Handling

| Error              | Response                                      | Action                                   |
| ------------------ | --------------------------------------------- | ---------------------------------------- |
| Secrets detected   | "❌ Secrets found in: [files]" + matched lines | Block commit, suggest .gitignore         |
| No changes staged  | "❌ No changes to commit"                      | Exit cleanly                             |
| Nothing to add     | "❌ No files modified"                         | Exit cleanly                             |
| Merge conflicts    | "❌ Conflicts in: [files]"                     | Suggest `git status` → manual resolution |
| Push rejected      | "⚠ Push rejected (out of sync)"               | Suggest `git pull --rebase`              |
| Gemini unavailable | Create message yourself                       | Silent fallback, no error shown          |
