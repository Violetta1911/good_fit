# good_fit

Backend for the `good_fit` daily tracker — a personal health-log API. Express 5 +
MySQL with raw-SQL migrations and no ORM. Serves the `good_fit_ui` frontend on
`http://localhost:3003`.

## Stack

- Node 24+, TypeScript (strict), Express 5
- MySQL 8 via `mysql2/promise` (raw SQL, no ORM)
- `umzug` for migrations — plain `.sql` files, up and down
- `joi` for request validation, `bcrypt` + `jsonwebtoken` for auth
- `luxon` for all date handling (everything stored UTC)
- `winston` for logging, `vitest` + `supertest` for tests

## Prerequisites

- **Node 24+** — check with `node -v`
- **MySQL 8.0+** — *not* 5.7, *not* MariaDB. Migrations use the
  `utf8mb4_0900_ai_ci` collation, which only exists in MySQL 8.0 and later.

Pick one of the two database options below. **Docker is the easier path** and is
the only one that works identically on macOS, Linux and Windows.

### Option A — Docker (recommended)

Requires Docker Desktop (or Docker Engine + Compose).

```bash
docker compose up -d
docker compose ps        # wait until STATUS shows (healthy)
```

That's the whole database setup. The container publishes on host port **3307**,
not 3306, so it coexists with any MySQL you already have installed natively —
nothing to stop or uninstall. It also creates the `good_fit` database on first
boot, so you can **skip setup step 3** below.

Set `DB_PORT=3307` in your `.env`.

```bash
docker compose down      # stop, keep your data
docker compose down -v   # stop and wipe the database completely
```

That last command is the fastest way to recover from a broken migration: wipe it,
`docker compose up -d`, `npm run migrate`.

### Option B — native MySQL

macOS with Homebrew:

```bash
brew install mysql
brew services start mysql
mysql -u root -e 'SELECT VERSION()'   # expect 8.x or 9.x
```

On Linux use your distribution's `mysql-server` 8.0+ package; on Windows use the
MySQL Installer. Then leave `DB_PORT=3306` in `.env`.

Homebrew's `root` user has no password, which is what `.env.example` assumes. If
your MySQL `root` *does* have a password, set `DB_PASSWORD` in `.env` (step 2).

## Setup

Four steps, each with a way to check it worked.

### 1. Install dependencies

```bash
npm install
```

### 2. Create your `.env`

```bash
cp .env.example .env
```

The defaults work as-is for local development. Three notes:

- **`DB_PORT` must match your choice above** — `3307` for Docker, `3306` for a
  native install. This is the single most likely thing to get wrong.
- `JWT_SECRET` ships as a placeholder. It's fine for local work, but generate a
  real one if you like: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Set `DB_PASSWORD` here if your MySQL `root` has a password. Leave it empty for
  Docker.

The server **fails fast on boot** if `JWT_SECRET` or `DB_NAME` is missing, rather
than silently signing tokens with an empty secret.

### 3. Create the database

**Skip this step if you used Docker** — the container already created it.

Migrations apply *into* a database — they don't create one. This is the step
that's easy to miss:

```bash
npm run db:create
```

That runs:

```sql
CREATE DATABASE IF NOT EXISTS good_fit
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

The script assumes `mysql -u root` with no password. If your root has a password,
or you changed `DB_NAME`, skip the script and run the SQL yourself:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS good_fit CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"
```

### 4. Apply migrations

```bash
npm run migrate
```

Check it took:

```bash
npm run migrate:pending
# Pending (0): (none)
```

## Running

```bash
npm run dev     # ts-node + nodemon, restarts on save, http://localhost:8000
```

Verify:

```bash
curl localhost:8000/health
# {"status":"ok"}
```

A successful `/health` means the process booted and read your `.env`. It does
**not** prove the database connection — the first real request does that. If
`/health` is fine but everything else 500s, check the troubleshooting table.

### Getting an account

There is **no seed data and no default user**. Start the frontend (see
`../good_fit_ui/README.md`) and register at `http://localhost:3003/auth/register`,
or do it straight against the API:

```bash
curl -X POST localhost:8000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"correct-horse-battery","name":"You","timezone":"Europe/Warsaw"}' \
  -c cookies.txt

curl localhost:8000/me -b cookies.txt
```

All four fields are required (`src/modules/users/users.validation.ts`):

| Field | Rule |
|---|---|
| `email` | valid email, max 254 — TLD not checked, so `a@b.co` is fine |
| `password` | **min 10 chars**, max 128 |
| `name` | trimmed, 1–120 chars |
| `timezone` | a real IANA name (`Europe/Warsaw`, `UTC`) — `Mars/Phobos` is rejected |

Omitting any of them, or a password under 10 characters, returns
`400 VALIDATION_ERROR`. A duplicate email returns `409 EMAIL_TAKEN`.

Auth is a `httpOnly` cookie named `gf_auth`, not a bearer header — so browser
requests need `credentials: 'include'` and curl needs `-b`/`-c`.

## Other commands

```bash
npm test              # vitest, run once
npm run test:watch    # vitest, watch mode
npm run lint          # eslint over src/
npm run format        # prettier, writes in place
npm run build         # tsc -> dist/
npm start             # node dist/server.js (build first)
npm run migrate:down  # revert the most recent migration
```

`npm test` needs MySQL running but **not** the `good_fit` database — each test
file creates and drops its own throwaway database (`gf_test_<pid>_<random>`), so
tests never touch your development data. On Docker those throwaway databases are
created inside the container and disappear with it. See `tests/helpers/db.ts`.

## API

All `/me/*` routes require the `gf_auth` cookie and are scoped to that user.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness — no auth |
| `POST` | `/auth/register` | Create account, sets cookie |
| `POST` | `/auth/login` | Sets cookie |
| `POST` | `/auth/logout` | Clears cookie |
| `GET` | `/auth/me` | Current user |
| `GET` `PATCH` | `/me` | Read / update profile |
| `GET` | `/me/daily-targets/current` | Target in effect today |
| `GET` `POST` | `/me/daily-targets` | List / create targets |
| `GET` `PUT` | `/me/weight` | Read series / upsert one day |
| `DELETE` | `/me/weight/:date` | Delete one day's entry |

## Layout

```
src/
├── server.ts              buildApp() + listen; buildApp is what tests mount
├── config/                config.ts (env, fails fast), db.ts (pool), logger.ts
├── db/
│   ├── migrate.ts         CLI: up | down | pending
│   ├── umzug.ts           migration runner wiring
│   └── migrations/        NNN_name.sql + NNN_name.down.sql
├── middleware/            authRequired, errorHandler, requestLogger
├── modules/               one folder per feature: routes / controller / service
│   ├── auth/  users/  dailyTargets/  weight/  health/
└── utils/                 dates.ts (luxon helpers), validate.ts, errors/
tests/                     vitest; helpers/db.ts makes ephemeral databases
```

Each module is `*.routes.ts` (paths) → `*.controller.ts` (HTTP + validation) →
`*.service.ts` (SQL + business logic).

Services import the shared `pool` singleton from `config/db` directly rather than
receiving it as an argument. Tests substitute it with
`vi.doMock('../src/config/db', () => ({ pool }))`, pointing it at their throwaway
database. That module mocking is process-global, which is why `vitest.config.ts`
sets `fileParallelism: false` — running test files in parallel would let them
clobber each other's pool. Don't remove that flag without also changing how
services get their pool.

### Adding a migration

Create both halves in `src/db/migrations/`, numbered in sequence:

```
004_add_something.sql        -- forward
004_add_something.down.sql   -- revert
```

Then `npm run migrate`. Always write the `.down.sql` — `npm run migrate:down`
needs it, and so does anyone reviewing what your change actually did.

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Unknown database 'good_fit'` | Database not created | `npm run db:create` (setup step 3) |
| `ECONNREFUSED 127.0.0.1:3306` | Native MySQL isn't running — **or** you're on Docker and forgot `DB_PORT=3307` | `brew services start mysql`, or set `DB_PORT=3307` |
| `ECONNREFUSED 127.0.0.1:3307` | Docker container isn't up | `docker compose up -d`, then `docker compose ps` until `(healthy)` |
| Connected, but tables are missing | Two databases on two ports; you migrated one and are querying the other | Confirm `DB_PORT` matches the DB you ran `npm run migrate` against |
| `Bind for 0.0.0.0:3307 failed: port is already allocated` | Something else holds 3307 | Change the host side of `ports:` in `docker-compose.yml` and `DB_PORT` to match |
| `Environment variable JWT_SECRET is required but not set` | No `.env` | `cp .env.example .env` (setup step 2) |
| `ER_ACCESS_DENIED_ERROR` | `root` has a password | Set `DB_PASSWORD` in `.env` |
| `ER_NOT_SUPPORTED_AUTH_MODE` | MySQL 8 auth plugin | `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''` |
| `Unknown collation: 'utf8mb4_0900_ai_ci'` | MySQL 5.7 or MariaDB | Upgrade to MySQL 8.0+ |
| `blocked by CORS policy` in the browser | Frontend isn't on `:3003` | `FRONTEND_URL` in `.env` must match the frontend's actual port |
| `401` on every `/me` request | Cookie not being sent | Frontend needs `credentials: 'include'`; curl needs `-b cookies.txt` |
| `Cannot find module 'express'` after `npm ci --omit=dev` | Stale lockfile | `npm install` to resync |

## Companion repo

- `../good_fit_ui/` — Next.js 16 frontend. Start this backend first; the
  frontend is useless without it.
