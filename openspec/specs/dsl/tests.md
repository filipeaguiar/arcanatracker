# DSL Tests
> Testing strategy and coverage for the Tracker DSL.

## Strategy
The DSL parser is the most critical part of the system and is covered by exhaustive unit tests using Vitest.

## Test Cases

### Lexer Tests
- **Whitespace**: Ensure multiple spaces are ignored.
- **Normalization**: Verify `,` is correctly converted to `.`.
- **Token Stream**: Validate the order and type of tokens for complex strings.

### Parser Tests
- **Simple Transactions**: Amounts, descriptions, and categories.
- **Fixed Installments**: `N * Valor` pattern validation.
- **Division**: `Total / N` pattern and remainder distribution (Brazilian logic).
- **Edge Cases**:
  - Division by zero.
  - Negative numbers.
  - Empty strings or only whitespace.
  - Special characters in categories.

## Test Execution
Tests are located in `__tests__/parser/parser.test.ts`.
Run them using:
```bash
npm test parser
```
