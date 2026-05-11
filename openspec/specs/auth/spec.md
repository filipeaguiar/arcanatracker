# Authentication & Security Specification
> Source: `supabase/migrations/007_enable_rls.sql`, `008_seed_categories.sql`

## Purpose
Ensures secure user authentication and strict data isolation between different users of the Tracker system.

## Requirements

### Requirement: Data Isolation
The system MUST ensure that users can only access their own data.

#### Scenario: Unauthorized Access Attempt
- **GIVEN** a user authenticated as `User A`
- **WHEN** trying to select from `transactions` where `user_id` is `User B`
- **THEN** the system SHALL return an empty result or error (enforced by RLS)

### Requirement: New User Onboarding
The system SHALL automatically initialize new accounts with essential configuration.

#### Scenario: New User Signup
- **GIVEN** a new user account is created in `auth.users`
- **WHEN** the signup is completed
- **THEN** a database trigger SHALL execute `seed_default_categories`
- **AND** the user SHALL have a default set of categories (e.g., 'alimentação', 'transporte', 'salário') automatically created

### Requirement: Security Standards
- **RLS**: Row Level Security MUST be enabled on all tables (`categories`, `tags`, `transactions`, `credit_cards`, `invoices`, `subscriptions`, `telegram_connections`).
- **Policy Enforcement**: Every table MUST have policies for SELECT, INSERT, UPDATE, and DELETE that verify `user_id = auth.uid()`.

## Technical Notes
- **Implementation**: Supabase RLS policies
- **Initialization**: `on_auth_user_created` trigger in `supabase/migrations/008_seed_categories.sql`
