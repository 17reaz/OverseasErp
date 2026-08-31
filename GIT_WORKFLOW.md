# Git Workflow Quick Reference

## Branch Strategy (Git Flow)

```
┌─────────────────────────────────────────────────────────┐
│                      PRODUCTION (main)                   │
│                  (tagged: v1.0.0, v1.0.1, etc)          │
└────────────────────────┬────────────────────────────────┘
                         │
        (hotfix/critical-fix merged after testing)
                         │
┌────────────────────────▼────────────────────────────────┐
│                   STAGING (develop)                      │
│        (integration point for all features)             │
└──┬──────────────┬──────────────┬──────────────┬─────────┘
   │              │              │              │
   ▼              ▼              ▼              ▼
feature/    bugfix/         refactor/      docs/
auth        login           perf-opt        api-guide

(Feature branches - created & merged via PR)
```

## Daily Workflow

### Starting New Work
```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make commits with meaningful messages
git add .
git commit -m "feat: add user dashboard"
git commit -m "feat: add filtering logic"

# 4. Push and create PR
git push origin feature/your-feature-name
# Create PR on GitHub with description
```

### Branch Naming
- `feature/user-authentication` - New features
- `bugfix/login-page-error` - Bug fixes  
- `hotfix/payment-critical` - Critical production fixes
- `refactor/database-schema` - Code improvements
- `docs/deployment-guide` - Documentation

### Commit Message Format
```
<type>(<scope>): <short summary>

<detailed explanation if needed>

Closes #123
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`

### Before Creating PR
```bash
# 1. Update from develop
git fetch origin
git rebase origin/develop

# 2. Run tests locally
npm run typecheck
npm run lint

# 3. Build to ensure it works
npm run build
```

### PR Process
1. **Create PR** with template filled
2. **Link issues**: Add `Closes #456` to description
3. **Request review**: Add reviewers
4. **Wait for CI**: GitHub Actions must pass
5. **Merge**: Click "Squash and merge" (auto-closes issue)

### After Merge
```bash
# Update local develop
git checkout develop
git pull origin develop

# Delete old feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## Release Process

### Create Release Branch
```bash
git checkout -b release/v1.1.0 develop
# Update version in package.json
# Update CHANGELOG.md
# Commit changes
git push origin release/v1.1.0
```

### Merge to Production
```bash
# Create PR from release/v1.1.0 to main
# Once approved, merge (Create merge commit)
# Tag the release
git checkout main
git pull
git tag v1.1.0
git push origin v1.1.0
# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

## Handling Different Scenarios

### Hotfix (Urgent Production Bug)
```bash
git checkout -b hotfix/urgent-fix main
# Fix the bug
git push origin hotfix/urgent-fix
# Create PR to main, merge, tag as v1.0.1
# Then merge to develop
git checkout develop
git merge main
git push
```

### Keep Feature Branch Updated
```bash
git fetch origin
git rebase origin/develop
git push -f origin feature/your-feature-name
```

### Undo Last Commit (Before Push)
```bash
git reset --soft HEAD~1
# Edit files
git add .
git commit -m "fixed message"
```

### Squash Commits on Feature Branch
```bash
git rebase -i origin/develop
# Mark commits as 'squash' (s) except the first
# Save and resolve any conflicts
git push -f origin feature/your-feature-name
```

## Main vs Develop
- **main**: Production code only, always stable, tagged with versions
- **develop**: Integration branch, tested but may have new features

## Rules
1. ✅ Always create branches from `develop` (except hotfixes from `main`)
2. ✅ Never commit directly to `main` or `develop`
3. ✅ Use PRs for all changes
4. ✅ Require 1 review before merge
5. ✅ CI/CD must pass
6. ✅ Squash commits on feature branches
7. ✅ Delete merged branches
8. ✅ Tag all releases

