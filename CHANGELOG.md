# Changelog

All notable changes to SpectraGit will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic
Versioning where practical.

## [Unreleased]

### Added

- Root-level project documentation: README, LICENSE, CONTRIBUTING, SECURITY,
  CODE_OF_CONDUCT, and changelog scaffolding.
- Public legal pages for Privacy Policy and Terms of Service.

### Changed

- Login page legal footer links now point to the public privacy and terms pages.

## [1.0.0] - 2026-04-13

### Added

- Initial SpectraGit platform foundation.
- NestJS backend with modular architecture for auth, repositories, issues,
  pull requests, notifications, organizations, reviews, and admin workflows.
- React frontend with Vite, Tailwind CSS, custom UI primitives, and public/auth flows.
- PostgreSQL + Prisma schema and migrations.
- Docker Compose stack with nginx, frontend, API, PostgreSQL, and Redis.
- Setup wizard for first-time instance configuration.
- OAuth authentication support for GitHub and Google.
- SSH and HTTP Git transport foundations.
- Public legal pages and repository-level open source metadata.

[Unreleased]: https://github.com/your-org/spectragit/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/spectragit/releases/tag/v1.0.0