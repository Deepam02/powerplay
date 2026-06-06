# Invoice Management Dashboard

A full-stack B2B invoice management application built with React, Node.js/Express, and MongoDB.

**Live demo:** https://powerplay-assignment.deepam.dev/

---

## Prerequisites

- Docker Desktop running
- Ports 5000, 5173, and 27017 must be free

---

## Quick Start

```bash
# Build and start all three services (mongo, api, frontend)
docker compose up --build -d

# Seed the database (first time only — safe to re-run)
docker compose exec api npm run seed
```

Frontend available at http://localhost:5173

The seed step is idempotent, running it multiple times produces no duplicates.

---

## Running Tests

```bash
docker compose exec api npm test
```

---

## Project Structure

```
powerplay/
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose models (Customer, Invoice)
│   │   ├── routes/          # Express routers
│   │   ├── controllers/     # Request/response handlers
│   │   ├── services/        # Business logic + DB queries
│   │   ├── validators/      # Zod schemas
│   │   ├── __tests__/       # Jest + Supertest tests
│   │   ├── seed.ts          # Idempotent seed script
│   │   └── index.ts         # Express app entry
│   └── seed-data.json       # Source data (2,000 invoices)
└── frontend/
    └── src/
        ├── pages/           # InvoiceList, CustomerProfile
        ├── components/      # Table, Modal, SummaryPanel, etc.
        ├── hooks/           # TanStack Query hooks
        ├── types/           # Shared TypeScript types
        └── lib/             # axios instance + formatters
```

---

## Data Modeling Rationale

### Two Collections: Customer + Invoice

**Why normalized (not embedded)?**

Each customer has exactly one company (1:1), and a customer has many invoices. Embedding the customer object inside every invoice would:
- Duplicate the customer's name/company across potentially hundreds of records
- Make it impossible to efficiently query "all invoices for a given customer" without scanning the full collection
- Require updating every invoice if a customer's details change

Storing customers in a separate collection and referencing them via `customerId` (ObjectId ref) is the correct relational approach.

### Invoice Indexes

| Index | Purpose |
|-------|---------|
| `invoiceId` (unique) | Fast lookup by invoice ID; enforces uniqueness |
| `{ status, issueDate }` | Combined filter, most common query pattern |
| `{ customerId }` | Customer profile page: fetch all invoices for a customer |
| `{ amount }` | Sorting by amount |
| `{ dueDate }` | Sorting and filtering by due date |

### Pre-save Hook

`tax` and `total` are computed server-side in the Mongoose `pre('save')` hook. The frontend never sends these values; they are always derived from `amount x taxRate`. This prevents data inconsistency if a client sends stale or incorrect computed values.

### Seed Script

The seed uses MongoDB's `updateOne(..., { upsert: true })` pattern:
- Customers are upserted by `name` using `$setOnInsert` (never overwrites existing data)
- Invoices are upserted by `invoiceId` using `$set` (idempotent re-runs are safe)
- Tax/total are recomputed in the seed script (since `updateOne` bypasses Mongoose middleware)

---

## API Reference

All responses follow `{ success: boolean, data: any, meta?: { page, limit, total } }`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | Paginated list with filters/sort/search |
| GET | `/api/invoices/:id` | Single invoice |
| POST | `/api/invoices` | Create invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| GET | `/api/customers` | List all customers |
| GET | `/api/customers/:id` | Customer profile + aggregated metrics |
| GET | `/api/summary` | Global stats + top 5 customers |
| GET | `/health` | Health check |

**Invoice list query params:** `page`, `limit`, `sort` (amount_asc/desc, dueDate_asc/desc), `status`, `customer`, `issueDateFrom`, `issueDateTo`, `dueDateFrom`, `dueDateTo`, `search`

---

## Assumptions

1. `invoiceId` for new invoices is auto-generated as `INV-` + 7 random digits. On a collision, the server retries up to 5 times with a new ID before failing.
2. The seed reads from `./backend/seed-data.json` (baked into the Docker image via `COPY`). The root-level `seed-data.json` is kept as a reference copy but not used by any script.
3. Currency is displayed in Indian Rupees (Rs.) since the dataset uses Indian company names.
4. The frontend Vite dev server runs in the Docker container; hot reload works via the `./frontend/src` volume mount.
5. Tax/total values in the seed JSON are not used; the backend always recomputes them.
