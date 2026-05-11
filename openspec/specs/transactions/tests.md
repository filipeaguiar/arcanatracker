# Transactions Tests
> Verification strategy for transaction management.

## Strategy
Combination of E2E tests for the UI and integration tests for the Server Actions.

## Test Cases

### Integration Tests
- **DSL to DB**: Verify that "100 lunch food" creates a transaction with 10000 cents in the `food` category.
- **Tag Linking**: Ensure tags are correctly created and linked in the junction table.
- **Group Deletion**: Confirm that deleting one installment record removes all related records in the group.

### Business Rule Tests
- **Projected Dates**: Verify that non-credit card installments have dates incremented by exactly one month.
- **Category Resolution**: Test that existing categories are reused and new ones are created correctly.

## Tools
- **Vitest**: For Server Action logic.
- **Supabase Local**: For integration tests with a real DB.
