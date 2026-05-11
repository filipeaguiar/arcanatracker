# Transactions API
> REST API specification for financial transactions.

## Base URL
`/api/v1`

## Endpoints

### `POST /transactions`
Create transaction(s) using the DSL parser.

**Request Body:**
```json
{
  "input": "string",
  "transaction_date": "YYYY-MM-DD" (optional)
}
```

**Response (201 Created):**
```json
{
  "data": {
    "created": number,
    "group_id": "uuid" (null if single)
  }
}
```

### `GET /transactions`
List transactions for the authenticated user.

**Query Parameters:**
- `from`: Start date (YYYY-MM-DD).
- `to`: End date (YYYY-MM-DD).
- `page`: Page number (default: 1).
- `limit`: Items per page (default: 20).
- `sort`: Sort field and direction (e.g., `transaction_date,desc`).

### `DELETE /transactions/{id}`
Remove a transaction. If it's part of a group, the entire group is deleted.

### `GET /summary`
Financial summary for the current user and period.

**Response:**
```json
{
  "data": {
    "total_income_cents": number,
    "total_expense_cents": number,
    "balance_cents": number
  }
}
```
