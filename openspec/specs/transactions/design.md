# Transactions Design
> Technical architecture of the transaction management system.

## Context
Transactions are handled via Next.js Server Actions, providing a direct link between the UI/multimodal inputs and Supabase.

## Decisions

### Server Actions for Business Logic
- **Decision**: Orchestrate parsing, category resolution, and DB insertion within Server Actions.
- **Rationale**: Ensures atomic operations and simplifies error handling on the client.

### N:N Tag Relationship
- **Decision**: Use a junction table `transaction_tags` to link transactions and tags.
- **Rationale**: Allows for flexible classification where one transaction can have multiple tags and vice-versa.

### Real-time Revalidation
- **Decision**: Use `revalidatePath` after every mutation.
- **Rationale**: Keeps the Dashboard and Transaction list updated without manual state management on the client.

## Data Model

### `transactions` Table
- Stores the core financial data.
- Includes `installment_group_id` (UUID) to link related installments.
- Uses `transaction_date` for both real and projected future dates.

### Creation Pipeline
1. `parse(input)`: Get structured data from DSL.
2. `findOrCreateCategory(name)`: Resolve category ID.
3. `findOrCreateTags(names)`: Resolve list of tag IDs.
4. `insertTransactionRecords()`: Handle bulk insertion for installments and link tags.

## Components
- `src/lib/actions/transactions.ts`: Main creation and deletion logic.
- `src/lib/actions/categories.ts`: Category resolution.
- `src/lib/actions/tags.ts`: Tag resolution.
