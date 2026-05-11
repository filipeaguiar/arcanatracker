# DSL Specification
> Source: `src/lib/parser/`

## Purpose
Defines the grammar and semantics of the Tracker Domain Specific Language (DSL), designed for low-friction transaction entry.

## Requirements

### Requirement: Transaction Parsing
The system MUST parse a single line of text into a structured transaction object containing amount, category, description, tags, and installments.

#### Scenario: Single Transaction
- **GIVEN** an input string `50.50 lunch bakery #food`
- **WHEN** parsed
- **THEN** the amount SHALL be 5050 cents
- **AND** the category SHALL be `bakery`
- **AND** the description SHALL be `lunch`
- **AND** the tags SHALL contain `food`

#### Scenario: Fixed Installments (Fixed Value)
- **GIVEN** an input string `10 * 100 gym #health`
- **WHEN** parsed
- **THEN** it SHALL result in 10 installments of 10000 cents each
- **AND** the total amount SHALL be 10000 cents (per installment)
- **AND** the category SHALL be `gym`
- **AND** the tags SHALL contain `health`

#### Scenario: Division (Total Value / N)
- **GIVEN** an input string `100 / 3 pizza party`
- **WHEN** parsed
- **THEN** it SHALL result in 3 installments
- **AND** the amounts SHALL be distributed as `[3334, 3333, 3333]` (remainder to first installments)
- **AND** the category SHALL be `party`
- **AND** the description SHALL be `pizza`

### Requirement: Token Identification Rules
- **Category**: The system SHALL identify the last word token (tokens without `#` or operator prefix) as the category.
- **Description**: All word tokens before the category SHALL be joined to form the description.
- **Tags**: Tokens starting with `#` SHALL be treated as tags (case-insensitive).
- **Amount**: Numbers SHALL support both `.` and `,` as decimal separators and MUST be stored as integers in cents.

## Technical Notes
- **Implementation**: `src/lib/parser/parser.ts`, `src/lib/parser/lexer.ts`
- **Types**: `src/lib/parser/types.ts`
