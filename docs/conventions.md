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

`details` is present only for `VALIDATION_ERROR`.

## 4. Lists

- Pagination: `?page=1&page_size=20` (default 20, max 100)
- Sorting: `?sort=field` or `?sort=-field` (minus = descending)
- Filters are plain query parameters named after the field

## 5. Statuses (proposed)

| Entity | Values |
|---|---|
| `projects.status` | `draft`, `open`, `in_progress`, `completed`, `cancelled` |
| `project_requests.status` | `pending`, `accepted`, `rejected`, `withdrawn` |
| `availability.status` | `available`, `limited`, `unavailable` |
| Matching result (response only) | `completed`, `no_match`, `failed` |

`matches` has no status in Sprint 1.

## 6. Roadmap additions and deviations [all need team approval]

1. Added `project_requests`: the roadmap requires request creation and accept/reject but lists no table.
2. Added `project_designs`: Must-Have requires saving/attaching reference images and generated concepts. `source` is `upload`, `generated` or `demo` so fallback images are always labeled.
3. Added `provider_pricing.lead_time_days`: needed for the "impossible deadline" hard constraint.
4. Added `provider_working_hours` and `providers.requirements`: the roadmap requires both in the profile but has no field for them. `day_of_week`: 0 = Sunday ... 6 = Saturday.
5. Removed stored `providers.rating`: rating average and count come from view `provider_rating_stats` (computed from `reviews`, hidden reviews excluded).
6. `projects.category_id` is a foreign key to `categories`, one category per project.
7. Added `projects.location_city`: the roadmap lists location as a ranking factor.
8. AI requirement JSON to database mapping: `material` -> `project_requirements.fabric`; `item` -> `project_requirements.item`; `budget` -> `budget_min`/`budget_max`; `priorities` and other extra fields -> `project_requirements.extra`.
9. `notifications` is Optional-Later in the roadmap but basic notifications are Must-Have; the table is designed now and created in Sprint 4.

## 7. Storage structure

| Bucket | Access | Path | Used by |
|---|---|---|---|
| `portfolio` | public read | `{provider_id}/{uuid}.{ext}` | provider portfolio images |
| `project-references` | private | `{project_id}/{uuid}.{ext}` | customer inspiration images |
| `project-designs` | private | `{project_id}/{uuid}.{ext}` | generated or demo concepts |

- Allowed types: `image/jpeg`, `image/png`, `image/webp`. Max size 5 MB.
- Uploads go through the backend. Clients never receive the service key.
- The database stores the file URL in `portfolio.image_url` and `project_designs.image_url`.

## 8. Endpoint groups (contract details are in the API contract v1 document)

| Group | Sprint 1 | Implemented |
|---|---|---|
| `/auth`, `/users`, `/providers`, `/categories` | contract + skeleton | Sprint 2 |
| `/projects`, `/project-requests` | contract + skeleton | Sprint 3 |
| `/matching` | contract + skeleton | Sprint 3-4 |
| `/conversations`, `/messages` | contract | Sprint 4 |
| `/ai/*` | draft contract with AI team | Sprint 3-5 |
| availability and scheduling | table in schema | basic in Sprint 2, advanced in Sprint 7 |
