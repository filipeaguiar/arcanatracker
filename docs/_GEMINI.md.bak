# Tracker — Personal Financial Control System Specification

This directory contains the comprehensive technical and product specifications for "Tracker", a personal financial control system designed for speed, flexibility, and low cognitive friction.

## 📂 Directory Overview

This is a **non-code project** consisting of documentation and specifications. It defines the blueprint for a multimodal financial application that uses a custom DSL (Domain Specific Language) for rapid transaction entry.

The project is structured around four pillars:
1. **Product & UX:** Philosophy of low friction and multimodal inputs.
2. **DSL Parser:** Formal grammar and logic for interpreting compact financial strings.
3. **System Design:** Architecture, data model (PostgreSQL/Supabase), and business rules (e.g., Brazilian credit card billing).
4. **API:** RESTful specification for system interactions.

## 🔑 Key Files

### 1. [Produto UX e Interfaces.md](./Produto%20UX%20e%20Interfaces.md)
Describes the **Product Philosophy** and **UX Principles**.
- **Core Goal:** Fast entry (seconds) with minimum effort.
- **Modes:** Rapid input (DSL), simple/advanced forms, and voice-to-text integration via LLM.
- **Principles:** Progressive Disclosure and Multi-Modal integration.

### 2. [sistema_de_controle_financeiro_pessoal_especificacao_tecnica_completa.md](./sistema_de_controle_financeiro_pessoal_especificacao_tecnica_completa.md)
The **Parser Specification (DSL)**.
- **EBNF Grammar:** Defines how strings like `10*190 tenis #gabriel` or `100/3 mercado` are parsed.
- **Semantics:** Detailed rules for installments (fixed value vs. division) and distribution of remainders (cents).
- **Currency:** Strictly uses integers (cents) to avoid floating-point errors.

### 3. [sistema_de_controle_financeiro_pessoal_especificacao_tecnica_completa(1).md](./sistema_de_controle_financeiro_pessoal_especificacao_tecnica_completa(1).md)
The **API Specification**.
- **Stack:** RESTful API with OpenAPI 3.0 principles.
- **Endpoints:** Documentation for `/transactions`, `/categories`, `/tags`, and `/summary`.
- **Standards:** Bearer JWT authentication, mandatory pagination, and standard error responses.

### 4. [System Design.md](./System%20Design.md)
The **Architecture and Backend** blueprint.
- **Tech Stack:** Next.js (Vercel), Supabase (Auth/PostgreSQL), and Server Actions.
- **Data Model:** Detailed SQL schema for transactions, categories, tags, credit cards, and invoices.
- **Business Logic:** Specific rules for credit card closing/due dates and automated installment generation.

## 🚀 Usage

These documents serve as the foundational context for the development of the Tracker application. 

- **For Implementation:** Use the `Parser Specification` to build the core interpretation engine and `System Design` for the database and backend logic.
- **For UI/UX:** Refer to `Produto UX e Interfaces` to ensure the "low friction" philosophy is maintained in the frontend.
- **For Integration:** Follow the `API Specification` to maintain consistency between the backend and various clients (Web, Mobile, Bots).

---
*Note: This is a specification-only workspace. Implementation should follow these documents as the primary source of truth.*
