# Tutor Learning Platform frontend

Next.js 16 App Router frontend. The browser calls same-origin `/api/*`; Next.js proxies those
requests to the Spring Boot backend configured by `BACKEND_INTERNAL_URL`.

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

- `BACKEND_INTERNAL_URL` — server-side rewrite target; defaults to `http://localhost:8080`.
- `DEMO_MODE` — set to `true` at container runtime to show demo form-fill buttons. The
  helper never renders in production and never logs in automatically.

Demo users:

```text
Teacher:       teacher.demo@tutor.local / DemoTeacher123!
Student Alex:  alex.demo@tutor.local / DemoStudent123!
Student Maria: maria.demo@tutor.local / DemoStudent123!
```

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
