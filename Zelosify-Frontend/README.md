# Zelosify Frontend — Enterprise Candidate Review Portal

The modern, responsive Next.js 15 client application for **Zelosify Recruit**, supporting the **IT Vendor** and **Hiring Manager** personas.

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create or verify `.env.local` in `Zelosify-Frontend/`:
```ini
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000/api/v1"
NODE_ENV="development"
```

### 3. Start Development Server
```bash
npm run dev
```
The application will be running at [http://localhost:5173](http://localhost:5173).

---

## Key Routes & Portals

* **Public SaaS Landing Page**: [`/`](http://localhost:5173/)
* **Authentication**: [`/login`](http://localhost:5173/login)
* **IT Vendor Portal**: [`/vendor/openings`](http://localhost:5173/vendor/openings)
  * Contract opening discovery
  * Opening details & direct S3 candidate upload (`/vendor/openings/:id`)
  * Candidate preview & soft deletion
* **Hiring Manager Portal**: [`/hiring-manager/openings`](http://localhost:5173/hiring-manager/openings)
  * Opening roster & candidate queue
  * Master-detail candidate review workspace (`/hiring-manager/openings/:id`)
  * AI recommendation explainability telemetry modal
  * Shortlist & reject decisions
* **Payments & Ledger**: [`/vendor/payments`](http://localhost:5173/vendor/payments)

---

## Build for Production
To verify TypeScript compilation and Next.js production bundling:
```bash
npm run build
```

---

> For complete end-to-end setup instructions, Keycloak configuration, and test accounts, please refer to the [Root README](../README.md).
