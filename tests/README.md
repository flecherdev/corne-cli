# Corne CLI Tests

## Structure

- **unit/** - Unit tests for individual functions and classes
- **integration/** - Integration tests for multi-component workflows
- **mocks/** - Mock implementations of hardware and external tools
- **fixtures/** - Test data and sample configurations
- **helpers/** - Test utilities and helper functions

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Using @testing Agent

The @testing agent can help you write comprehensive tests:

```
@testing help me create mocks for USB devices
@testing write integration tests for the flash workflow
@testing create unit tests for keymap validation
```
