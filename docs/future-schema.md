# Future schema (design only, not created yet)

Tables that exist already (migrations 001 to 004): `materials`, `provider_materials`, `project_items`, `notifications`.

The order workflow tables are fully written in `backend/db/deferred/005_order_workflow.sql` and must not be applied before the Month-3 MVP is stable: `quotes`, `quote_items`, `orders`, `payments`, `production_stages`, `order_issues`, `order_media`, plus views `quote_totals` and `order_financials`.

Still only ideas:

| Table | Planned fields | Depends on | Target |
|---|---|---|---|
| `design_versions` | `id`, `project_design_id`, `version_number`, `is_selected`, `created_at` | `project_designs` | Month 4 |
| `favorites` | `id`, `customer_id`, `provider_id` or `project_design_id`, `created_at` | `users`, `providers` | Month 4 |
| `structured_review_scores` | `review_id`, `quality`, `communication`, `deadline`, `value` | `reviews` | Month 4 |
