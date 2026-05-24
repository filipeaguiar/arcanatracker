## Context

Currently, the logic for creating transactions is duplicated between the web dashboard (Server Actions) and the Telegram webhook (API Route). The Telegram implementation is a "manual" version that bypasses the robust logic found in the main `createTransaction` action. This has led to a bug where installment transactions created via Telegram have all their installments set to the same date (today), instead of being distributed across months or invoice due dates.

## Goals / Non-Goals

**Goals:**
- **Unify Implementation:** Extract the core transaction creation pipeline into a shared service that can be invoked by both the web app and the Telegram bot.
- **Fix Date Distribution:** Ensure that all installments created via any channel follow the correct date logic (incrementing months for direct payments, and matching invoice due dates for credit card payments).
- **Reduce Maintenance:** Eliminate code duplication in `src/app/api/telegram/webhook/route.ts`.

**Non-Goals:**
- Modifying the DSL parser grammar.
- Changing the database schema (no new migrations needed).

## Decisions

### 1. Unified Core Service: `src/lib/actions/transaction-core.ts`
We will create a new file to house the "core" transaction creation logic. This logic will be independent of the Supabase auth session retrieval, allowing it to be called with any valid `SupabaseClient` (authenticated or admin).

**Rationale:** Decoupling the business logic from the `next/server` specific utilities (like `revalidatePath` and auth session cookies) makes the system more testable and reusable.

### 2. Parameterized Client and User Context
The core function will accept:
- `supabase`: A `SupabaseClient` instance.
- `userId`: The ID of the user for whom the transaction is being created.
- `input`: The DSL string or structured input.

**Rationale:** This pattern allows the Telegram webhook to use its `supabaseAdmin` client while the web dashboard uses its authenticated client, both sharing the same implementation details.

### 3. Centralized Date Distribution Logic
The installment date calculation logic currently residing in `src/lib/actions/transactions.ts` (inside `insertTransactionRecords`) will be moved to the core service and improved.

**Logic for Installments:**
- **Credit Card:** The `transaction_date` for each installment will be set to the corresponding invoice's `due_date`.
- **Direct Payment:** The first installment uses the provided `transaction_date` (defaulting to today), and subsequent installments increment the month by 1 each.

## Risks / Trade-offs

- **[Risk] Regression in Dashboard Creation** → Mitigation: Use the existing web UI to verify that standard and installment transactions still work perfectly after the refactor.
- **[Risk] Side Effects (Cache Revalidation)** → Mitigation: Ensure `revalidatePath` is still called in the Server Action wrapper, but kept out of the core service to remain environment-agnostic.
- **[Risk] Telegram User ID Spoofing** → Mitigation: Ensure the Telegram webhook correctly identifies the `userId` via the secure `telegram_connections` table lookup using the unique `chatId`.
