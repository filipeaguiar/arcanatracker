## ADDED Requirements

### Requirement: Transaction Entry via Bot
The Telegram bot SHALL support transaction entry using the standard DSL grammar, utilizing the unified transaction creation system.

#### Scenario: Submitting a DSL string
- **GIVEN** a linked Telegram user
- **WHEN** the user sends a valid DSL string to the bot
- **THEN** the system SHALL process the transaction using the unified `createTransactionCore` logic
- **AND** the resulting installments MUST have their dates correctly distributed according to the unified system rules (monthly increments or invoice due dates)
- **AND** the bot SHALL respond with a confirmation message including the total amount and category
