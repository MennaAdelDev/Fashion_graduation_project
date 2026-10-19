# Future schema (design only, not created in Sprint 1)

These tables are planned so current tables do not need to change later.

| Table | Planned fields | Depends on | Target |
|---|---|---|---|
| `notifications` | `id`, `user_id`, `type`, `payload jsonb`, `read_at`, `created_at` | `users` | Sprint 4 |
| `design_versions` | `id`, `project_design_id`, `version_number`, `is_selected`, `created_at` | `project_designs` | Month 4 |
| `favorites` | `id`, `customer_id`, `provider_id` or `project_design_id`, `created_at` | `users`, `providers` | Month 4 |
| `structured_review_scores` | `review_id`, `quality`, `communication`, `deadline`, `value` | `reviews` | Month 4 |
| `quotes` | `id`, `project_id`, `provider_id`, `amount`, `status` (`draft`, `sent`, `accepted`, `rejected`, `expired`) | `projects`, `providers` | Month 5 |
| `production_stages` | `id`, `project_id`, `stage`, `status` (`not_started`, `in_progress`, `completed`), `updated_at` | `projects` | Month 5 |
