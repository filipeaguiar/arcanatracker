# Telegram Design
> Architecture of the Telegram multimodal integration.

## Context
Telegram integration allows users to send DSL commands via a bot. The design focuses on a secure "Deep Linking" connection mechanism.

## Decisions

### Short Hex Tokens
- **Decision**: Use 6-character uppercase hex tokens (`crypto.randomBytes(3)`) for linking.
- **Rationale**: Short enough for users to type if needed, but sufficiently random for security when combined with a short TTL (implicit in the update process).

### Manual Approval Step
- **Decision**: Require a manual "Approve" click in the Web UI after the bot is started.
- **Rationale**: Prevents session hijacking and ensures the user explicitly intended to link that specific Telegram account.

### Connection State Machine
- **Decision**: Use a formal `status` enum (`awaiting_telegram`, `awaiting_approval`, `linked`).
- **Rationale**: Provides clear feedback in the UI about where the user is in the onboarding process.

## Technical Architecture

### Linking Workflow
1. **Web**: User clicks "Connect", Server generates `connection_token`, Status = `awaiting_telegram`.
2. **Telegram**: User clicks deep link `/start TOKEN`. Bot verifies token and updates status to `awaiting_approval`, storing `telegram_chat_id`.
3. **Web**: User sees "Awaiting Approval" and clicks "Approve". Status = `linked`, `connection_token` is cleared.

## Data Model

### `telegram_connections` Table
- `user_id`: Reference to Tracker user.
- `telegram_chat_id`: Unique ID from Telegram.
- `connection_token`: Temporary secret for linking.
- `status`: Enum for the lifecycle state.

## Components
- `src/lib/actions/telegram.ts`: Server Actions for the web-side of the flow.
- `supabase/migrations/012_telegram_integration.sql`: Schema and types.
