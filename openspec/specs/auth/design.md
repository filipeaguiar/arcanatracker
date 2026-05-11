# Authentication & Security Design
> Implementation of user isolation and security policies.

## Context
As a financial application, data privacy is paramount. This design leverages Supabase's native security features to ensure strict multi-tenancy.

## Decisions

### Row Level Security (RLS) as Primary Defense
- **Decision**: Enable RLS on all tables and use `auth.uid()` for policy enforcement.
- **Rationale**: Provides a defense-in-depth layer directly at the database level, preventing data leaks even if application code has bugs.

### Automatic Categorization Trigger
- **Decision**: Use a PostgreSQL trigger `on_auth_user_created` to seed categories.
- **Rationale**: Ensures every user has a working environment immediately after signup without requiring additional API calls from the frontend.

### Server-Side Supabase Client
- **Decision**: Use `@supabase/ssr` to create server clients with cookie-based session management.
- **Rationale**: Securely handles JWTs in Next.js Server Components and Actions, preventing token exposure on the client-side.

## Technical Architecture

### RLS Policy Pattern
```sql
CREATE POLICY "Users can manage own <entity>"
    ON <entity> FOR ALL
    USING (user_id = auth.uid());
```

### New User Workflow
1. User signs up via Supabase Auth.
2. PostgreSQL trigger `on_auth_user_created` fires.
3. `seed_default_categories(p_user_id)` is executed.
4. User logs in and finds a pre-populated list of categories (e.g., 'alimentação', 'saúde').

## Components
- `supabase/migrations/007_enable_rls.sql`: Policy definitions.
- `supabase/migrations/008_seed_categories.sql`: Trigger and seed logic.
- `src/lib/supabase/server.ts`: Secure client factory.
