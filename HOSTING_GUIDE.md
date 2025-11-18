# Hosting & Database Guide (Quick)

This file explains how to prepare and host the `backed` app online (free options), and compares common online database choices.

## What I changed to make the project deployable
- `package.json`: `start` now uses `node server.js`, `dev` uses `nodemon`, and added `migrate` script.
- `server.js`: static serving is more robust — it now detects frontend files in `backed/frontend`, the parent project folder, or `backed/` itself and serves `index.html` from the discovered spot. Uploads are served from an absolute uploads path.
- `db.js`: expects DB connection info from `.env` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- `migrate.js`: a migration script to create `admins`, `buses`, and `bookings` tables if missing.

## Quick deploy steps (recommended free/easy path)
Option A — Railway (quick, supports MySQL/Postgres)
1. Push this repo to GitHub.
2. Create a Railway project and connect your GitHub repo (or deploy via GitHub Actions).
3. Add environment variables in Railway: `PORT`, `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PAYCHANGU_*` as needed.
4. Set the start command to `npm start` (Railway typically runs `npm start` by default).
5. After deployment, run the migration via Railway shell or add a one-off job: `npm run migrate`.

Option B — Vercel / Netlify (Frontend) + Supabase / PlanetScale (DB) + Railway (API)
- If you prefer to separate frontend from backend: host the frontend on Vercel/Netlify (free) and host the backend on Railway / Fly / Render. Use environment variables to point to the same DB.

Option C — All-in-one: Render / Fly / Railway (if available free tier)
- Create a MySQL database (PlanetScale) or use managed MySQL on Railway.
- Deploy backend, set env vars, run `npm run migrate`.

## Which online database should you pick?
I list a few good, mostly free/low-cost options and the tradeoffs relative to this project (which currently uses MySQL):

- PlanetScale (MySQL-compatible, serverless)
  - Pros: free tier, MySQL wire-compatible (easy to connect), good for production, branch-based schema migrations.
  - Cons: does not support `ALTER TABLE` in the same way during writes (recommend using PlanetScale recommended schema change flow). Works well with existing MySQL code.
  - Recommendation: Best if you want MySQL compatibility and a hosted, production-ready DB.

- Supabase (Postgres)
  - Pros: full Postgres, generous free tier, built-in Auth, storage, realtime. Great developer experience.
  - Cons: Not MySQL — you'd need to convert SQL/data types and queries (this app uses MySQL but migration to Postgres is usually straightforward).
  - Recommendation: Best if you want built-in auth/storage and realtime features and don't mind migrating to Postgres.

- Neon / Heroku Postgres (Postgres)
  - Pros: Postgres, serverless options available.
  - Cons: Migration needed from MySQL.

- ClearDB / db4free.net (MySQL)
  - Pros: simple, sometimes free for hobby projects.
  - Cons: often unreliable for production, limited performance/support.

- Railway (managed PostgreSQL / MySQL)
  - Pros: very quick to get a dev DB and deploy the app; integrates with repo; good for prototypes.
  - Cons: free credits expire; may require upgrading for long-running projects.

Short recommendation for you: since this project currently uses MySQL and you asked for the easiest path to test online for free, use **PlanetScale** (MySQL-compatible) or Railway's MySQL (if you prefer simpler one-click). If you want extra services (auth, storage, realtime), pick **Supabase** and convert the DB later.

## Environment variables you must set on the host
- `PORT` (optional)
- `JWT_SECRET` (required) — do not use default `busbook_secret` in production
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `PAYCHANGU_BASE_URL`, `PAYCHANGU_SECRET_KEY`, `PAYCHANGU_CALLBACK_URL` (if you plan to test payments)

## How to run migrate on the host
- After deployment or from the host's console:
```
cd backed
npm run migrate
```

## Local quick test before deploying
1. Ensure `.env` has DB creds.
2. Install packages: `npm install`.
3. Run migration: `npm run migrate`.
4. Start server: `npm start`.
5. Visit `http://localhost:5000/` (or the deployed URL).

If you want, I can:
- Add a tiny GitHub Actions workflow to deploy to Railway automatically.
- Add instructions to separate frontend (deploy to Vercel) and API (Railway) with example env var setup.

*** End of guide ***
