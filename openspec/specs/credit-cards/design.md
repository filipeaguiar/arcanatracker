# Credit Cards Design
> Implementation of credit card billing and invoice logic.

## Context
Brazilian credit cards have complex billing cycles with separate closing and due dates. This design ensures transactions are correctly bucketed into monthly invoices.

## Decisions

### Reference Month as First of Month
- **Decision**: Store `reference_month` as the first day of the month (e.g., `2026-04-01`).
- **Rationale**: Provides a consistent unique key for the `(credit_card_id, reference_month)` constraint while simplifying date math.

### Future Date Projection
- **Decision**: For installments, set the `transaction_date` to the invoice `due_date`.
- **Rationale**: Correctly reflects when the money will actually leave the user's account (accrual vs. cash basis balance).

### "Melhor Dia" (Best Day) Logic
- **Decision**: Use `txDay > closingDay` to push transactions to the next invoice.
- **Rationale**: Implements the "Best Day" rule where a purchase made immediately after closing only appears in the invoice following the current one (giving ~40 days to pay).

## Data Structures

### `credit_cards` Entity
- `closing_day`: (1-31) The day the invoice "locks".
- `due_day`: (1-31) The day payment is due.

### `InvoiceDates` Utility Output
- `referenceMonth`: Key for the invoice.
- `closingDate`: Calculated date when billing ends.
- `dueDate`: Calculated date when payment is due (can be in the same or next month).

## Algorithms

### Invoice Assignment
```typescript
if (txDay <= closingDay) {
  invoiceMonth = currentMonth;
} else {
  invoiceMonth = currentMonth + 1;
}
```

## Components
- `src/lib/utils/invoice.ts`: Core date calculation logic.
- `supabase/migrations/003_create_credit_cards.sql`: Table definitions.
- `supabase/migrations/004_create_invoices.sql`: Invoice tracking.
