# 📕 Documento 4 — API Specification (OpenAPI 3.0)

## 1. Visão Geral

API REST para controle financeiro baseada em parser DSL.

Princípios:
- RESTful
- Stateless
- Consistência de respostas
- Paginação obrigatória para coleções

---

## 2. Convenções

- Base URL: `/api/v1`
- Autenticação: Bearer JWT
- Formato: JSON

---

## 3. Padrão de Resposta

### Sucesso

```json
{
  "data": {},
  "meta": {}
}
```

### Erro

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

---

## 4. Paginação, Filtro e Ordenação

### Query params padrão

- `page` (default: 1)
- `limit` (default: 20)
- `sort` (ex: `transaction_date,desc`)

Justificativa:
- APIs devem usar paginação para evitar sobrecarga ([openapispec.com](https://openapispec.com/docs/best-practices-for-api-design/?utm_source=chatgpt.com))
- Query params são padrão para filtros e paginação ([openapispec.com](https://openapispec.com/docs/what/what-are-the-best-practices-for-using-openapi/?utm_source=chatgpt.com))

---

## 5. Endpoints

---

### 5.1 POST /transactions

Cria transações via parser

#### Request

```json
{
  "input": "10*190 tenis compras #gabriel",
  "transaction_date": "2026-04-24"
}
```

#### Response

```json
{
  "data": {
    "created": 10,
    "group_id": "uuid"
  }
}
```

---

### 5.2 GET /transactions

Lista transações

#### Query Params

- `from`
- `to`
- `page`
- `limit`
- `sort`

#### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "transaction_date": "2026-04-24",
      "amount_cents": 19000,
      "description": "tenis",
      "category": "compras"
    }
  ],
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

---

### 5.3 DELETE /transactions/{id}

Remove transação

---

### 5.4 GET /categories

Lista categorias

---

### 5.5 POST /categories

Cria categoria

---

### 5.6 GET /tags

Lista tags

---

### 5.7 POST /tags

Cria tag

---

### 5.8 GET /summary

Resumo financeiro

#### Response

```json
{
  "data": {
    "total_income_cents": 100000,
    "total_expense_cents": 50000,
    "balance_cents": 50000
  }
}
```

---

## 6. Segurança

- JWT obrigatório
- user_id derivado do token
- RLS no banco

---

## 7. Boas Práticas

- endpoints baseados em recursos (não verbos) ([openapispec.com](https://openapispec.com/docs/best-practices-for-api-design/?utm_source=chatgpt.com))
- uso correto de métodos HTTP ([openapispec.com](https://openapispec.com/docs/what/what-are-the-best-practices-for-using-openapi/?utm_source=chatgpt.com))
- consistência de naming
- versionamento (`/v1`)

---

## 8. Extensões Futuras

- suporte a cartões (`/credit-cards`)
- faturas (`/invoices`)
- webhook / integrações externas

---

## Conclusão

A API é projetada para ser:

- previsível
- escalável
- facilmente consumida por múltiplos clientes

Com separação clara entre parser, domínio e interface.

