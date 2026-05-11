# Auth Tests
> Security and isolation verification.

## Strategy
Exhaustive testing of Row Level Security (RLS) policies and onboarding triggers.

## Test Cases

### RLS Policies
- **Isolation**: Log in as `User A` and try to read/write `User B`'s data (must fail).
- **CRUD coverage**: Ensure every table has policies for Select, Insert, Update, and Delete.

### Onboarding Trigger
- **Seed Logic**: Create a new user and verify that 16 default categories are created automatically.
- **Uniqueness**: Verify that seeding twice for the same user doesn't create duplicates.

## Tools
- **Supabase CLI**: Running tests against a local instance.
- **pgTap**: For database-level unit testing.
