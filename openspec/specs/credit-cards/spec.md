# Credit Cards Specification
> Source: `src/lib/utils/invoice.ts`, `supabase/migrations/003_create_credit_cards.sql`, `004_create_invoices.sql`

## Purpose
Handles Brazilian credit card billing logic, including invoice (fatura) generation and installment distribution across billing cycles.

## Requirements

### Requirement: Invoice Assignment Logic
The system MUST assign credit card transactions to the correct invoice based on the card's `closing_day`.

#### Scenario: Purchase Before Closing
- **GIVEN** a credit card with `closing_day: 5` and `due_day: 15`
- **WHEN** a transaction is made on `2026-04-03`
- **THEN** it SHALL be assigned to the `2026-04` invoice
- **AND** the `due_date` SHALL be `2026-04-15`

#### Scenario: Purchase After Closing
- **GIVEN** a credit card with `closing_day: 5` and `due_day: 15`
- **WHEN** a transaction is made on `2026-04-06`
- **THEN** it SHALL be assigned to the next month's invoice (`2026-05`)
- **AND** the `due_date` SHALL be `2026-05-15`

### Requirement: Installment Distribution
Installments on a credit card SHALL be distributed across consecutive monthly invoices.

#### Scenario: Credit Card Installments
- **GIVEN** a 3-installment purchase on `2026-04-01`
- **WHEN** using a card with `closing_day: 5`
- **THEN** installment 1 SHALL be in the `2026-04` invoice
- **AND** installment 2 SHALL be in the `2026-05` invoice
- **AND** installment 3 SHALL be in the `2026-06` invoice
- **AND** each installment's `transaction_date` SHALL be updated to the respective invoice's `due_date`

### Requirement: Invoice Lifecycle
- **Automatic Creation**: The system SHALL automatically create a new invoice record if one does not exist for the calculated reference month.
- **Due Date Calculation**: If the `due_day` is less than or equal to the `closing_day`, the `due_date` MUST be in the month following the reference month.

## Technical Notes
- **Implementation**: `src/lib/utils/invoice.ts`
- **Entities**: `credit_cards`, `invoices`
- **Business Rule**: "Melhor dia de compra" is the day after the `closing_day`.
