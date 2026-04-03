# Contributing to Corne CLI

Thank you for your interest in contributing to Corne CLI! 🎉

## Getting Started

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   git clone https://github.com/YOUR_USERNAME/corne-cli.git
   cd corne-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running in Development Mode

```bash
npm run dev -- --help
```

### Building the Project

```bash
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Format code
npm run format
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or updates
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add support for Lily58 keyboard"
git commit -m "fix: resolve bootloader detection on macOS"
git commit -m "docs: update installation guide"
```

## Pull Request Process

1. **Update documentation** - Ensure README and other docs reflect your changes
2. **Add tests** - All new features should have tests
3. **Run tests** - Make sure all tests pass before submitting
4. **Update CHANGELOG.md** - Add your changes under "Unreleased"
5. **Create PR** - Submit your pull request with a clear description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] CHANGELOG.md updated
```

## Code Style

- **TypeScript** - Use strict mode
- **Naming** - Clear, descriptive names (avoid abbreviations)
- **Types** - Explicit return types for public functions
- **Comments** - JSDoc for all public APIs
- **Error handling** - Use custom error classes with helpful messages

## Project Structure

```
src/
├── commands/      # CLI command implementations
├── core/          # Core functionality
│   ├── bootloader/
│   ├── compiler/
│   ├── keymap/
│   └── config/
├── ui/            # Terminal UI components
├── utils/         # Shared utilities
└── types/         # TypeScript types
```

## Testing Guidelines

### Unit Tests

- Test individual functions in isolation
- Mock external dependencies (USB devices, file system)
- Use descriptive test names

```typescript
describe('BootloaderDetector', () => {
  it('should detect Caterina bootloader from VID/PID', () => {
    // Your test here
  });
});
```

### Integration Tests

- Test complete workflows
- Use fixture data for consistent results
- Test error conditions

## Areas Where Help is Needed

- 🎹 Testing on different keyboard models (Lily58, Sofle, Kyria)
- 🍎 macOS and Linux support improvements
- 🎨 Community animation library
- 🌍 Documentation translations
- 🐛 Bug reports and feature requests
- 📚 Documentation improvements

## GitHub Copilot Agents

This project uses specialized agents. See [.github/agents/README.md](.github/agents/README.md):

- `@qmk-firmware` - QMK compilation and configuration
- `@flasher` - Bootloader detection and flashing
- `@keymap-manager` - Keymap management
- `@cli-dev` - CLI structure and UX
- `@testing` - Test writing and mocking

## Questions?

- 📫 [GitHub Issues](https://github.com/flecherdev/corne-cli/issues)
- 💬 [GitHub Discussions](https://github.com/flecherdev/corne-cli/discussions)

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build great tools for the mechanical keyboard community! ❤️

---

Thank you for contributing! 🎉
