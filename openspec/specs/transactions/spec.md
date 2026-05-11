# Transactions Specification
> Source: `src/lib/actions/transactions.ts`, `supabase/migrations/005_create_transactions.sql`

## Purpose
Manages the lifecycle of financial transactions, including creation via DSL, installment grouping, and automatic categorization.

## Requirements

### Requirement: Transaction Creation
The system MUST support creating transactions from both structured input and DSL strings.

#### Scenario: Creation from DSL
- **GIVEN** a valid DSL string `100 grocery #home`
- **WHEN** the `createTransaction` action is called
- **THEN** the system SHALL find or create the category `grocery`
- **AND** find or create the tag `home`
- **AND** create a new transaction record linked to the authenticated user

#### Scenario: Installment Grouping
- **GIVEN** a DSL string for 3 installments `3 * 50 gym`
- **WHEN** the transaction is created
- **THEN** 3 transaction records SHALL be created
- **AND** all 3 records SHALL share the same `installment_group_id`
- **AND** the `transaction_date` of each record SHALL be incremented by 1 month relative to the previous one (if not on a credit card)

### Requirement: Transaction Deletion
The system SHALL handle individual and grouped transaction deletions.

#### Scenario: Deleting a Grouped Transaction
- **GIVEN** a transaction that is part of an installment group
- **WHEN** the transaction is deleted
- **THEN** ALL transactions sharing the same `installment_group_id` SHALL be deleted

### Requirement: Data Integrity
- **User Isolation**: All transaction operations MUST be scoped to the authenticated user using Row Level Security (RLS).
- **Category Requirement**: Every transaction MUST be linked to a valid category.

### Requirement: Transaction Reporting Support
Transactions SHALL provide the necessary data structures and query capabilities to support spending reports and visualizations.

#### Scenario: Aggregation for Reporting
- **GIVEN** a query for spending reports
- **WHEN** filtering by date and category
- **THEN** the transaction records SHALL be correctly aggregated by their category and timestamp to provide accurate reporting data.

## Technical Notes
- **Implementation**: `src/lib/actions/transactions.ts`
- **Database**: `transactions` table
- **Dependencies**: `categories`, `tags`, `credit-cards`
