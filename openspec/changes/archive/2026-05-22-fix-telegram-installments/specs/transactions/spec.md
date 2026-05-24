## MODIFIED Requirements

### Requirement: Transaction Creation
The system MUST support creating transactions from both structured input and DSL strings. This creation logic MUST be encapsulated in a unified core service that supports both browser-based (authenticated) and service-based (admin) contexts.

#### Scenario: Creation from DSL
- **GIVEN** a valid DSL string `100 grocery #home`
- **WHEN** the `createTransaction` action or core service is called
- **THEN** the system SHALL find or create the category `grocery`
- **AND** find or create the tag `home`
- **AND** create a new transaction record linked to the target user

#### Scenario: Installment Grouping
- **GIVEN** a DSL string for 3 installments `3 * 50 gym`
- **WHEN** the transaction is created via the unified core logic
- **THEN** 3 transaction records SHALL be created sharing the same `installment_group_id`
- **AND** if NO credit card is used, the `transaction_date` SHALL increment by 1 month for each subsequent installment
- **AND** if a credit card IS used, the `transaction_date` for each installment SHALL match the corresponding invoice `due_date`

## ADDED Requirements

### Requirement: Transaction Core Service
The system SHALL provide a `createTransactionCore` function that accepts a `SupabaseClient` instance and a `userId` to allow for environment-agnostic transaction creation.

#### Scenario: Admin-initiated Creation
- **GIVEN** a Supabase Admin client and a valid `userId`
- **WHEN** `createTransactionCore` is called from a backend context (e.g., Telegram Webhook)
- **THEN** the system SHALL create the transactions for that user without requiring a browser session
