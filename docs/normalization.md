# Normalization notes

Target: third normal form for the transactional data. Every table has one subject, a primary key, and non-key columns that depend only on that key.

## What was normalized

| Before | After | Why |
|---|---|---|
| One category and one quantity on `projects` | `project_items` (one row per product) | A request can contain several products; avoids repeating groups |
| `project_requirements.fabric` free text | `materials` catalog + `project_items.material_id` | AI, matching and providers use identical names; no spelling variants |
| Provider fabrics not stored | `provider_materials` (many-to-many) | Matching can filter by material |
| Stored `providers.rating` | view `provider_rating_stats` | Computed value is never stale |

## Consistency that the database enforces

- Composite foreign keys keep copied ids consistent (a conversation's customer must own the project; deferred order/quote tables repeat project, provider and customer ids only with composite keys).
- Check constraints for statuses, quantity and price ranges.
- Triggers for rules a constraint cannot express (project needs items, message sender, one accepted request).

## Intentional denormalization

- `users.email` duplicates the Supabase auth email for queries.
- `jsonb extra` columns hold optional AI fields that are not yet stable.

## For the AI team

Send `material` and `category` by name; the backend maps them to ids from `materials` and `categories`. Do not invent names outside those lists. The seed list in `backend/db/seed/002_materials.sql` is provisional and AI 1 must align it.
