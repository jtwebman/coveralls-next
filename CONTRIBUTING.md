# Contributing to coveralls-next

Thank you for your interest in contributing to coveralls-next! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/coveralls-next.git
   cd coveralls-next
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/nickmerwin/coveralls-next.git
   ```

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Git

### Installation

```bash
# Install dependencies
npm install

# Run tests to verify setup
npm test

# Run tests with coverage
npm run test-cov
```

## Project Structure

```
coveralls-next/
├── bin/
│   └── coveralls.js          # CLI entry point
├── lib/
│   ├── convertLcovToCoveralls.js  # LCOV to Coveralls format conversion
│   ├── detectLocalGit.js          # Local git repository detection
│   ├── fetchGitData.js            # Git metadata extraction
│   ├── getOptions.js              # Configuration and options parsing
│   ├── handleInput.js             # Input processing orchestration
│   ├── logger.js                  # Logging utility
│   └── sendToCoveralls.js         # API communication
├── test/                      # Test files (mirror lib/ structure)
└── index.js                   # Main entry point
```

## Coding Standards

### Style Guide

- **JavaScript Standard**: We follow Node.js best practices
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line Length**: Max 100 characters when reasonable

### Linting

```bash
# Check code style
npm run lint

# Auto-fix style issues
npm run lint -- --fix
```

### Documentation

- Add JSDoc comments for all exported functions
- Include descriptions, parameter types, return types, and error conditions
- Update README.md if adding new features or changing behavior

Example:
```javascript
/**
 * Converts LCOV coverage data to Coveralls format
 * @param {string} input - LCOV format string or file path
 * @param {Object} options - Configuration options
 * @param {Function} callback - Callback function (err, coverallsData)
 * @throws {Error} If input is invalid or file cannot be read
 */
function convertLcovToCoveralls(input, options, callback) {
  // ...
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test-cov

# Run only mocha tests (skip linting)
npm run mocha

# Run tests in watch mode (requires npm install --save-dev mocha)
npx mocha --watch
```

### Writing Tests

- Place test files in `test/` directory
- Name test files to match source files (e.g., `lib/foo.js` → `test/foo.js`)
- Use the `should` assertion library (already included)
- Use `proxyquire` for mocking modules
- Aim for 100% code coverage

Example test structure:
```javascript
'use strict';

const should = require('should');
const proxyquire = require('proxyquire');
const myModule = require('../lib/myModule');

describe('myModule', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something specific', done => {
    myModule.doSomething((err, result) => {
      should.not.exist(err);
      result.should.equal('expected');
      done();
    });
  });
});
```

### Test Coverage Requirements

- All new code must have tests
- Maintain 100% coverage (statements, branches, functions, lines)
- Run `npm run test-cov` before submitting PR

## Submitting Changes

### Before Submitting

1. **Update tests**: Add or modify tests for your changes
2. **Run tests**: Ensure all tests pass (`npm test`)
3. **Check coverage**: Verify 100% coverage (`npm run test-cov`)
4. **Lint code**: Fix any linting issues (`npm run lint`)
5. **Update docs**: Modify README.md or JSDoc as needed
6. **Commit message**: Write clear, descriptive commit messages

### Commit Message Format

Use conventional commit format:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(retry): add exponential backoff for network failures

Implements retry logic with exponential backoff (max 3 attempts)
for 5xx errors when sending coverage data to Coveralls API.

Closes #123
```

### Pull Request Process

1. **Update your fork**:
   ```bash
   git fetch upstream
   git checkout master
   git merge upstream/master
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

3. **Make your changes** and commit them

4. **Push to your fork**:
   ```bash
   git push origin feature/my-feature
   ```

5. **Open a Pull Request** on GitHub with:
   - Clear title and description
   - Reference any related issues
   - Screenshots/examples if applicable
   - Checklist of changes made

6. **Respond to feedback**: Address review comments promptly

### Pull Request Checklist

- [ ] Tests added/updated and passing
- [ ] Code coverage maintained at 100%
- [ ] Linting passes without errors
- [ ] Documentation updated (README, JSDoc)
- [ ] Commit messages follow conventional format
- [ ] Branch is up to date with master
- [ ] No merge conflicts

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Minimal steps to reproduce the problem
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**:
  - Node.js version (`node --version`)
  - npm version (`npm --version`)
  - Operating system
  - CI environment (if applicable)
- **Logs**: Relevant error messages or logs
- **Sample Code**: Minimal reproducible example if possible

### Feature Requests

When requesting features, please include:

- **Description**: Clear description of the feature
- **Use Case**: Why this feature would be useful
- **Proposed Solution**: How you envision it working
- **Alternatives**: Other solutions you've considered

## Development Tips

### Debugging

Enable debug logging:
```bash
export NODE_COVERALLS_DEBUG=1
# or
node --inspect bin/coveralls.js
```

### Testing with Real Coverage Data

```bash
# Generate coverage for this project
npm run test-cov

# Send to Coveralls (requires COVERALLS_REPO_TOKEN)
cat coverage/lcov.info | node bin/coveralls.js
```

### Working with Git

```bash
# Test git-related functionality
node -e "require('./lib/fetchGitData')({head: {id: 'HEAD'}}, console.log)"
```

## Questions?

- Open an issue for questions about contributing
- Check existing issues and PRs for similar questions
- Review the README.md for usage documentation

## License

By contributing, you agree that your contributions will be licensed under the project's existing license (BSD-2-Clause).

Thank you for contributing to coveralls-next!
