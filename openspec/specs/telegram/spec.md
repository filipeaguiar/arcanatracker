# Telegram Specification
> Source: `src/lib/actions/telegram.ts`, `supabase/migrations/012_telegram_integration.sql`

## Purpose
Enables multimodal transaction entry by linking a user's Tracker account to a Telegram bot.

## Requirements

### Requirement: Account Linking Flow
The system MUST provide a secure, multi-step process for linking a user to a Telegram chat.

#### Scenario: Generating Connection Link
- **GIVEN** an authenticated user without a Telegram link
- **WHEN** the `getOrCreateTelegramLink` action is called
- **THEN** the system SHALL generate a short 6-character random token
- **AND** create a `telegram_connections` record with status `awaiting_telegram`
- **AND** return a URL in the format `https://t.me/arcanatrackerbot?start=TOKEN`

#### Scenario: Approving Connection
- **GIVEN** a connection in `awaiting_approval` status (after user interacts with the bot)
- **WHEN** the user clicks "Approve" in the dashboard
- **THEN** the status SHALL change to `linked`
- **AND** the `connection_token` SHALL be cleared

### Requirement: Connection States
- **awaiting_telegram**: Token generated, waiting for user to start the bot.
- **awaiting_approval**: User started the bot, waiting for web dashboard confirmation.
- **linked**: Connection active, bot can receive and parse DSL commands.

### Requirement: Security
- **Isolation**: Each Telegram chat ID MUST be uniquely linked to a single Tracker user.
- **User Control**: Users MUST be able to disconnect their Telegram account at any time, which SHALL delete the connection record.

## Technical Notes
- **Implementation**: `src/lib/actions/telegram.ts`
- **Database**: `telegram_connections` table
- **Bot Username**: `arcanatrackerbot`
