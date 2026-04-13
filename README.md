<div align="center">

<img src="https://raw.githubusercontent.com/spectragit/.github/main/assets/logo.svg" alt="SpectraGit" width="60" height="60" />

# SpectraGit

**Self-hosted Git platform. Full control. No subscription. Free forever.**

[![License: MIT](https://img.shields.io/badge/license-MIT-7c3aed?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-compose-0ea5e9?style=flat-square&logo=docker&logoColor=white)](docker-compose.yml)
[![NestJS](https://img.shields.io/badge/backend-NestJS-ea0035?style=flat-square&logo=nestjs&logoColor=white)](backend/)
[![React](https://img.shields.io/badge/frontend-React%2019-61dafb?style=flat-square&logo=react&logoColor=white)](frontend/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2016-4169e1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[Overview](#overview) · [Features](#features) · [Quick Start](#quick-start) · [Stack](#tech-stack) · [Contributing](#contributing) · [License](#license)

</div>

---

## Overview

SpectraGit is an open source, self-hosted Git platform inspired by GitHub. Deploy it on your own infrastructure and get full control over your repositories, teams, and code review workflows — no cloud lock-in, no usage limits, no credit card required.

- **100% open source** — MIT licensed, forever free to use and modify.
- **Self-hosted** — your code lives on your servers, not ours.
- **No telemetry** — zero data is ever sent to external services.
- **No subscription** — every feature is available to every user out of the box.

---

## Features

| Category | Capabilities |
|---|---|
| **Git** | HTTP + SSH protocol, push/pull/clone, tree browser, file viewer, blame |
| **Branches & Tags** | Create, protect, delete branches; create and manage tags |
| **Commits** | History, diff viewer, per-file history |
| **Issues** | Board, triage queue, labels, milestones, assignments, comments |
| **Pull Requests** | Open/review/merge PRs, inline code comments, approval workflow |
| **Code Review** | Line-by-line comments, suggestion blocks, reviewer assignment |
| **Releases** | Create releases, attach assets, changelogs |
| **Organizations** | Multi-member orgs, teams, granular repository permissions |
| **Notifications** | Real-time in-app notifications via WebSockets, email digests |
| **Authentication** | OAuth 2.0 (GitHub, Google), SSH keys, API tokens, session management |
| **Admin Panel** | User management, instance settings, health dashboard |
| **GitHub Sync** | Optional: import and sync repositories from GitHub |

---

## Quick Start

> **Requirements:** Docker Engine 24+, Docker Compose v2.20+, 5 GB disk space, ports 80 and 2222 available.

### 1. Clone

```bash
git clone https://github.com/your-org/spectragit.git
cd spectragit
```

### 2. Configure

```bash
cp .env.example .env
```

Open `.env` and set the required values:

```dotenv
POSTGRES_PASSWORD=          # any strong password
JWT_SECRET=                 # openssl rand -hex 48
JWT_REFRESH_SECRET=         # openssl rand -hex 48
FRONTEND_URL=http://localhost
```

OAuth providers (GitHub, Google) are **optional** — leave them as `placeholder` to skip.

### 3. Start

```bash
docker compose up --build -d
```

### 4. Finish setup

Open `http://localhost` in your browser. You will be redirected to the **Setup Wizard** where you will name your instance and create the first admin account.

> See [INSTALL.md](INSTALL.md) for a complete installation guide including HTTPS/TLS, external database, and production hardening.

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 (LTS) |
| Framework | NestJS 10 |
| Database | PostgreSQL 16 via Prisma ORM |
| Cache / Queue | Redis 7 with BullMQ |
| Git operations | isomorphic-git / native git binary |
| Authentication | Passport.js — JWT + OAuth 2.0 |
| Real-time | Socket.io (WebSockets) |
| Storage | Local filesystem or S3-compatible object storage |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Routing | React Router 7 |
| State | Zustand + TanStack Query |
| Styling | Tailwind CSS v4 |
| UI components | Radix UI primitives + custom design system |
| Animations | Motion (Framer Motion) |
| Forms | React Hook Form + Zod |
| Build | Vite 6 |

### Infrastructure

| Service | Role |
|---|---|
| nginx | Reverse proxy + static file serving |
| Docker Compose | Orchestration for all services |
| Prisma Migrate | Database schema migrations |

---

## Project Structure

```
spectragit/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── modules/          # Feature modules (auth, repos, issues, PRs…)
│   │   ├── common/           # Guards, decorators, filters, interceptors
│   │   ├── config/           # Configuration & validation
│   │   └── prisma/           # Prisma service
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── frontend/                 # React SPA
│   └── src/
│       ├── features/         # Page-level feature modules
│       ├── components/       # Shared UI components
│       ├── hooks/            # Custom React hooks
│       └── services/         # API client layer
├── nginx/                    # nginx config
├── docker-compose.yml
├── .env.example
├── INSTALL.md
└── README.md
```

---

## Development Setup

### Backend

```bash
cd backend
npm install
cp ../.env.example ../.env       # configure .env
npx prisma migrate dev           # run migrations
npm run start:dev                # starts on :3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                      # starts on :5173 (proxies /api to :3000)
```

### Full stack via Docker (recommended)

```bash
docker compose up --build        # API :3000, frontend :80, git SSH :2222
```

---

## Configuration Reference

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `JWT_SECRET` | Yes | Access token signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing key (min 32 chars) |
| `FRONTEND_URL` | Yes | Public URL of the instance (e.g. `https://git.example.com`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (defaults to `FRONTEND_URL`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth 2.0 Client Secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth App Client Secret |
| `STORAGE_DRIVER` | No | `local` (default) or `s3` |
| `S3_BUCKET` | No | S3 bucket name (required if `STORAGE_DRIVER=s3`) |

Full reference in [.env.example](.env.example).

---

## Upgrading

```bash
git pull
docker compose pull
docker compose up --build -d
```

Migrations are applied automatically on startup. Always read the [CHANGELOG](CHANGELOG.md) before upgrading in production.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, branch conventions, and code style guidelines.

---

## Security

If you find a security vulnerability, please follow the process described in [SECURITY.md](SECURITY.md). **Do not open a public issue for security reports.**

---

## License

SpectraGit is distributed under the [MIT License](LICENSE).

You are free to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software. See [LICENSE](LICENSE) for the full text.

---

<div align="center">
<sub>Built with care · Self-hosted means yours</sub>
</div>
