# Tutor Learning Platform frontend

Next.js 16 App Router frontend. The browser calls same-origin `/api/*`; Next.js proxies those
requests to the Spring Boot backend configured by `BACKEND_INTERNAL_URL` at server runtime.

## Local development

Start PostgreSQL and the real backend first. To include the seeded demo users, run from the
repository root:

```bash
SPRING_PROFILES_ACTIVE=demo APP_DEMO_DATA_ENABLED=true docker compose up -d postgres execution-worker backend
```

Then start the frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The only frontend environment variables are:

- `BACKEND_INTERNAL_URL` — server-side API proxy target at runtime; defaults to `http://localhost:8080`.
- `DEMO_MODE` — set to `true` at container runtime to show demo form-fill buttons. The
  helper never renders in production and never logs in automatically.

Demo users:

```text
Teacher:       teacher.demo@tutor.local / DemoTeacher123!
Student Alex:  alex.demo@tutor.local / DemoStudent123!
Student Maria: maria.demo@tutor.local / DemoStudent123!
```

## Production browser security

Production responses (including `/api/*` proxy responses and static assets) set
`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and a
`Permissions-Policy` that disables unused device capabilities. Clipboard writes are
limited to the same origin for invitation/share links and content-package prompts.
The referrer policy also protects bearer tokens in public progress/report URLs.
These headers are disabled under `next dev`.

The enforced production CSP is:

```text
default-src 'self'; script-src 'self' 'nonce-<random-per-response>';
script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:;
font-src 'self'; connect-src 'self'; worker-src 'none'; media-src 'none';
object-src 'none'; frame-src 'none'; frame-ancestors 'none';
base-uri 'self'; form-action 'self'
```

`proxy.ts` generates a cryptographically random nonce for each page request and
passes the policy to Next.js before rendering. The root layout already calls
`connection()`, so pages (including public shares) render dynamically and the
framework applies the nonce to inline runtime/hydration scripts. HTML responses
are private/no-store; a CDN must not cache or replace these responses. Prefetch and
RSC requests also receive the policy. API and asset responses use the same policy
without a script nonce. `/api/*` uses a streaming runtime route proxy because
Next.js external rewrites discard configured response headers. It forwards
methods, query strings, bodies, cookies/CSRF and download metadata, then applies
the browser security headers to both successful and failed responses. The
backend origin stays server-only and browser API calls remain same-origin.

There are no wildcard sources, external script/image/font hosts, `unsafe-eval`,
or `unsafe-inline` scripts. `style-src 'unsafe-inline'` permits existing React
style attributes (progress widths, Next/Image layout). `img-src blob:` permits
local upload previews. Fonts are system fonts; the bundled illustration, favicon,
Next/Image assets and API downloads are same-origin. Optimized image responses
retain an isolated policy: `default-src 'none'; frame-ancestors 'none'; sandbox`.
All validation schemas import the shared Zod configuration with `jitless: true`,
so schema construction/validation never probes eval or compiles code at runtime. External material links open
as separate pages; markdown images and embedded HTML are disabled. The current
code editor is a textarea, not Monaco, and uses no workers or CDN loader. If Monaco
is introduced, bundle it and its workers locally and revisit `worker-src` with
browser tests rather than adding `unsafe-eval` or CDN exceptions.

Development pages have no application CSP so Next.js debugging/HMR can run normally. Neither HSTS nor
`upgrade-insecure-requests` is added to production HTTP smoke tests or local dev.

HSTS is deliberately omitted: the checked-in Docker/Compose deployment exposes HTTP
and does not establish an HTTPS-only public origin or a trusted TLS terminator.
Configure HSTS at the HTTPS reverse proxy once the production domain, certificate,
and HTTP-to-HTTPS redirect are verified. Do not enable it for local HTTP or assume
all subdomains support HTTPS.

## OpenAPI and checks

Spring Boot `/v3/api-docs` is the API source of truth. With the backend on port 8080, regenerate
the isolated client schema (never edit it manually):

```bash
npm run api:generate
```

Run the frontend checks with:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Security browser tests

`npm run e2e:security` verifies headers, fresh script nonces, CSP enforcement,
assets/Next/Image, login and teacher navigation, student code run/submit, public
progress/report and PDF downloads. Run it against a **production** build or the
standalone Docker server, with an isolated demo backend/worker as below. It is also
included in `e2e:critical` and the existing CI E2E job. To use an installed Chrome
locally, set `PLAYWRIGHT_CHANNEL=chrome`; CI uses Playwright's bundled Chromium.

## Critical Playwright E2E

The critical E2E suite runs only against a loopback frontend backed by an isolated PostgreSQL,
backend, and execution worker. It enables the backend's `demo` profile and demo seed; the
Playwright configuration rejects production and public demo URLs.

Clone the public `main` branches of `tutorplatform-backend` and
`tutor-learning-platform-execution-worker` next to this repository, then run:

```bash
npm ci
npx playwright install --with-deps chromium
docker compose -f .github/e2e/compose.yml up --build --detach --wait --wait-timeout 300
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e:critical
docker compose -f .github/e2e/compose.yml down --volumes --remove-orphans
```

The suite covers authentication, teacher students, the learning program editor, materials, the
student learning journey, and homework/submissions. Traces and screenshots for failed tests are
written to `test-results/`; CI also uploads them together with the HTML report.
