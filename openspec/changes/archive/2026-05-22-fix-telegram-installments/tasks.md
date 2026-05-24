## 1. Unified Core Implementation

- [x] 1.1 Create `src/lib/actions/transaction-core.ts` to house the environment-agnostic transaction logic.
- [x] 1.2 Implement `createTransactionCore` accepting a `SupabaseClient` and `userId`.
- [x] 1.3 Move the category and tag resolution logic from `db-helpers.ts` and `transactions.ts` into the core service or ensure it's properly shared.
- [x] 1.4 Implement the corrected installment date distribution: monthly increments for direct payments, and matching invoice due dates for credit card payments.

## 2. Refactor Dashboard Actions

- [x] 2.1 Update `src/lib/actions/transactions.ts` to delegate to `createTransactionCore`.
- [x] 2.2 Ensure Server Action specific logic like `revalidatePath` is maintained in the wrapper functions.
- [x] 2.3 Verify that structured transaction creation still works as expected.

## 3. Telegram Webhook Refactor

- [x] 3.1 Update `src/app/api/telegram/webhook/route.ts` to use the new `createTransactionCore`.
- [x] 3.2 Remove the large block of manual database insertion and invoice calculation logic from the webhook.
- [x] 3.3 Ensure the webhook correctly uses the `supabaseAdmin` client and the user context from the connection lookup.

## 4. Verification

- [x] 4.1 Run `vitest` to ensure parser and utility logic remains intact.
- [x] 4.2 Verify correct date distribution for a 3-installment purchase via the refactored code (test case or manual check).
- [x] 4.3 Run `npm run lint` to ensure code style consistency.
