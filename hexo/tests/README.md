# Hexo Blog Test Suite

This directory contains automated tests for the Hexo blog configuration and content structure.

## Setup

The tests use Jest as the testing framework. Dependencies are already installed in the project:

- `jest` - Testing framework
- `@types/jest` - TypeScript type definitions for Jest
- `js-yaml` - YAML parser for configuration files

## Running Tests

From the `hexo/` directory, run:

```bash
# Run all tests once
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Suites

### 1. Configuration Tests (`config.test.js`)

Validates the Hexo `_config.yml` file:

- **Basic Site Configuration**: Verifies title, author, language, and URL settings
- **Directory Configuration**: Checks source, public, and permalink settings
- **Theme Configuration**: Ensures a theme is properly configured
- **Deployment Configuration**: Validates Git deployment settings
- **Writing Configuration**: Checks post naming and syntax highlighting settings
- **Pagination Configuration**: Verifies pagination settings

### 2. Posts Structure Tests (`posts.test.js`)

Validates blog posts in `source/_posts/`:

- **Posts Directory**: Ensures the posts directory exists
- **Post Files**: Verifies posts exist and have `.md` extensions
- **Individual Post Validation**: For each post file:
  - Has valid front matter
  - Has a title
  - Has a date
  - Has content after the front matter
- **Post Subdirectories**: Handles subdirectories gracefully

### 3. Theme Tests (`theme.test.js`)

Validates theme configuration and assets:

- **Theme Config File**: Checks for theme-specific config files
- **Theme Directory Structure**: Ensures theme directories exist
- **Active Theme**: Validates the configured theme is installed
- **Theme Assets**: Verifies layout and source directories
- **Theme Settings**: Validates language, timezone, and URL settings

### 4. Deployment Tests (`deployment.test.js`)

Validates deployment configuration:

- **Deployment Settings**: Checks Git deployment configuration
- **Repository URL**: Validates deployment repository URL format
- **Branch Configuration**: Ensures valid deployment branch
- **Git Configuration**: Checks `.gitignore` settings
- **Build Scripts**: Verifies required npm scripts exist
- **Deployment Dependencies**: Confirms required plugins are installed

### 5. Integration Tests (`integration.test.js`)

Comprehensive end-to-end validation:

- **Project Structure**: Validates required directories and files
- **Source Structure**: Checks posts directory and readability
- **Scaffolds**: Validates post and page templates
- **Plugin Installation**: Ensures all essential Hexo plugins are installed
- **Configuration Consistency**: Validates configuration settings are coherent
- **Content Validation**: Ensures posts have proper front matter format
- **Build System**: Validates all required npm scripts
- **Package Metadata**: Checks package.json integrity

## Test Coverage

Current coverage (Iteration 2):
- Configuration validation: 15 tests
- Post structure validation: 13 tests
- Theme validation: 15 tests
- Deployment validation: 11 tests
- Integration validation: 30 tests
- **Total: 84 passing tests**

## Adding New Tests

To add new tests:

1. Create a new test file in `tests/__tests__/` with the pattern `*.test.js`
2. Use Jest's `describe`, `test`, and `expect` functions
3. Run `npm test` to execute all tests including your new ones

Example:

```javascript
const fs = require('fs');
const path = require('path');

describe('My New Test Suite', () => {
  test('should do something', () => {
    const result = true;
    expect(result).toBe(true);
  });
});
```

## Continuous Integration

Consider running these tests in CI/CD pipelines to catch configuration errors before deployment:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test
```

## Test Philosophy

These tests follow these principles:

1. **Non-destructive**: Tests read files but don't modify them
2. **Idempotent**: Tests can be run multiple times without side effects
3. **Fast**: All tests complete in under 1 second
4. **Clear**: Test names describe what they validate
5. **Helpful**: Failure messages indicate what went wrong

## Troubleshooting

### Tests fail after configuration changes

If you've intentionally changed your configuration and tests fail, update the test expectations in the appropriate test file to match your new settings.

### Tests fail after adding/removing posts

The post structure tests dynamically validate all `.md` files in the `_posts` directory. If tests fail after adding new posts, ensure they have proper front matter with at least a title and date.

### Theme test warnings

The theme tests may show warnings if:
- The URL is still set to `example.com`
- The theme-specific config file doesn't exist (this is optional)

These are informational and won't cause test failures.

## Roadmap

Potential future enhancements:

- Add tests for custom theme configurations
- Validate Markdown syntax in posts
- Check for broken internal links
- Test image references in posts
- Validate SEO metadata
- Add performance benchmarks
- Test plugin compatibility

## Version History

- **v2.0** (Iteration 2): Added theme, deployment, and integration tests. Expanded from 28 to 84 tests.
- **v1.0** (Iteration 1): Initial test suite with config and posts validation (28 tests).
