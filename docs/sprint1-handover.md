# Sprint 1 handover: Backend 1 and Backend 2

## Deliverables

| Roadmap deliverable | File | Status |
|---|---|---|
| Database ERD and schema | `docs/ERD.md`, `backend/db/migrations/001-004` | 001-003 applied. 004 and seed 002 are new and must be applied (check `select count(*) from projects` first) |
| Auth and role model | `docs/auth-and-roles.md` | Designed. Email provider and password length set in Supabase. Endpoints are Sprint 2 |
| Storage structure | `docs/conventions.md` section 7, `003_storage_buckets.sql` | Done. 3 buckets created |
| API conventions | `docs/conventions.md` | Draft for approval |
| API contract v1 | `docs/api/openapi.yaml` | Draft for approval. 59 operations (15 deferred) |
| Backend project and error/validation foundation | `backend/` | Done. Runs locally, 30 tests pass |
| Shared AI to database field mapping | `docs/conventions.md` section 6 | Draft, needs AI 1 |
| Future tables | `docs/future-schema.md`, `backend/db/deferred/005_order_workflow.sql` | Design only, do not apply yet |
| Business flow and normalization | `docs/business-flow.md`, `docs/normalization.md` | Proposed |

## Decisions that need team approval

1. `provider_type` values are `designer` and `manufacturer` (UI label "Factory"). The roadmap lists designer, tailor, workshop, factory.
2. Auth goes through Express. Register creates users with `email_confirm: true` (no confirmation email).
3. Response envelope: `{ data }` and `{ error: { code, message, details } }`. The frontend `auth.js` needs the patched version.
4. Added to the roadmap data model: `project_requests`, `project_designs`, `provider_working_hours`, `provider_pricing.lead_time_days`, `providers.requirements`, `projects.location_city`, `project_items`, `materials`, `provider_materials`, `notifications`. Removed stored `providers.rating` (computed by view `provider_rating_stats`).
5. A project contains one or more items (`project_items`), each with its own category, quantity and material. The AI output becomes `items[]` (affects AI 1 and AI 2).
6. One review per customer per provider.
7. Provider browsing (`GET /providers`, `GET /providers/{id}`, availability, reviews, categories) is public, no login required.
8. Project status transition rules (see `PATCH /projects/{id}/status` in the contract).
9. Base URL `/api/v1` (the frontend comment suggested `/api/auth`).
10. Matching response format, `MatchBreakdown` names and weights belong to AI 2. AI endpoints belong to AI 1 and AI 3. Both are drafts.
11. The `notifications` table is created in migration 004; endpoints are Sprint 4.
13. Order workflow (offers, deposit simulation, stages, issues) is designed but deferred. Deposit 30%, sample approval from 50 pieces, 7-day issue window and 3 negotiation rounds are placeholders. Return/rework policy needs legal and business review.
12. The roadmap says React/Next.js for web; the repository frontend is static HTML/CSS/JS.

## What each teammate needs to do

- Everyone: clone, then `cd backend`, `npm install`, create `.env` (ask Backend for the Supabase values through a private channel, never in Git), `npm run dev`, open `http://localhost:5000/api/v1/health`.
- Frontend: replace `frontend/auth.js` with the patched version, set `API_BASE` to `http://localhost:5000/api/v1/auth`, and review the register form mapping.
- Mobile 1 and Mobile 2: read `docs/api/README.md`, use the same envelope and error handling.
- AI 1, AI 2, AI 3: review your draft endpoints in the contract and the field mapping, and send corrections before Sprint 3.

## Not done or not verified

- Authentication endpoints are not implemented (Sprint 2). The Supabase Auth to `users` link was verified manually with a test user.
- `GET /health/db` was not run against the real Supabase project by the author of the skeleton. Run it after setting `.env`.
- The ERD diagram (Mermaid) has not been checked in GitHub rendering.
- Admin and moderation endpoints are not in v1 (Sprint 5).
