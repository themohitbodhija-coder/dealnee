# Dealinee Estate source code

## Supabase migration in progress

The first migration milestone adds the PostgreSQL schema, taxonomy, permissions
and isolated database tests. See [migration progress](docs/MIGRATION_PROGRESS.md)
for setup, verification and remaining work, and the
[implementation plan](docs/SUPABASE_MIGRATION_PLAN.md) for the full rollout.
The React application currently still uses Express; the instructions below
describe that existing application until frontend parity is complete.

## Contents and status
`frontend/` contains the current React source, public assets, tests, package files and configuration. `backend/` contains the Express/Mongoose source, existing scripts, tests and package files.

This snapshot includes completed listing fixes and the latest in-progress Phase 4 audit changes. That audit was interrupted and is not certified complete. This package is not a deployment-readiness approval.

Original environment files, credentials, dependencies, Git history, build archives, caches, database data and uploaded user/QA images are excluded. The empty backend uploads directory is for new local uploads. The packaged admin seed utility uses environment variables instead of a hardcoded password. The original workspace was not changed.

## Requirements
Node.js 24 LTS (used by this workspace), npm, and a local MongoDB service on port 27017. Use separate terminals for the two services. Do not use production credentials or a production database.

## Backend installation (PowerShell)
From this package directory:
```powershell
cd .\backend
npm ci
Copy-Item .env.example .env
```
Edit `.env` and replace the JWT placeholders with unique long random secrets. Keep both MongoDB URIs on the isolated local `dealinee_test` database and keep `CLIENT_URL=http://localhost:3001`.
```powershell
npm run dev
# or npm start
```
API: http://localhost:5000/api ; health: http://localhost:5000/api/health . Ensure port 5000 is available: the existing server can fall back to 5001, requiring a corresponding frontend API configuration change.

## Frontend installation and running
From the package directory in a second terminal:
```powershell
cd .\frontend
npm ci
Copy-Item .env.example .env
npm start
```
Open http://localhost:3001 . Preserve `REACT_APP_API_URL=http://localhost:5000/api`. Restart the frontend after environment changes. React environment variables are browser-visible and must not contain private secrets.

## Optional initialization of a new isolated database
No database backup or pre-created account is included. From `backend/`, after configuring `.env`:
```powershell
npm run seed:categories
node scripts/seedAdmin.js
```
Replace `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` with local credentials before seeding. No default password is supplied. Inspect existing maintenance/migration scripts before use; do not run collection-clearing scripts against an existing database.

## Tests and build
```powershell
# from frontend/
npm test -- --watchAll=false --runInBand
npm run build
# from backend/
node --test tests/*.test.js
```
Known build warnings and dependency advisories may remain. Finish the interrupted application audit and review `npm audit` before deployment. Do not automatically apply major upgrades with `npm audit fix --force`.
