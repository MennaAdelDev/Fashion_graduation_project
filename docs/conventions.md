# API and Data Conventions (v1 draft)

Status: proposed by Backend 1/2. Items marked **[needs team approval]** are provisional.

## 1. General

- Base URL (local): `http://localhost:5000/api/v1` **[needs team approval]**
- Format: JSON, `Content-Type: application/json`
- JSON field names: `snake_case`, identical to database column names
- IDs: UUID v4 strings
- Dates: `date` as `YYYY-MM-DD`, timestamps as ISO 8601 UTC
- Money: plain numbers in EGP, no currency symbol
- The database is the source of truth. AI endpoints never return invented prices, MOQ, capacity, availability or ratings.

## 2. Authentication and roles

- Auth provider: Supabase Auth, accessed only through the Express backend **[needs team approval]**
- Clients send `Authorization: Bearer <access_token>`
- Roles: `customer`, `provider`, `admin`
- `admin` cannot be created through the API; it is set manually in the database
- Provider types (field `providers.provider_type`): `designer`, `manufacturer`, exactly the values of the frontend register form; the UI label for `manufacturer` is "Factory" **[the roadmap lists designer, tailor, workshop, factory; extending the list is one small migration]**
- Frontend register form mapping: `Customer` -> `role=customer`; `Designer` -> `role=provider, provider_type=designer`; `Factory` -> `role=provider, provider_type=manufacturer`
- Full auth design: `docs/auth-and-roles.md`

| Resource | customer | provider | admin |
|---|---|---|---|
| Browse providers, portfolio, reviews, categories | read | read | read |
| Own provider profile, pricing, hours, availability, portfolio | no | read/write own | read/write all |
| Projects | read/write own | read projects they received a request for | read all |
| Project requests | create for own project | read/respond to own | read all |
| Matches | read for own project | no | read all |
| Conversations and messages | participant only | participant only | read all |
| Reviews | create/edit own | read own | moderate |

## 3. Response format

Success, single resource:

```json
{ "data": { "id": "uuid" } }
```

Success, list:

```json
{ "data": [], "meta": { "page": 1, "page_size": 20, "total": 0 } }
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "quantity", "message": "Must be an integer greater than or equal to 1" }]
  }
}
```

| HTTP status | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body, query or params invalid |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Valid token, role or ownership not allowed |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate (for example email already registered) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 501 | `NOT_IMPLEMENTED` | Contract exists but the endpoint is not built yet (skeleton only) |

`details` is present only for `VALIDATION_ERROR`.

## 4. Lists

- Pagination: `?page=1&page_size=20` (default 20, max 100)
- Sorting: `?sort=field` or `?sort=-field` (minus = descending)
- Filters are plain query parameters named after the field

## 5. Statuses (proposed)

| Entity | Values |
|---|---|
| `projects.status` | `draft`, `open`, `in_progress`, `completed`, `cancelled` |
| `project_requests.status` | `pending`, `negotiating`, `accepted`, `rejected`, `withdrawn`, `expired` (MVP uses `pending`, `accepted`, `rejected`, `withdrawn`; `expired` is set when another provider is accepted; `negotiating` belongs to the deferred quotes flow) |
| `orders.status` (deferred, Month 4-5) | `awaiting_deposit`, `in_production`, `pending_customer_approval`, `shipped`, `delivered`, `completed`, `disputed`, `cancelled` |
| `availability.status` | `available`, `limited`, `unavailable` |
| Matching result (response `data.status` only) | `completed`, `no_match`. A failed run uses the error format (`INTERNAL_ERROR`) instead of a status |

`matches` has no status in Sprint 1.

## 6. Roadmap additions and deviations [all need team approval]

1. Added `project_requests`: the roadmap requires request creation and accept/reject but lists no table.
2. Added `project_designs`: Must-Have requires saving/attaching reference images and generated concepts. `source` is `upload`, `generated` or `demo` so fallback images are always labeled.
3. Added `provider_pricing.lead_time_days`: needed for the "impossible deadline" hard constraint.
4. Added `provider_working_hours` and `providers.requirements`: the roadmap requires both in the profile but has no field for them. `day_of_week`: 0 = Sunday ... 6 = Saturday.
5. Removed stored `providers.rating`: rating average and count come from view `provider_rating_stats` (computed from `reviews`, hidden reviews excluded).
6. A project holds one or more items in `project_items` (each with its own category, quantity, material, color, style, size, customization). `projects.category_id`, `projects.quantity` and `project_requirements` no longer exist. A single product is a project with one item.
7. Added `projects.location_city`: the roadmap lists location as a ranking factor.
8. Added controlled vocabulary `materials` and `provider_materials`. Fabric is never free text, so the AI, matching and provider profiles use the same names. `project_items.material_confirmed` is false while the material is only an AI suggestion; matching treats the material as a hard constraint only after the customer confirms it.
9. AI requirement JSON to database mapping: `items[]` -> `project_items` rows (`category` -> `category_id`, `material` -> `material_id`, `item_name`, `quantity`, `color`, `style`, `size_details`, `customization`); `budget` -> `projects.budget_min`/`budget_max`; `deadline` -> `projects.deadline`; `location_city` -> `projects.location_city`; `priorities` and other extra fields -> `project_items.extra` or the request context.
10. `notifications` table is created now (migration 004). Endpoints and event hooks are Sprint 4.
11. Added database rules: a project outside `draft` needs at least one item; only one accepted request per project; only the customer or provider of a conversation can post a message.
12. Order workflow (quotes, orders, deposit payment simulation, production stages, issues) is designed in `backend/db/deferred/005_order_workflow.sql` and in the contract tagged "Order workflow (deferred)". It is NOT applied in the MVP. See `docs/business-flow.md`.

## 7. Storage structure

| Bucket | Access | Path | Used by |
|---|---|---|---|
| `portfolio` | public read | `{provider_id}/{uuid}.{ext}` | provider portfolio images |
| `project-references` | private | `{project_id}/{uuid}.{ext}` | customer inspiration images |
| `project-designs` | private | `{project_id}/{uuid}.{ext}` | generated or demo concepts |
| `order-media` (deferred) | private | `{order_id}/{uuid}.{ext}` | progress photos and issue evidence |

- Allowed types: `image/jpeg`, `image/png`, `image/webp`. Max size 5 MB.
- Uploads go through the backend. Clients never receive the service key.
- The database stores the file URL in `portfolio.image_url` and `project_designs.image_url`.

## 8. Endpoint groups

The full contract is `docs/api/openapi.yaml` (OpenAPI 3.0, 59 operations, 15 of them deferred). Each operation lists `x-roles` and `x-implementation-sprint`.

| Group | Sprint 1 | Implemented |
|---|---|---|
| `/health`, `/health/db` | built | Sprint 1 |
| `/auth`, `/categories`, `/materials`, `/providers` (list, profile, own profile, pricing, materials, hours, availability, portfolio) | contract + skeleton | Sprint 2 |
| `/providers/{id}/reviews` | contract + skeleton | Sprint 3 |
| `/projects` (CRUD, items, status, designs), `/projects/{id}/requests`, `GET /project-requests`, `GET /project-requests/{id}` | contract + skeleton | Sprint 3 |
| `/ai/*` | draft contract, to finalize with AI 1 and AI 3 | Sprint 3 |
| `/projects/{id}/matches`, `/providers/compare`, `PATCH /project-requests/{id}`, `/conversations`, `/notifications` | contract + skeleton | Sprint 4 |
| `/quotes`, `/orders` (status, stages, payments simulation, issues, media), `/order-issues` | contract + skeleton, database design in `db/deferred` | Sprint 9, only if the Month-3 MVP is stable |
| Admin and moderation endpoints | not in v1 | Sprint 5 |
| Advanced scheduling | table in schema only | Sprint 7 |
