# Telegram Tests
> Testing strategy for the Telegram bot integration.

## Strategy
Testing the connection lifecycle (token generation/approval) and bot command parsing.

## Test Cases

### Lifecycle Tests
- **Token Uniqueness**: Ensure generated tokens are unique and random.
- **Status Transitions**: Verify flow from `awaiting_telegram` → `awaiting_approval` → `linked`.
- **Security**: Attempt to approve a connection using a different user account (must fail).

### Bot Commands
- **Start Command**: Test `/start TOKEN` updates the chat ID and status.
- **DSL via Telegram**: Simulate sending a DSL string and verify a transaction is created in the database.

## Tools
- **Vitest**: For Server Action logic.
- **Telegram Mock/Test Bot**: For end-to-end flow verification.
