# Contributing to Project

Thank you for considering contributing to this project! Here are some guidelines to help you get started:

- [Installation](#installation)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing](#testing)
  - [Adding Unit Tests with Mocha](#adding-unit-tests-with-mocha)
  - [Adding End-to-End Tests with Playwright](#adding-end-to-end-tests-with-playwright)

## Installation

**Clone the repository**:

```sh
git clone https://github.com/ChristopherBull/Clear-Links.git
cd Clear-Links
```

**Install developer dependencies**:

Ensure [NodeJS](https://nodejs.org/) is installed, which is used for the developer dependencies (linting, testing, etc). To install the developer dependencies, use the following command:

```sh
npm install
```

Installing the Node dependencies also automatically sets up pre-commit Git hooks for your local copy of this project, enforcing conventional commit messages that follow this project's [Commit Message Guidelines](#commit-message-guidelines).

For E2E testing, you will need to do an additional install step:

```sh
npm run test:e2e:prepare
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for our commit messages. Here are some examples:

- `feat: add new user authentication module`
- `fix: resolve issue with user login`
- `docs: update contributing guidelines`
- `style: format code according to ESLint rules`
- `refactor: improve performance of data processing`
- `test: add unit tests for user service`

These commit message conventions are enforced with a pre-commit hook, which will be setup if the [installation](#installation) steps have been followed.

## Testing

Before submitting your code, make sure to run linting and tests:

**Run all tests, spell checking, and linting**:

```sh
npm run test:all
```

Individual tests, linting, and other scripts are listed in the [package.json "scripts" field](./package.json). These checks will also run automatically in the [Continuous Integration (CI) pipeline](https://github.com/ChristopherBull/Clear-Links/actions) to ensure code quality and functionality.

All new contributions should aim to include tests that cover the new code.

### Adding Unit Tests with Mocha

Unit tests use [Mocha](https://mochajs.org/).

1. **Write your tests** in the `/test/specs` directory.
2. **Run the tests** to ensure they pass:

```sh
npm test
```

...or test with a coverage report:

```sh
npm test:coverage
```

### Adding End-to-End Tests with Playwright

1. **Write your tests** in the `/test/e2e` directory.
2. **Build the extension** with the command: `make`. This bundles the source files correctly into the `/dist` folder, which is loaded by browsers.
3. **Run the tests** to ensure they pass:

```sh
npm run test:e2e
```
