## Why

Telegram installment purchases currently set all installments to the same date (today), which is incorrect for both credit card and direct payment installments. Additionally, the transaction creation logic is duplicated between the web application and the Telegram webhook, leading to maintenance overhead and potential inconsistencies.

## What Changes

- **FIX**: Correct the date distribution for installment purchases via Telegram. For credit cards, installments should align with invoice due dates. For direct payments, dates should increment by month.
- **REFACTOR**: Unify transaction creation logic by extracting the core business logic (category resolution, tag resolution, credit card/invoice calculation, and DB insertion) into a shared service.
- **CLEANUP**: Remove duplicated logic from the Telegram webhook and ensure it uses the robust shared implementation.

## Capabilities

### Modified Capabilities
- `transactions`: Update requirements to explicitly state that the core creation logic must be shared and support both user session and service/admin contexts.
- `telegram`: Update requirements to specify that transaction creation must use the unified system logic rather than internal manual implementation.

## Impact

- `src/lib/actions/transactions.ts`: Will be refactored to use the new shared logic.
- `src/app/api/telegram/webhook/route.ts`: Will be simplified to call the shared logic.
- New `src/lib/actions/transaction-core.ts` (or similar): Will hold the unified logic that works with both authenticated and admin clients.
