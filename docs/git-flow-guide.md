# Git Flow Guide — WORLDCOLIDE

## Tổng quan

Project này sử dụng **Git Flow** — một branching strategy có cấu trúc rõ ràng giúp quản lý release, tính năng, và hotfix song song.

```
main ──────────────────────────────────── (stable, production)
         ↑                        ↑
develop ─────────────────────────────────  (integration branch)
         ↑          ↑
feature/HTM-XXX   feature/HTM-YYY
```

---

## Cấu trúc Branch

| Branch | Mục đích | Tạo từ | Merge vào |
|--------|----------|--------|-----------|
| `main` | Production-ready code, stable releases | — | — |
| `develop` | Integration branch cho next release | `main` | — |
| `feature/HTM-XXX` | Tính năng mới | `develop` | `develop` |
| `release/x.x.x` | Chuẩn bị release | `develop` | `main` + `develop` |
| `hotfix/HTM-XXX` | Fix bug khẩn cấp trên production | `main` | `main` + `develop` |
| `bugfix/HTM-XXX` | Fix bug trên develop | `develop` | `develop` |

---

## Workflow Chi Tiết

### 1. Làm tính năng mới (Feature)

```bash
# Bắt đầu từ develop
git checkout develop
git pull origin develop

# Tạo feature branch
git checkout -b feature/HTM-1234

# Làm việc, commit theo conventional commits
git add -A
git commit -m "HTM-1234 : add logging site harvest UI"

# Push và tạo PR
git push -u origin feature/HTM-1234
gh pr create --base develop --title "HTM-1234 : add logging site harvest UI"
```

### 2. Fix bug trên develop (Bugfix)

```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/HTM-5678

# Fix bug, commit
git commit -m "HTM-5678 : fix logging site reserve depletion edge case"

git push -u origin bugfix/HTM-5678
gh pr create --base develop --title "HTM-5678 : fix logging site reserve depletion"
```

### 3. Chuẩn bị Release

```bash
# Tạo release branch từ develop
git checkout develop
git pull origin develop
git checkout -b release/1.2.0

# Chỉ được phép: bump version, fix minor bugs, update changelog
# KHÔNG thêm tính năng mới

# Update version
npm version minor --no-git-tag-version
git commit -m "chore(release): bump version to 1.2.0"

# Merge vào main
git checkout main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main --tags

# Merge lại vào develop để sync
git checkout develop
git merge --no-ff release/1.2.0
git push origin develop

# Xóa release branch
git branch -d release/1.2.0
git push origin --delete release/1.2.0
```

### 4. Hotfix — Fix bug khẩn cấp trên production

```bash
# Tạo hotfix từ main (không phải develop!)
git checkout main
git pull origin main
git checkout -b hotfix/HTM-9999

# Fix bug
git commit -m "HTM-9999 : fix critical gold calculation overflow"

# Merge vào main
git checkout main
git merge --no-ff hotfix/HTM-9999
git tag -a v1.1.1 -m "Hotfix v1.1.1"
git push origin main --tags

# Merge vào develop để sync fix
git checkout develop
git merge --no-ff hotfix/HTM-9999
git push origin develop

# Xóa hotfix branch
git branch -d hotfix/HTM-9999
git push origin --delete hotfix/HTM-9999
```

---

## Commit Message Convention

**Format:** `HTM-XXXX : description`

| Type | Khi nào dùng | Ví dụ |
|------|-------------|-------|
| feat | Tính năng mới | `HTM-1234 : add stone quarry facility` |
| fix | Sửa bug | `HTM-5678 : fix member stuck in assigned state` |
| chore | Config, deps, tooling | `chore(deps): update vite to 6.3` |
| docs | Cập nhật docs | `docs: update git flow guide` |
| refactor | Tái cấu trúc (không đổi behavior) | `HTM-1111 : extract combat helpers` |
| test | Thêm/sửa tests | `test: add logging site tick tests` |
| perf | Cải thiện performance | `HTM-2222 : optimize sprite batching` |

**Rules:**
- Giới hạn **< 72 ký tự**
- Dùng **present tense, imperative** ("add" không phải "added")
- Không dấu chấm cuối câu
- **KHÔNG** để lộ thông tin nhạy cảm, API keys, credentials

---

## Pull Request Rules

- **Feature/Bugfix PR** → target `develop`
- **Release/Hotfix PR** → target `main`
- PR title phải match commit message format
- Cần pass CI trước khi merge
- Dùng **Squash merge** cho feature branches nhỏ, **Merge commit** cho release/hotfix

---

## Branch Naming

| Loại | Format | Ví dụ |
|------|--------|-------|
| Feature | `feature/HTM-XXXX` | `feature/HTM-1234` |
| Bugfix | `bugfix/HTM-XXXX` | `bugfix/HTM-5678` |
| Release | `release/x.x.x` | `release/1.2.0` |
| Hotfix | `hotfix/HTM-XXXX` | `hotfix/HTM-9999` |

---

## Protected Branches

- **`main`** — KHÔNG commit trực tiếp. Chỉ merge qua PR từ `release/*` hoặc `hotfix/*`
- **`develop`** — KHÔNG commit trực tiếp. Chỉ merge qua PR từ `feature/*` hoặc `bugfix/*`

---

## Quick Reference

```bash
# Xem tất cả branches
git branch -a

# Sync develop mới nhất
git checkout develop && git pull origin develop

# Tạo feature branch
git checkout -b feature/HTM-XXXX develop

# Xem status
git status

# Xem log đẹp
git log --oneline --graph --decorate -10
```
