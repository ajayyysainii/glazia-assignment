# Glazia

An infinite canvas — draw, sketch, and keep boards in your account. Next.js
front end, Express + MongoDB back end.

---

## Table of contents

- [Setup](#setup)
- [Architecture](#architecture)
- [MongoDB setup](#mongodb-setup)
- [API endpoints](#api-endpoints)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Bonus features](#bonus-features)
- [Known limitations](#known-limitations)

---

## Setup

**Requirements:** Node 22, npm, and a MongoDB instance (local or Atlas).

```bash
git clone https://github.com/ajayyysainii/glazia-assignment.git
cd glazia-assignment
```

### 1. Back end

```bash
cd backend
npm install
cp .env.example .env     # then edit the values — see below
npm run dev              # http://localhost:4000
```

`.env` values:

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DB_URI` | **yes** | — | MongoDB connection string |
| `JWT_ACCESS_SECRET` | **yes** | — | **32+ characters**, startup fails otherwise |
| `JWT_REFRESH_SECRET` | **yes** | — | **32+ characters**, must differ from the access secret |
| `PORT` | no | `4000` | |
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test` |
| `JWT_ACCESS_EXPIRES_IN` | no | `15m` | |
| `JWT_REFRESH_EXPIRES_IN` | no | `7d` | |
| `CORS_ORIGIN` | no | `http://localhost:3000` | The front end's origin |

The environment is validated with zod at boot ([`src/config/env.ts`](backend/src/config/env.ts)).
A missing or too-short secret exits the process with a readable error rather
than failing later at request time.

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Front end

```bash
cd frontend
npm install
npm run dev              # http://localhost:3000
```

No `.env` file is needed for local development. The front end calls
same-origin `/api/*`, and [`next.config.ts`](frontend/next.config.ts) rewrites
that to `http://localhost:4000` by default.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `API_PROXY_TARGET` | in production | `http://localhost:4000` | Origin the `/api/*` rewrite proxies to |
| `NEXT_PUBLIC_API_URL` | no | `/api` | Change only if you bypass the rewrite |

Open http://localhost:3000. You can draw immediately without an account —
see [guest drafts](#bonus-features).

---

## Architecture

```
glazia-assignment/
├── frontend/                     Next.js 16 · React 19 · Tailwind 4 · Konva
│   ├── app/                      App Router entry (single client-rendered page)
│   ├── components/
│   │   ├── canvas/               Board, toolbar, palette rail, dashboard
│   │   │   └── hooks/            History, keyboard, persistence, guest drafts
│   │   ├── auth/                 Profile menu + login/signup dialogs
│   │   └── ui/                   Toast + confirm-dialog providers
│   └── lib/
│       ├── api/client.ts         fetch wrapper: envelope parsing, 401 refresh
│       ├── auth/                 Session context and token storage
│       └── canvas/               API calls, types, IndexedDB guest draft store
└── backend/                      Express 5 · Mongoose 9 · zod · JWT
    └── src/
        ├── config/               env validation, Mongo connection
        ├── models/               User, Canvas, RefreshToken
        ├── modules/              Feature slices: routes → controller → service
        ├── middleware/           authenticate, error handler
        └── utils/                Response envelope, AppError, JWT, hashing
```

### How drawing works

The board is a Konva `Stage` inside [`DrawingCanvas.tsx`](frontend/components/canvas/DrawingCanvas.tsx).
Shapes are plain serialisable objects (`line`, `rect`, `ellipse`, `arrow`,
`text`) held in React state; undo/redo is a snapshot stack in
[`useCanvasHistory`](frontend/components/canvas/hooks/useCanvasHistory.ts).
Pan and zoom are stage-level transforms, so the plane is effectively infinite
and the viewport is saved alongside the shapes — reopening a board restores
where you were looking.

### How saving works

[`useCanvasPersistence`](frontend/components/canvas/hooks/useCanvasPersistence.ts)
debounces ~900 ms after the board goes dirty, then `POST`s (first save) or
`PUT`s the whole document. Saves are serialised: a save requested while one is
in flight is queued and retried after, so a fast sketcher can't interleave
writes. An empty board that has never been saved is deliberately treated as
clean, so panning a blank canvas doesn't create an "Untitled canvas".

### Back-end request flow

```
request → morgan → cors → json(1mb) → /api router
        → authenticate (JWT)          [protected routes]
        → controller (zod parse)
        → service (mongoose)
        → sendSuccess / errorHandler
```

Every response uses one envelope, which the front-end client unwraps:

```jsonc
// success
{ "success": true,  "statusCode": 200, "message": "...", "data": { } }
// failure
{ "success": false, "statusCode": 400, "message": "...", "errors": { } }
```

### Auth model

- Passwords are bcrypt-hashed (cost 12) in a Mongoose `pre("save")` hook, and
  the field is `select: false` so it never loads by accident.
- Login returns a short-lived **access token** (15m) and a **refresh token** (7d).
- Refresh tokens are stored **hashed** (SHA-256) in their own collection, so a
  database leak doesn't hand over usable sessions. Rows carry a TTL index on
  `expiresAt`, so Mongo expires them without a cleanup job.
- The API client retries a 401 once through `/auth/refresh` before giving up,
  so a expired access token is invisible to the user.

---

## MongoDB setup

### Option A — local

```bash
brew install mongodb-community        # macOS
brew services start mongodb-community
```

```env
DB_URI=mongodb://127.0.0.1:27017/glazia
```

The database and collections are created on first write; no migration step.

### Option B — Atlas (needed for any real deployment)

1. Create a free **M0** cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a user with *Read and write to any database*.
3. **Network Access** → add an IP. A hosted back end usually has no fixed
   egress IP, so `0.0.0.0/0` is the pragmatic choice; rely on credentials.
4. **Connect** → *Drivers* → copy the string:

```env
DB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/glazia?retryWrites=true&w=majority
```

URL-encode any special characters in the password (`@` → `%40`).

### Collections

| Collection | Purpose | Indexes |
| --- | --- | --- |
| `users` | name, email, bcrypt password | unique on `email` |
| `canvases` | title, `shapes[]`, viewport, owner | `{ owner: 1, updatedAt: -1 }` |
| `refreshtokens` | hashed token, owner, `expiresAt` | `owner`; TTL on `expiresAt` |

---

## API endpoints

Base URL `/api`. Protected routes need `Authorization: Bearer <accessToken>`.

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | Liveness probe |

### Auth — `/api/auth`

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| `POST` | `/register` | — | `{ name, email, password }` — name 2–80, password 8–128 |
| `POST` | `/login` | — | `{ email, password }` |
| `POST` | `/refresh` | — | `{ refreshToken }` |
| `POST` | `/logout` | — | `{ refreshToken }` — revokes that one session |
| `POST` | `/logout-all` | ✅ | — revokes every session for the user |
| `GET` | `/me` | ✅ | — returns the current user |

`register`, `login` and `refresh` return:

```json
{ "user": { "id": "…", "name": "…", "email": "…" },
  "accessToken": "…", "refreshToken": "…" }
```

### Canvases — `/api/canvases` (all protected)

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `POST` | `/` | `{ title?, shapes[], viewport }` | `201 { canvas }` |
| `GET` | `/` | — | `200 { canvases[] }` — summaries, newest first |
| `GET` | `/:id` | — | `200 { canvas }` — full document |
| `PUT` | `/:id` | `{ title?, shapes?, viewport? }` | `200 { canvas }` |
| `DELETE` | `/:id` | — | `200 { id }` |

Shapes are validated per-kind with a zod discriminated union
([`canvas.validation.ts`](backend/src/modules/canvas/canvas.validation.ts)),
so a malformed shape is rejected at the edge rather than persisted.

List responses carry a **thumbnail payload** rather than full documents:

```jsonc
{
  "id": "…", "title": "Sprint planning", "shapeCount": 42,
  "preview": [ /* ≤140 geometry-only shapes, strokes thinned to ≤40 points */ ],
  "previewBounds": { "minX": 0, "minY": 0, "maxX": 900, "maxY": 600 },
  "previewTruncated": false,
  "updatedAt": "…"
}
```

Ownership is enforced in the service layer: a canvas belonging to someone else
returns `403`, a missing one `404`.

---

## Scripts

### Back end

| Command | Does |
| --- | --- |
| `npm run dev` | tsx watch, reloads on change |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | Runs the built server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, warnings fail |
| `npm run lint:fix` | ESLint with autofix |

> Linting uses [ESLint](https://eslint.org) flat config
> ([`eslint.config.mjs`](backend/eslint.config.mjs)) with
> [`typescript-eslint`](https://typescript-eslint.io). TypeScript is pinned to
> **5.9** because `typescript-eslint` does not support TypeScript 7 yet.
> `_id` is allowed (Mongo's primary key).

### Front end

| Command | Does |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm start` | Serves the build |
| `npm run lint` | ESLint — **currently failing**, see limitations |

### CI

[`backend/.github/workflows/ci.yml`](backend/.github/workflows/ci.yml) runs
lint → typecheck → build → artifact check → a boot smoke test that asserts the
compiled server *rejects* an incomplete environment (proving the emitted
JavaScript actually runs, which `tsc` alone cannot show). A separate advisory
job runs `npm audit`.

The file is written for `backend/` being the repository root. GitHub only
discovers workflows at a repository's root, so while it lives inside this
monorepo it will not trigger.

---

## Deployment

**Front end (Vercel).** Set **Root Directory** to `frontend` in project
settings — the repo root has no `package.json`, and leaving it unset produces a
deployment with nothing in it (every path returns `404 NOT_FOUND`). Root
Directory cannot be set from `vercel.json`. Then set `API_PROXY_TARGET` to the
deployed back end's origin and redeploy.

**Back end.** Needs a long-lived process (Express + a pooled Mongo
connection), so Render / Railway / Fly suit it better than serverless. Build
with `npm run build`, start with `npm start`, and set every variable from the
table above plus `CORS_ORIGIN` pointing at the front end's domain.

Because `/api/*` is proxied server-side by Next, the browser only ever talks to
one origin, so CORS is not in the hot path in production.

---

## Bonus features

Beyond drawing and CRUD:

- **Board thumbnails from real content.** The dashboard renders each board as
  an SVG mini-map of its actual shapes, on the same dot grid as the editor, so
  boards are recognised by sight. This costs no extra database work: the list
  query already loaded every shape in order to count them, so the preview is
  derived from data that was being thrown away.
- **Work without an account.** A signed-out board is kept in **IndexedDB**
  (chosen over `localStorage`: a canvas is unbounded, `localStorage` caps at
  ~5 MB and throws mid-draw, and its writes are synchronous). It is restored on
  your next visit, and signing in offers to adopt it into your account with a
  name.
- **Touch gestures.** Pinch-to-zoom and two-finger pan, with the pinch centre
  pinned under the fingers. A second finger cancels an in-progress stroke, and
  drawing re-arms only once the glass is clear.
- **Responsive by layout, not scaling.** Phones get a bottom tool dock in thumb
  reach with a style sheet; desktop gets a top toolbar and a right-hand
  properties rail. Safe-area insets are respected on notched devices.
- **Autosave that explains itself.** Debounced saves, a queued retry, toast
  notifications with a **Retry** action on failure, and a status line that
  distinguishes "saving", "all saved", "saved on this device only", and
  "nothing to save yet".
- **Considered exit flows.** Custom confirm dialogs throughout (no
  `window.confirm`): leaving a board offers *Save & leave / Discard / Stay*,
  discarding genuinely reloads the last saved version, and an unnamed board is
  asked for a name on the way out. `beforeunload` warns only when work is
  actually at risk.
- **Keyboard and a11y.** Tool shortcuts `1`–`8`, undo/redo, space-to-pan,
  Escape everywhere, `inert` on the closed panel, focus restoration after
  dialogs, and `prefers-reduced-motion` honoured.
- **Security groundwork.** Hashed refresh tokens with TTL expiry, bcrypt cost
  12, non-selectable password field, zod validation on every endpoint, and
  transparent 401 refresh-and-retry in the API client.

---

## Known limitations

Honest list — these are real, not hypothetical.

1. **No automated tests.** Neither side has a test suite. CI covers lint,
   typecheck, build and a boot smoke test, which catches compile and startup
   failures but no behaviour.
2. **The front end's ESLint run fails** — 13 errors, mostly React Compiler
   rules (`react-hooks/refs`, `set-state-in-effect`) against load-bearing
   patterns such as `shapesRef.current = shapes` during render, in both
   original and newer code. Clearing them is a deliberate refactor of working
   code, so it hasn't been done as a side effect of adding CI.
3. **1 MB request body cap.** `express.json({ limit: "1mb" })` — a dense
   freehand board can exceed this and fail to save with `413`. Raising the cap
   is a one-line change but has memory implications worth thinking about.
4. **Every save writes the whole document.** There are no deltas or patches, so
   save cost grows with board size. Fine at sketch scale, wrong at scale.
5. **No collaboration.** Single-writer only. Two tabs on one board will
   overwrite each other, last write wins — there is no version check.
6. **Guest drafts are device-local and single-slot.** One draft, not synced,
   and private-browsing modes may refuse storage (the UI says so when that
   happens).
7. **Access tokens live in `localStorage`**, so they are readable by any
   script on the page. Refresh tokens are hashed server-side, but an XSS bug
   would still expose an active session. httpOnly cookies would be stronger.
8. **No rate limiting** on `/auth/login` or `/auth/register` — nothing slows a
   credential-stuffing attempt.
9. **Thumbnail payloads grow the list response.** Capped per board (140 shapes,
   40 points per stroke), but a large library still returns a lot; there is no
   pagination on `GET /api/canvases`.
10. **CD is not wired.** CI stops at build; nothing deploys automatically.
11. **The CI workflow does not run in this monorepo** — see the note above
    about workflow discovery.
