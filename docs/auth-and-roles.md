# Authentication and role model (Sprint 1 design)

Status: design for team approval. Items marked **[needs team approval]** are provisional. Implementation of the endpoints is Sprint 2.

## 1. Components

| Component | Responsibility |
|---|---|
| Supabase Auth (`auth.users`) | Stores credentials and issues tokens |
| `public.users` | Application user: `id`, `auth_id` (links to `auth.users.id`), `name`, `email`, `role` |
| Express backend | Only gateway to Supabase. Clients never call Supabase Auth or the database directly |

The role lives in `public.users.role` (`customer`, `provider`, `admin`). It is never read from the client request or from token metadata.

## 2. Register flow (Express) [needs team approval]

1. Validate the body: `name`, `email`, `password` (min 8), `role` (`customer` or `provider` only), `provider_type` (required when `role=provider`: `designer` or `manufacturer`), `terms` (must be `true`).
2. Create the Supabase Auth user with the service role key (`auth.admin.createUser`, `email_confirm: true`). No confirmation email is sent, which avoids the Supabase email rate limit during development and the demo.
3. Insert the `users` row with `auth_id` = the new auth user id.
4. If `role=provider`: insert a `providers` row with `provider_type` and `business_name` = `name` as a placeholder. The provider completes the profile during onboarding (Sprint 2).
5. If step 3 or 4 fails, delete the auth user so no orphan account remains.
6. Return `201` with the same data as login.

`admin` is rejected by validation. Admins are set manually: `update users set role = 'admin' where email = '...';`.

## 3. Login flow (Express)

1. Validate `email` and `password`.
2. Call Supabase `signInWithPassword` with the anon key from the backend.
3. Look up the `users` row by `auth_id`. If it is missing, return `401`.
4. Return `token` (the Supabase access token), `refresh_token`, `expires_in` and the `user` object.

## 4. Authenticating every request

1. Read `Authorization: Bearer <token>`. Missing or malformed: `401 UNAUTHORIZED`.
2. Verify the token (`supabase.auth.getUser(token)` for Sprint 2; local JWT verification can replace it later). Invalid or expired: `401 UNAUTHORIZED`.
3. Load the `users` row by `auth_id` and attach `req.user = { id, auth_id, role }`.
4. Role guard per route: wrong role returns `403 FORBIDDEN`.
5. Ownership check inside the handler: a customer only reaches their own projects; a provider only reaches requests addressed to them. Not owner returns `403 FORBIDDEN`.

## 5. Database access

- The backend uses the Supabase `service_role` key, which bypasses Row Level Security.
- Row Level Security is enabled on all tables with no policies, so the public `anon` key cannot read or write any table.
- The `service_role` key lives only in the backend `.env`. It never goes to the web app, the mobile apps, the AI team's notebooks or Git.

## 6. Supabase dashboard settings (Sprint 1)

1. Authentication, Providers: Email provider enabled.
2. Minimum password length: 8, to match the frontend validation.
3. Do not disable "Allow new users to sign up" yet. After register works in Sprint 2, disabling it is recommended so nobody can create accounts through Supabase directly.

## 7. Sprint split

| Sprint 1 (today) | Sprint 2 |
|---|---|
| This design | `POST /auth/register`, `POST /auth/login` |
| Email provider and password length configured | Auth middleware and role guards |
| `users.auth_id` link verified with a manual test user | Provider onboarding endpoints |

## 8. Open points for the team

1. Provider type values: `designer`, `manufacturer` (UI label "Factory"). The roadmap lists designer, tailor, workshop, factory.
2. `email_confirm: true` skips email verification. Revisit before a public demo if real verification is wanted.
3. Token verification method (`getUser` call versus local JWT verification).
4. Whether the frontend should keep `terms` in the request body (the Express register endpoint requires it).
