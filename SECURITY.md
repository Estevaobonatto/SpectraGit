# Security Policy

## Supported Versions

Security fixes are applied to the latest release on the `main` branch. We do not backport security patches to older tags unless the vulnerability is critical and widely exploited.

| Version | Supported |
|---|---|
| Latest (`main`) | Yes |
| Previous releases | Evaluated case-by-case |

---

## Reporting a Vulnerability

**Do not open a public GitHub/SpectraGit issue for security vulnerabilities.** Public disclosure before a fix is available puts all SpectraGit users at risk.

### Preferred channel

Send a detailed report to the security contact of this project. If no dedicated security email is listed in the repository, open a **private security advisory** on GitHub:

1. Go to the repository on GitHub.
2. Click the **Security** tab.
3. Click **Report a vulnerability**.
4. Fill in the advisory form.

GitHub private advisories allow you to collaborate with maintainers confidentially until a patch is ready.

---

## What to Include in Your Report

To help us triage and reproduce the issue quickly, please include:

- **Description** of the vulnerability: what it is and its potential impact.
- **Affected component(s)**: backend module, frontend feature, authentication flow, Git protocol layer, etc.
- **Steps to reproduce**: a minimal, precise sequence of actions.
- **Proof of concept**: code snippet, curl command, or screenshot demonstrating the issue (if safe to share).
- **Suggested severity**: your assessment of CVSS or impact level.
- **SpectraGit version** (commit SHA or Docker image tag).
- **Environment**: OS, Docker version, deployment configuration (if relevant).

You do not need to provide a fix. A clear, reproducible report is sufficient.

---

## Our Commitment

- We will acknowledge receipt of your report within **72 hours**.
- We will keep you updated on the investigation progress.
- We aim to release a patch within **14 days** for critical or high-severity findings.
- We will credit you in the release notes and CHANGELOG unless you prefer to remain anonymous.
- We will not take legal action against researchers who act in good faith and follow this policy.

---

## Scope

The following are **in scope** for vulnerability reports:

- Authentication and session management (JWT, OAuth, SSH key handling)
- Authorization and access control (repository visibility, organization permissions)
- Remote code execution via the Git HTTP or SSH protocol layer
- SQL injection, command injection, or path traversal in the backend
- Cross-site scripting (XSS) in the frontend capable of stealing credentials
- Cross-site request forgery (CSRF) on state-changing endpoints
- Exposure of secrets, tokens, or private repository content to unauthorized parties
- Privilege escalation to admin or maintainer roles

The following are **out of scope**:

- Denial-of-service via rate-limiting bypass (report to the operator, not the project)
- Social engineering attacks
- Vulnerabilities in third-party dependencies (report to the upstream maintainer; mention them here if they directly affect SpectraGit)
- Missing security headers on operator-configured deployments
- Issues that require physical access to the server

---

## Security Best Practices for Operators

If you are running a SpectraGit instance, follow these recommendations:

- Always serve SpectraGit over HTTPS (TLS 1.2+). Never expose port 80 without a TLS-terminating proxy in production.
- Use strong, randomly generated values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `POSTGRES_PASSWORD`.
- Restrict network access to the PostgreSQL and Redis containers so they are not reachable from outside the Docker network.
- Keep Docker images up to date by watching for new releases.
- Enable and review audit logs regularly from the Admin Panel.
- Rotate SSH host keys and API tokens periodically.
- Back up the PostgreSQL database and the repository storage volume on a regular schedule.

---

## Security-Related Disclosures

Past security advisories, when applicable, are tracked via GitHub Security Advisories in this repository.
