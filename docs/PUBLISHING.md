# Publishing to npm

## Prerequisites

1. **npm account** - Create one at [npmjs.com](https://www.npmjs.com/)
2. **npm access token** - Generate from your npm account settings

## Setup npm Token in GitHub

1. Go to your npm account settings
2. Create a new access token with "Automation" type
3. Copy the token
4. Go to your GitHub repository → Settings → Secrets and variables → Actions
5. Create a new secret named `NPM_TOKEN` and paste your token

## Automated Publishing (Recommended)

The repository is configured with GitHub Actions to automatically publish to npm when you create a release:

### Option 1: Create a GitHub Release

1. Update version in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

2. Push the changes and tag:
   ```bash
   git push origin main --tags
   ```

3. Create a release on GitHub:
   - Go to "Releases" → "Draft a new release"
   - Select the tag you just pushed
   - Write release notes
   - Publish release

4. GitHub Actions will automatically:
   - Run tests
   - Build the project
   - Publish to npm

### Option 2: Manual Workflow Dispatch

1. Go to Actions → "Publish to npm" → "Run workflow"
2. Select the branch (usually `main`)
3. Click "Run workflow"

## Manual Publishing (Not Recommended)

If you need to publish manually:

1. **Login to npm**:
   ```bash
   npm login
   ```

2. **Update version**:
   ```bash
   npm version patch  # or minor, or major
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Publish**:
   ```bash
   npm publish --access public
   ```

## Pre-publishing Checklist

Before publishing a new version:

- [ ] All tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] CHANGELOG.md is updated
- [ ] README.md is up to date
- [ ] Version number is bumped in `package.json`
- [ ] All changes are committed and pushed

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0) - Breaking changes
- **MINOR** (0.1.0) - New features, backwards compatible
- **PATCH** (0.0.1) - Bug fixes, backwards compatible

Examples:
```bash
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.1 → 0.2.0
npm version major  # 0.2.0 → 1.0.0
```

## After Publishing

1. Verify the package on npm:
   ```bash
   npm view corne-cli
   ```

2. Test installation:
   ```bash
   npm install -g corne-cli@latest
   corne-cli --version
   ```

3. Announce the release:
   - GitHub Discussions
   - Social media
   - Community forums

## Troubleshooting

### "You cannot publish over the previously published versions"

- You need to bump the version number
- Run `npm version patch` (or minor/major)

### "Permission denied"

- Make sure you're logged in: `npm login`
- Verify you have permission to publish this package

### "Package name already exists"

- The package name is taken
- Choose a different name in `package.json`
- You might want to use a scoped package: `@username/corne-cli`

## Package Info

- **Name**: `corne-cli`
- **Registry**: [npmjs.com](https://www.npmjs.com/package/corne-cli)
- **Install**: `npm install -g corne-cli`
- **Repository**: [github.com/flecherdev/corne-cli](https://github.com/flecherdev/corne-cli)
