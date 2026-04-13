# Contributing to SpectraGit

Thank you for taking the time to contribute. This document covers everything you need to know to get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Before You Start](#before-you-start)
- [Development Setup](#development-setup)
- [Branch Conventions](#branch-conventions)
- [Commit Style](#commit-style)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful and constructive.

---

## Before You Start

- **Search existing issues** before opening a new one. Your question or idea may already be tracked.
- **For significant changes**, open an issue first to discuss the approach before writing code. This avoids wasted effort if the direction doesn't fit the project.
- **For small fixes** (typos, documentation, minor bugs), feel free to open a PR directly.

---

## Development Setup

### Requirements

- Node.js 22 LTS
- Docker Engine 24+
- Docker Compose v2.20+
- Git 2.40+

### Steps

```bash
# 1. Fork the repository and clone your fork
git clone https://github.com/YOUR_USERNAME/spectragit.git
cd spectragit

# 2. Create your environment file
cp .env.example .env
# Edit .env — set at minimum POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET

# 3a. Start the full stack with Docker (recommended)
docker compose up --build

# 3b. Or start services individually for focused development:

# Terminal 1 — infrastructure only
docker compose up postgres redis -d

# Terminal 2 — backend
cd backend && npm install && npm run start:dev

# Terminal 3 — frontend
cd frontend && npm install && npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies `/api` to the backend at `:3000`.

---

## Branch Conventions

| Branch | Purpose |
|---|---|
| `main` | Current stable release |
| `develop` | Integration branch for ongoing work |
| `feat/<name>` | New feature |
| `fix/<name>` | Bug fix |
| `docs/<name>` | Documentation-only changes |
| `refactor/<name>` | Code restructuring without behavior change |
| `chore/<name>` | Build, CI, tooling changes |

Branch names must be lowercase with hyphens: `feat/ssh-key-rotation`, not `Feature/SSHKeyRotation`.

---

## Commit Style

SpectraGit uses [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow this format:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature visible to users |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructuring without behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build system, CI, dependency updates |
| `revert` | Reverting a previous commit |

### Examples

```
feat(issues): add label filtering to issue board
fix(auth): resolve refresh token rotation race condition
docs(install): add TLS/Caddy reverse proxy example
chore(deps): bump @prisma/client to 5.19.0
```

---

## Pull Request Process

1. **Create a branch** from `develop` (or `main` for hotfixes).
2. **Make your changes** following the code style guidelines below.
3. **Write or update tests** for the changed behavior.
4. **Verify the build passes** locally:
   ```bash
   # Backend
   cd backend && npm run lint && npm run test

   # Frontend
   cd frontend && npm run lint && npm run build
   ```
5. **Open a PR** against `develop`. Fill in the PR template:
   - What does this change? Why?
   - How was it tested?
   - Screenshots for UI changes.
6. **Wait for review.** At least one approval is required before merging.
7. PRs are merged using **Squash and Merge** to keep the history clean.

### PR Checklist

- [ ] Branch is up to date with `develop`
- [ ] Commits follow Conventional Commits
- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] New behavior is covered by tests
- [ ] Documentation updated if necessary
- [ ] Breaking changes are noted in the PR description

---

## Code Style

### Backend (NestJS / TypeScript)

- ESLint + Prettier are enforced via pre-commit hooks.
- Run `npm run lint` before pushing.
- Keep controllers thin — business logic belongs in services.
- Use Prisma for all database access; raw SQL only in exceptional, documented cases.
- All public methods on services should have JSDoc describing parameters and return values.

### Frontend (React / TypeScript)

- ESLint + Prettier configured in `eslint.config.js`.
- Prefer functional components with hooks.
- State co-location: keep state as close to where it's used as possible.
- Use `@tanstack/react-query` for server state; Zustand only for global UI state.
- Component files: one component per file, named with PascalCase.
- Tailwind classes ordered with `tailwind-merge` (`cn()` helper from `@/lib/utils`).

### General

- No `console.log` or `debugger` left in committed code.
- No commented-out blocks of code without a `// TODO:` note.
- English only in code, comments, and commit messages.

---

## Testing

### Backend

```bash
cd backend
npm run test          # unit tests
npm run test:e2e      # integration/e2e tests
npm run test:cov      # coverage report
```

Tests live in `*.spec.ts` files alongside the code they test.

### Frontend

The frontend test setup is a work in progress. UI snapshots and component tests are welcome contributions.

---

## Reporting Bugs

Open an issue using the **Bug Report** template. Include:

1. SpectraGit version (git commit SHA or Docker image tag).
2. Operating system and architecture.
3. Steps to reproduce — precise, minimal, and verifiable.
4. Expected behavior vs. actual behavior.
5. Relevant logs (`docker compose logs api`, browser console, etc.).

**Security vulnerabilities must not be reported as public issues.** See [SECURITY.md](SECURITY.md).

---

## Suggesting Features

Open an issue using the **Feature Request** template. Describe:

1. The problem you're trying to solve (not just the solution).
2. Who encounters this problem and how often.
3. Your proposed solution and any alternatives you considered.

Feature requests are tracked and discussed before implementation. A linked PR is always welcome.

---

## License

By submitting a pull request, you agree that your contribution will be licensed under the [MIT License](LICENSE) that covers the project.
