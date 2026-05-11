# DSL Design
> Implementation details for the Tracker DSL.

## Context
The DSL is the primary input method for the application, designed to be parsed in real-time (frontend) and on the server.

## Decisions

### Decimal Normalization
- **Decision**: Normalize both `.` and `,` to a dot during tokenization.
- **Rationale**: Brazilian users commonly use commas for decimals, while developers/systems expect dots.

### Integer Monetary Math (Cents)
- **Decision**: Convert all amounts to integers (cents) immediately after parsing.
- **Rationale**: Avoids IEEE 754 floating-point precision issues in financial calculations (e.g., `0.1 + 0.2 !== 0.3`).

### Brazilian Remainder Distribution
- **Decision**: For value division (`/ N`), distribute the remainder (cents) to the first installments.
- **Rationale**: Follows standard Brazilian financial practices where the first installments are slightly higher if the division isn't exact.

## Technical Architecture

### Tokenization (Lexer)
The lexer uses regex-based loops to identify:
- `TAG`: `#` followed by alphanumeric.
- `NUMBER`: Digits with optional decimal part.
- `OPERATOR`: `*` or `/`.
- `WORD`: General text (including accents).

### Parsing Logic
1. **Installment Extraction**: Scans tokens for `NUMBER OP NUMBER` patterns.
2. **Category Assignment**: Always picks the **last** word token as the category.
3. **Description Assembly**: Joins all word tokens preceding the category.

## Components
- `src/lib/parser/lexer.ts`: Token generation.
- `src/lib/parser/parser.ts`: Main logic and installment calculation.
- `src/lib/parser/types.ts`: TypeScript interfaces for parser results.
