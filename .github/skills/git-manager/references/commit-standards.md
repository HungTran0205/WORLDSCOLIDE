# Commit Message Standards

## Format

**Structure:** `HTM-XXXX : description`

**Components:**
- `HTM-XXXX`: The Jira ticket ID (must match current branch ticket)
- `description`: A concise summary of the change

## Rules

- **<72 characters** (not 70, not 80)
- **Present tense, imperative mood** ("add feature" not "added feature")
- **No period at end**
- **Focus on WHAT changed, not HOW** it was implemented
- **Be concise but descriptive** - anyone should understand the change

## CRITICAL - NEVER include AI attribution

❌ **Forbidden:**
- "🤖 Generated with [Claude Code]"
- "Co-Authored-By: Claude <noreply@anthropic.com>"
- "AI-assisted commit"
- Any AI tool attribution, signature, or reference

## Examples

**Good:**
- `HTM-1234 : add user login validation`
- `HTM-9988 : resolve timeout in database queries`
- `HTM-1122 : update installation instructions`
- `HTM-3344 : simplify date formatting logic`

**Bad:**
- ❌ `Updated some files` (missing ID)
- ❌ `feat(auth): added user login validation` (wrong format)
- ❌ `HTM-1234: fixed` (not descriptive)
- ❌ `HTM-1234: This commit adds user login validation feature` (too verbose)

## Why Clean Commits Matter

- **Git history persists** across Claude Code sessions
- **Future agents use `git log`** to understand project evolution
- **Commit messages become project documentation** for the team
- **Clean history = better context** for all future work
- **Professional standard** - treat commits as permanent record

## Split Commit Examples

**Example 1 - Mixed types (should split):**
```
Files: package.json, src/auth.ts, README.md
Split into:
1. HTM-1234 : update axios to 1.6.0
2. HTM-1234 : add JWT validation
3. HTM-1234 : update authentication guide
```

**Example 2 - Multiple scopes (should split):**
```
Files: src/auth/login.ts, src/payments/stripe.ts, src/users/profile.ts
Split into:
1. HTM-1111 : add login rate limiting
2. HTM-2222 : integrate Stripe checkout
3. HTM-3333 : add profile editing
```

**Example 3 - Related files (keep single):**
```
Files: src/auth/login.ts, src/auth/logout.ts, src/auth/middleware.ts
Single commit: HTM-1234 : implement session management
```

**Example 4 - Config + code (should split):**
```
Files: .github/commands/new.md, src/feature.ts, package.json
Split into:
1. HTM-1234 : add /new command
2. HTM-1234 : add new-library dependency
3. HTM-1234 : implement new feature
```
