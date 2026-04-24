# 📙 Documento 3 — Parser Specification (DSL Financeira)

## 1. Visão Geral

Este documento define formalmente a linguagem de entrada (DSL) utilizada pelo sistema para registrar transações financeiras de forma compacta e determinística.

O parser é a **fonte de verdade** para interpretação de entradas, independente do canal (web, voz, bot, API).

---

## 2. Objetivos

- Interpretar strings em linguagem compacta
- Produzir saída determinística
- Garantir precisão monetária (centavos)
- Suportar parcelamento e divisão

---

## 3. Gramática (EBNF)

```ebnf
entry        = [installment] content ;
installment  = (number "*" number) | (number "/" number) ;
content      = { token } ;
token        = tag | word ;
tag          = "#" word ;
word         = letter { letter | digit } ;
number       = digit { digit } ["." digit { digit }] ;
```

---

## 4. Semântica

### 4.1 Parcelas fixas (N*valor)

- Gera N transações
- Cada parcela possui o mesmo valor
- Valor convertido para centavos

Exemplo:
```
10*190
```
→ 10 transações de 19000 centavos

---

### 4.2 Divisão de valor (valor/N)

- Divide o valor total em N partes
- Conversão para centavos antes da divisão
- Distribuição de resto nas primeiras parcelas

Exemplo:
```
100/3
```
→ 33.34, 33.33, 33.33

---

## 5. Conversão Monetária

- Entrada pode ser decimal (ex: 10.50)
- Internamente convertido para inteiro (centavos)

Exemplo:
- 10.50 → 1050

Regras:
- não utilizar float
- utilizar inteiros ou decimal preciso

---

## 6. Regras de Parsing

Ordem lógica:

1. Detectar bloco de parcelamento (se existir)
2. Extrair tags (`#tag`)
3. Identificar categoria (última palavra válida)
4. Construir descrição com os tokens restantes

Parser deve ser:
- determinístico
- independente da ordem dos tokens

---

## 7. Algoritmo de Divisão (valor/N)

### Entrada
- valor_total_cents
- número de parcelas (N)

### Processo
```
base = valor_total_cents // N
resto = valor_total_cents % N
```

### Saída
- As parcelas são ordenadas sequencialmente (1 → N)
- As **primeiras `resto` parcelas recebem `base + 1`**
- As demais parcelas recebem `base`

### Regra de Negócio (Padrão Brasil)

- O sistema **DEVE distribuir o resto nas primeiras parcelas**
- Isso reflete o comportamento mais comum de emissores de cartão no Brasil
- Garante previsibilidade e evita última parcela com valor inesperado

### Exemplo

Entrada:
```
100/3
```

Cálculo:
- base = 3333
- resto = 1

Saída:
```
Parcela 1 → 3334
Parcela 2 → 3333
Parcela 3 → 3333
```

---

## 8. Estrutura de Saída

```json
{
  "amount_cents": 19000,
  "installment_total": 10,
  "description": "tenis nike",
  "category": "compras",
  "tags": ["gabriel"]
}
```

---

## 9. Casos de Erro

| Caso | Ação |
|------|------|
| valor inválido | erro |
| divisão por zero | erro |
| parcelamento inválido | erro |
| categoria inexistente | erro ou fallback |
| descrição vazia | erro |

---

## 10. Testes (Contrato Comportamental)

### Teste 1 — Entrada simples
```
50 mercado compras
```
→ amount_cents: 5000

---

### Teste 2 — Parcelamento fixo
```
10*190 tenis compras
```
→ 10 transações de 19000

---

### Teste 3 — Divisão simples
```
100/3 mercado compras
```
→ 3334, 3333, 3333

---

### Teste 4 — Divisão com centavos
```
100.01/3 mercado compras
```
→ 3334, 3334, 3333

---

### Teste 5 — Ordem livre + tags
```
#gabriel compras 10*190 tenis
```
→ parsing correto independente da ordem

---

## 11. Requisitos de Implementação

- determinístico
- idempotente
- independente de contexto externo
- testável com base nos casos acima

---

## 12. Versionamento

A DSL deve ser versionável:

- v1 (atual)
- futuras versões podem expandir gramática sem quebrar compatibilidade

---

## Conclusão

O parser define uma linguagem de domínio específica (DSL) que garante consistência, precisão e extensibilidade para o sistema financeiro.

