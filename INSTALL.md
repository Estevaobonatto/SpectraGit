# SpectraGit — Self-Hosted Installation Guide

This guide walks you through deploying SpectraGit on your own infrastructure using Docker Compose.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Docker Engine | 24 or later |
| Docker Compose plugin | v2.20 or later |
| Available ports | `80` (HTTP), `2222` (SSH git) |
| Disk space | ≥ 5 GB recommended (repos stored on volume) |

> **HTTPS / TLS**: This setup exposes port 80 only. For production, place a TLS-terminating reverse proxy (e.g., Caddy, Traefik, or nginx with certbot) in front of the nginx container.


---

## 1. Clone the repository

```bash
git clone https://github.com/your-org/spectragit.git
cd spectragit
```

---

## 2. Create your environment file

```bash
cp .env.example .env
```

Open `.env` in your editor and update **at minimum** the following values:

| Variable | Description |
|---|---|
| `JWT_SECRET` | Long random string — `openssl rand -hex 48` |
| `JWT_REFRESH_SECRET` | Different long random string — `openssl rand -hex 48` |
| `FRONTEND_URL` | Public URL of your instance, e.g. `https://git.company.com` |
| `CORS_ORIGINS` | Same as `FRONTEND_URL` |
| `GOOGLE_CALLBACK_URL` | *(optional)* OAuth callback registered in Google Console |
| `GITHUB_CALLBACK_URL` | *(optional)* OAuth callback registered in GitHub App settings |

> Keep the default `DATABASE_URL`, `REDIS_HOST`, and `REDIS_PORT` values unless you are connecting to an external database or Redis instance.

---

## 3. Build and start the stack

```bash
docker compose up --build -d
```

This starts five services:

| Service | Description |
|---|---|
| `postgres` | PostgreSQL 16 database |
| `redis` | Redis 7 for queues and caching |
| `api` | NestJS backend (`/api/v1/*`) |
| `frontend` | Built React SPA served by nginx |
| `nginx` | Reverse proxy on port 80 |

The first startup will run `prisma migrate deploy` automatically inside the `api` container. Check logs if it takes more than a minute:

```bash
docker compose logs -f api
```

---

## 4. Complete the setup wizard

Open your browser and navigate to:

```
http://localhost
```

> Replace `localhost` with your server's IP address or domain if deploying remotely.

You will be redirected to the **Setup Wizard** (`/setup`) where you will:

1. **Configure the instance** — set a name, logo URL, primary color, and the public base URL
2. **Create the admin account** — choose a username, email, and password for the first system administrator

After completing the wizard you will be redirected to the login page.

---

## 5. Log in and explore

Sign in with the admin credentials you just created. As a system admin you have access to the **Admin Panel** at `/admin`:

| Section | URL | Description |
|---|---|---|
| Overview | `/admin` | Instance summary and quick links |
| Users | `/admin/users` | Promote/demote users, disable accounts |
| Settings | `/admin/settings` | Change branding, base URL, SMTP |
| Health | `/admin/health` | Database and storage health |

---

## Updating

```bash
git pull
docker compose up --build -d
```

The `api` container runs `prisma migrate deploy` on every startup, so schema changes are applied automatically.

---

## Backups

### Database

```bash
docker compose exec postgres pg_dump -U spectragit spectragit > backup.sql
```

### Git repositories (bare repos)

```bash
docker run --rm \
  -v spectragit_git_storage:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/git_storage.tar.gz -C /data .
```

---

## SSH git access

The SSH git server is exposed on port **2222**. Users can clone/push with:

```bash
git clone ssh://git@your-domain:2222/owner/repo.git
```

---

## Configuration reference

See [`.env.example`](.env.example) for the full list of environment variables with descriptions.

---

## Troubleshooting

**The setup wizard does not appear**

- Check that all containers are running: `docker compose ps`
- Inspect API logs for migration errors: `docker compose logs api`

**Cannot connect to the database**

- The `api` service waits for PostgreSQL to be healthy before starting. If the DB volume is corrupt, remove it and recreate: `docker compose down -v && docker compose up -d`

**CORS errors in the browser**

- Make sure `FRONTEND_URL` and `CORS_ORIGINS` in `.env` match the exact origin (including `http://` or `https://`) used in your browser.

**OAuth login not working**

- Verify that the callback URLs registered in Google/GitHub match `GOOGLE_CALLBACK_URL` / `GITHUB_CALLBACK_URL` in `.env` exactly.
