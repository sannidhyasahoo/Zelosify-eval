# Zelosify Backend — Multi-Tenant AI Recruitment API Server

The core Node.js, Express, and TypeScript backend server for **Zelosify Recruit**, orchestrating identity management via Keycloak, multi-tenant relational persistence via Prisma/PostgreSQL, S3 presigned upload generation, and candidate evaluation via LangGraph.

---

## Quickstart

### 1. Start Infrastructure (PostgreSQL & Keycloak)
```bash
cd Server
docker compose up -d
```
* **PostgreSQL 18**: `localhost:5445`
* **Keycloak 26.1**: `localhost:8080/auth`

### 2. Environment Configuration
Verify `Server/.env` (see `.env.example` for reference):
```ini
DATABASE_URL="postgresql://postgres:testrun@localhost:5445/zelosify_recruit_test?schema=app"
PORT=5000
FRONTEND_URL="http://localhost:5173"
KEYCLOAK_URL="http://localhost:8080/auth"
```

### 3. Install Dependencies & Initialize Database
```bash
npm install
npm run prisma:generate
npm run prisma:deploy
```

### 4. Seed Bruce Wayne Corp Openings & Test Accounts
```bash
npm run seed
```
This runs both opening provisioning (12+ positions) and Keycloak/DB user credential synchronization.

### 5. Start Development Server
```bash
npm run dev
```
Server runs at [http://localhost:5000](http://localhost:5000).

---

## Automated Test Suites

```bash
# Run 88+ unit tests (scoring formula, boundaries, normalization, security)
npm test -- --run

# Run full Phase 7 verification & 100-profile performance benchmark
npm run test:phase7

# Run E2E API verification
npm run test:e2e
```

---

## Key Modules in `src/`

* `routers/`: Express routers organized by domain (`vendor`, `hiring`, `auth`, `aws`)
* `controllers/`: HTTP request validation, response formatting, and service delegation
* `services/recommendation/`:
  * `agentGraph.ts`: LangGraph tool-calling state machine
  * `recommendationTools.ts`: Tool registry (`parse_resume`, `extract_features`, `normalize_skills`, `calculate_match_score`)
  * `scoringService.ts`: Pure deterministic scoring engine & decision policy
  * `recommendationDispatcher.ts`: Non-blocking async queue with concurrency limits
  * `resumeParser.ts`: PDF & PPTX parsing with prompt injection neutralization
* `services/opening/`: Opening query filters, candidate presigning, and atomic submission

---

> For complete end-to-end documentation, test credentials, and architecture diagrams, please refer to the [Root README](../README.md).
