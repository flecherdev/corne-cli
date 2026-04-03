---
applyTo:
  - "publicar a npm"
  - "subir a npm"
  - "publish npm"
  - "publicar nueva version"
  - "deploy npm"
toolRestrictions:
  allow:
    - read_file
    - replace_string_in_file
    - run_in_terminal
    - grep_search
---

# NPM Publishing Automation Skill

**Purpose**: Automate complete npm publishing workflow with version bump and changelog update.

## Workflow

### 1. Determine Version Bump
- Read current version from package.json
- Ask user or infer from commit messages:
  - **patch** (0.0.x): Bug fixes, documentation
  - **minor** (0.x.0): New features, non-breaking changes
  - **major** (x.0.0): Breaking changes

### 2. Update Version
- Bump version in package.json
- Follow semantic versioning (semver.org)

### 3. Update CHANGELOG.md
- Add new version entry at the top
- Include date (YYYY-MM-DD format)
- Categorize changes:
  - ✨ Added
  - 🐛 Fixed
  - 📝 Changed
  - 🗑️ Removed
  - ⚠️ Deprecated

### 4. Build & Publish
```bash
npm run build    # Compile TypeScript
npm publish      # Publish to registry
```

### 5. Git Commit & Push
```bash
git add -A
git commit -m "chore: Release v{VERSION}"
git push origin main
```

## Context Requirements

**Minimal** - Only needs:
- Current version number
- Type of changes (for version bump)

**Does NOT need**:
- Full project history
- Detailed file contents
- Previous conversations

## Token Optimization

- Use single read for package.json
- Use grep to find CHANGELOG position
- Batch git operations (add + commit + push in one command)
- No verbose output needed

## Example Usage

User: "publicar a npm"

Agent should:
1. Read package.json version (1 operation)
2. Ask version type if not obvious (1 question)
3. Update files (2 operations via multi_replace)
4. Build + publish (1 terminal command)
5. Git operations (1 batched terminal command)

**Total**: ~5 operations vs ~15 without skill

## Expected Token Savings

- **Without skill**: ~15,000 tokens
- **With skill**: ~5,000 tokens
- **Savings**: ~67%
