# API contract v1 (draft)

`openapi.yaml` is the contract for the frontend, both mobile apps and the AI team. Status: draft for team approval.

## How to view it

1. Open `https://editor.swagger.io`, choose File, Import file, and select `openapi.yaml`.
2. Or in VS Code install an OpenAPI/Swagger viewer extension.

## How to read it

- Base URL (local): `http://localhost:5000/api/v1`
- Success: `{ "data": ... }`, lists also have `{ "meta": { page, page_size, total } }`
- Error: `{ "error": { "code", "message", "details" } }`
- `x-roles`: roles allowed on the operation. No `x-roles` means any authenticated user, or public when `security` is empty.
- `x-implementation-sprint`: when the real endpoint is planned. Until then it returns `501 NOT_IMPLEMENTED` after validation.
- Send the token as `Authorization: Bearer <token>`.

## What each team should read first

| Team | Start with |
|---|---|
| Frontend and Mobile 1 | Auth, Categories, Providers, Projects, Matching, Requests, Messaging, Designs |
| Mobile 2 | Auth, Provider profile, Requests, Messaging, Projects (status) |
| AI 1 | `POST /ai/extract-requirements`, `ExtractedRequirements` (output is `items[]`), and the AI to database field mapping in `docs/conventions.md` section 6 |
| AI 2 | `POST /projects/{id}/matches`, `MatchResponse`, `MatchBreakdown`, `ExcludedProvider` |
| AI 3 | `POST /ai/generate-design`, `Design`, `DesignSource` |

Operations tagged "Order workflow (deferred)" are designed but built only if the Month-3 MVP is stable.

## Keeping it honest

The backend validation schemas in `backend/src/validators/schemas.js` must match this file. Any change to a field name, status value or endpoint is made in the contract and the code in the same pull request.
