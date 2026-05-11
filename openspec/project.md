# Arcanatracker Project Context
> The "Constitution" of the Arcanatracker project.

## Core Philosophy
Arcanatracker is a personal financial control system designed for **speed**, **flexibility**, and **low cognitive friction**.

- **Speed**: Entry should take seconds, not minutes.
- **Flexibility**: Support for multimodal inputs (Web, Mobile, Telegram).
- **Low Friction**: Use of a custom DSL to avoid complex forms.

## Tech Stack
- **Framework**: Next.js 14+ (App Router, Server Actions)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Styling**: Vanilla CSS (modern features) / Radix UI / Lucide Icons
- **Language**: TypeScript (Strict Mode)

## Critical Conventions
1. **Monetary Values**: Always store and process as **integers in cents** (BRL). NEVER use floats for currency.
2. **Security**: Row Level Security (RLS) is non-negotiable. Every table MUST have isolation policies.
3. **Data Access**: Use Supabase Server Client in Server Actions and Components.
4. **Validation**: Use Zod for schema validation.
5. **DSL**: The DSL parser is the "source of truth" for multimodal input translation.

## Domain Model
- **Transactions**: The central entity, supports installments and grouping.
- **Credit Cards**: Specialized billing logic with closing and due days.
- **Categories/Tags**: Hierarchical and flat classification with auto-resolution.
- **Subscriptions**: Recurring income and expenses.
