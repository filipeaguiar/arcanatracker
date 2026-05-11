# Credit Cards Tests
> Verification of billing cycle and installment logic.

## Strategy
Focus on unit tests for the date calculation utility and integration tests for invoice creation.

## Test Cases

### Utility Tests (`calculateInvoiceDates`)
- **Same Month**: Transaction on day 1 with closing on day 5.
- **Next Month**: Transaction on day 6 with closing on day 5.
- **Year Roll**: Transaction in December after closing day.
- **Leap Year**: Billing cycles involving February 29th.

### Integration Tests
- **Invoice Creation**: Verify that a new invoice is created on-the-fly when a transaction is assigned to a month that doesn't have one yet.
- **Cascading Delete**: Ensure deleting a credit card removes all linked transactions and invoices.

## Tools
- **Vitest**: Testing `src/lib/utils/invoice.ts`.
