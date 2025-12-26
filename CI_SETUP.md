# CI/CD Environment Setup

This document outlines the required environment variables and secrets for the CI/CD pipeline.

## Required GitHub Secrets

### For Security Scanning

- `SNYK_TOKEN`: Snyk API token for vulnerability scanning
  - Get from: https://app.snyk.io/account
  - Add to: Repository Settings > Secrets and variables > Actions

### For Deployment (Optional)

- `STAGING_DEPLOY_KEY`: SSH key for staging server deployment
- `PRODUCTION_DEPLOY_KEY`: SSH key for production server deployment
- `DOCKER_REGISTRY_TOKEN`: Token for Docker registry access

## Environment Variables

The following environment variables are used in the CI pipeline:

- `NODE_VERSION`: Node.js version (currently 22.x)
- **Integration & E2E Tests:**
  - `DB_HOST`: Database host (localhost)
  - `DB_PORT`: Database port (5433)
  - `DB_USERNAME`: Database username (postgres)
  - `DB_PASSWORD`: Database password (postgres123)
  - `DB_NAME`: Database name (pet_care_test_db)
  - `DB_SYNCHRONIZE`: Enable schema synchronization (true)
  - `DB_DROP_SCHEMA`: Drop schema before tests (true)
  - `DB_LOGGING`: Enable database logging (false)
  - `USE_ORDERED_ENTITIES`: Use ordered entity loading (true)

## Local Development

For local testing of the CI pipeline, you can use the existing scripts:

Prerequisites:
- Docker (Docker Desktop on Windows/macOS) installed and running if you use the `*:with-db` scripts.

```bash
# Run tests with a temporary PostgreSQL test DB (recommended)
# NOTE: Integration/E2E tests require Postgres on localhost:5433.
# These scripts start/stop the DB using docker-compose.e2e.yml.
npm run test:integration:with-db
npm run test:e2e:with-db

# Run selective tests (only changed files)
npm run test:changed

# Run with coverage (all test types)
npm run test:cov:all

# Run individual test types
npm run test                    # Unit tests only
npm run test:integration        # Integration tests only (expects DB already running)
npm run test:e2e                # E2E tests only (expects DB already running)
npm run test:cov               # Unit test coverage only
```

## CI Pipeline Jobs

1. **📦 Setup**: Install dependencies and cache node_modules
2. **🧪 Unit Tests**: Run unit tests (no database required)
3. **🔗 Integration Tests**: Run integration tests with PostgreSQL database
4. **🌐 E2E Tests**: Run end-to-end tests with PostgreSQL database
5. **🏗️ Build & Lint**: TypeScript compilation and ESLint checks
6. **🔒 Security**: npm audit and Snyk vulnerability scanning
7. **📊 Coverage**: Generate test coverage report for all test types
8. **🐳 Docker Build**: Container image building
9. **🚀 Deploy Staging**: Automatic deployment to staging (develop branch)
10. **🎯 Deploy Production**: Automatic deployment to production (main branch)
11. **📋 Summary**: Pipeline results summary

## Deployment Environments

- **Staging**: Deployed on pushes to `develop` branch
- **Production**: Deployed on pushes to `main` branch

To enable deployments, create the respective environments in:
Repository Settings > Environments
