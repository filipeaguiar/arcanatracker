📘 Documento 1 — System Design (Arquitetura e Backend)

1\. Visão Geral



Aplicação SaaS de controle financeiro pessoal com:



multiusuário (isolamento total por usuário)

suporte a múltiplos cartões de crédito

entrada via DSL (parser)

precisão monetária baseada em centavos

2\. Arquitetura

Stack

Frontend: Next.js (Vercel)

Backend: API Routes / Server Actions

Banco: Supabase (PostgreSQL)

Auth: Supabase Auth (JWT)

Storage: Relacional

3\. Princípios Arquiteturais

Separação clara entre:

input (UI / LLM / bot)

parser (DSL)

domínio (regras financeiras)

Parser é determinístico

Backend é stateless

Todas operações são idempotentes quando possível

4\. Modelo de Dados

4.1 Convenções

Todos registros possuem user\_id

Valores monetários são armazenados em centavos (amount\_cents)

Datas em formato ISO (YYYY-MM-DD)

4.2 Tabela: transactions

CREATE TABLE transactions (

&#x20;   id UUID PRIMARY KEY,

&#x20;   user\_id UUID NOT NULL,



&#x20;   transaction\_date DATE NOT NULL,



&#x20;   amount\_cents INTEGER NOT NULL,

&#x20;   description TEXT NOT NULL,



&#x20;   category\_id UUID NOT NULL,



&#x20;   credit\_card\_id UUID,

&#x20;   invoice\_id UUID,



&#x20;   installment\_group\_id UUID,

&#x20;   installment\_current INTEGER,

&#x20;   installment\_total INTEGER,



&#x20;   created\_at TIMESTAMP NOT NULL DEFAULT now()

);

4.3 Tabela: categories

CREATE TABLE categories (

&#x20;   id UUID PRIMARY KEY,

&#x20;   user\_id UUID NOT NULL,

&#x20;   name TEXT NOT NULL,

&#x20;   type TEXT CHECK (type IN ('income', 'expense')) NOT NULL

);

4.4 Tabela: tags

CREATE TABLE tags (

&#x20;   id UUID PRIMARY KEY,

&#x20;   user\_id UUID NOT NULL,

&#x20;   name TEXT NOT NULL

);

4.5 Tabela: transaction\_tags

CREATE TABLE transaction\_tags (

&#x20;   transaction\_id UUID,

&#x20;   tag\_id UUID

);

4.6 Tabela: credit\_cards

CREATE TABLE credit\_cards (

&#x20;   id UUID PRIMARY KEY,

&#x20;   user\_id UUID NOT NULL,



&#x20;   name TEXT NOT NULL,



&#x20;   closing\_day INTEGER NOT NULL, -- dia de fechamento (1–31)

&#x20;   due\_day INTEGER NOT NULL,     -- dia de vencimento (1–31)



&#x20;   is\_default BOOLEAN DEFAULT FALSE

);

4.7 Tabela: invoices (opcional, pode ser virtual)

CREATE TABLE invoices (

&#x20;   id UUID PRIMARY KEY,

&#x20;   credit\_card\_id UUID NOT NULL,



&#x20;   closing\_date DATE NOT NULL,

&#x20;   due\_date DATE NOT NULL,



&#x20;   status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open'

);

5\. Regras de Negócio

5.1 Associação de Cartão

Se usuário possui 1 cartão → usar automaticamente

Se possui vários:

usar is\_default

fallback: exigir seleção

5.2 Regra de Fatura (Brasil)



Dado:



closing\_day

due\_day

Regra:



Se:



transaction\_date ≤ closing\_day



→ entra na fatura atual



Se:



transaction\_date > closing\_day



→ entra na próxima fatura



5.3 Cálculo de Datas de Fatura



Para uma transação:



Determinar mês base

Aplicar regra de fechamento

Gerar:

closing\_date

due\_date

6\. Parcelamento

6.1 Estrutura

Todas parcelas compartilham:

installment\_group\_id

6.2 Geração



Para N parcelas:



criar N transações

cada uma com:

installment\_current

installment\_total

6.3 Datas



Para cada parcela:



transaction\_date + (n - 1) meses



Depois:



aplicar regra de fatura individualmente

7\. Integração com Parser

Entrada

{

&#x20; "input": "10\*190 tenis compras #gabriel",

&#x20; "transaction\_date": "2026-04-24"

}

Fluxo

Parser gera estrutura

Backend:

resolve categoria

resolve tags

resolve cartão

calcula fatura

Persistência no banco

8\. Segurança

8.1 Row Level Security (RLS)



No Supabase:



user\_id = auth.uid()

8.2 Regras

usuário só acessa próprios dados

validação de ownership em todas queries

9\. Performance

índices em:

user\_id

transaction\_date

credit\_card\_id

paginação obrigatória em listagens grandes

10\. Extensibilidade



Suporte futuro para:



múltiplos cartões

contas bancárias

importação de extratos

reconciliação automática

11\. Decisões Importantes

✔ Uso de centavos



Evita erros de precisão



✔ Parser como núcleo



Permite múltiplas interfaces



✔ Cartão como camada de domínio



Não acoplado ao parser



✔ Fatura calculada automaticamente



Sem input manual do usuário



Conclusão



O sistema é projetado para:



simplicidade no uso

robustez financeira

escalabilidade arquitetural



Com separação clara entre:



entrada (UI / voz / bot)

interpretação (parser)

execução (backend + banco)

