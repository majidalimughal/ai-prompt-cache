# Contributing to ai-prompt-cache

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/ai-prompt-cache/ai-prompt-cache.git
cd ai-prompt-cache
pnpm install
```

## Scripts

| Command              | Description             |
| -------------------- | ----------------------- |
| `pnpm build`         | Build the package       |
| `pnpm test`          | Run unit tests          |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint`          | Run ESLint              |
| `pnpm typecheck`     | Run TypeScript checks   |
| `pnpm format`        | Format with Prettier    |

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for semantic-release:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `test:` — tests
- `refactor:` — code refactoring
- `chore:` — maintenance

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes with tests
4. Ensure `pnpm test`, `pnpm lint`, and `pnpm build` pass
5. Submit a pull request using the PR template

## Code Standards

- Strict TypeScript — no `any` types
- SOLID principles and clean architecture
- Unit tests for all new functionality
- 95%+ test coverage target

## Reporting Issues

Use the GitHub issue templates for bugs and feature requests.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
