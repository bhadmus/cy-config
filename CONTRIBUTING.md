# Contributing to cy-config

Thank you for considering contributing to the **cy-config** project! This guide outlines how to get involved and contribute effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Issues](#reporting-issues)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Submitting Code Changes](#submitting-code-changes)
- [Setting up the Development Environment](#setting-up-the-development-environment)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Style Guide](#style-guide)
- [License](#license)

## Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) to understand how we expect contributors to conduct themselves while participating in this project.

## How Can I Contribute?

### Reporting Issues

If you encounter a bug or have a question about the project, please:

1. **Search for existing issues** to ensure it's not a duplicate.
2. **Create a new issue** if one doesn't exist. Use a clear and descriptive title and provide as much information as possible, such as:
   - Steps to reproduce the issue
   - The expected result
   - The actual result
   - Version of `cy-config` being used
   - Any other relevant information, such as system configurations

### Suggesting Enhancements

We welcome ideas to improve the package! When suggesting an enhancement:

- **Explain the current state of the problem** and why your enhancement would help.
- Provide details about how the enhancement would work.
- Add potential use cases and examples, if possible.

### Submitting Code Changes

1. Fork the repository.
2. Create a new branch (from `main` or `develop`) for your changes:
   ```
   git checkout -b feature/my-feature
   ```
3. Make your changes, following the [Style Guide](#style-guide).
4. Commit your changes:
   ```
   git commit -m "Add a concise description of the changes"
   ```
5. Push to your fork:
   ```
   git push origin feature/my-feature
   ```
6. Submit a pull request (PR) to the main repository and describe your changes in detail.

Please keep the scope of each PR focused and atomic. If you plan on making significant changes, it's best to open an issue or start a discussion first.

## Setting up the Development Environment

To contribute to `cy-config`, follow these steps to set up your local environment:

1. Clone the repository:
   ```
   git clone https://github.com/your-username/cy-config.git
   ```
2. Navigate to the project directory:
   ```
   cd cy-config
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Run tests to ensure everything works as expected:
   ```
   npm test
   ```

## Pull Request Guidelines
- Keep your PR focused; avoid including unrelated changes.
- Provide a detailed description of the changes in your PR.
- Update relevant documentation, if applicable.

## Style Guide

Follow these guidelines to maintain code quality:

- **Code Style**: Follow the coding style used in the project. Use a linter to maintain consistency (`npm run lint`).
- **Commit Messages**: Use concise and clear commit messages, following [Conventional Commits](https://www.conventionalcommits.org/), e.g., `feat: add feature x`.
- **Testing**: Ensure all features have corresponding tests and that all tests pass before submitting a PR.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
