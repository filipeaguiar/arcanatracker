📗 Documento 2 — Produto, UX e Interfaces

1\. Filosofia de Produto



Sistema orientado a:



rapidez de entrada

flexibilidade de interação

baixo atrito cognitivo



O usuário deve conseguir registrar uma transação:



em poucos segundos, com o mínimo de esforço possível



2\. Princípios de UX

2.1 Progressive Disclosure

Usuário começa simples

Complexidade aparece sob demanda



✔ evita sobrecarga cognitiva

✔ melhora retenção



2.2 Multi-Modal Input (correto, não “fake”)



O sistema deve ser multimodal de verdade, não só “ter voz”:



texto

formulário

voz

futuro: chat/bot



👉 Importante:



múltiplos inputs devem funcionar de forma integrada e contínua, não como fluxos separados



2.3 Normalização



Toda entrada → vira:



string do parser



✔ garante consistência

✔ reduz complexidade no backend



3\. Modos de Entrada

3.1 Input Rápido (Primary UX)



Campo único:



10\*190 tenis compras #gabriel



📌 Justificativa:



campos únicos reduzem fricção em mobile

ideal para usuários frequentes

3.2 Formulário Simples



Campos:



valor

categoria

descrição (opcional)



Regras:



data = hoje (default)

sistema gera string automaticamente



Exemplo interno:



50 mercado compras

3.3 Formulário Avançado



Campos:



valor

categoria

descrição

tags

data

parcelamento:

N \* valor

valor / N



📌 UX:



usar multi-step apenas se necessário (muitos campos)

agrupar campos relacionados

3.4 Entrada por Voz

Fluxo

voz → transcrição → LLM → parser → API

Exemplo



Entrada:



“comprei um tênis de 190 em 10 vezes pro Gabriel”



Saída:



10\*190 tenis compras #gabriel

4\. UX de Voz (Regras)

mostrar transcrição em tempo real

permitir correção manual

fornecer feedback claro

fallback para texto sempre



📌 Observação:



voz pode ser até 3x mais rápida que digitação

5\. Integração com LLM

Papel do LLM

traduz linguagem natural → DSL

NÃO substitui parser

Pipeline

input → LLM → validação → parser

Regras

saída deve ser válida

não inventar categorias

erro explícito se ambíguo

6\. Multi-Canal



Canais suportados:



Web (principal)

Mobile (PWA)

Bot (Telegram, etc)

Voz

API externa



Todos convergem para:



POST /transactions

7\. Cartões de Crédito (UX)

Regra principal

1 cartão → automático

vários → usar default

UX ideal

usuário NÃO precisa escolher cartão toda vez

sistema resolve automaticamente

8\. Fluxo do Usuário

Entrada simples

Usuário digita → parser → API → banco

Entrada por voz

Usuário fala → transcrição → LLM → parser → API

Parcelamento

Entrada → parser → múltiplas transações → cálculo de fatura

9\. Benefícios

atende iniciantes e avançados

reduz fricção de entrada

escalável (novos inputs)

consistente (parser central)

10\. Evolução Futura

assistente conversacional completo

sugestão automática de categorias

aprendizado de hábitos

automação (integrações externas)

Conclusão



O sistema não é apenas um app de finanças.



Ele é:



uma plataforma de entrada financeira multimodal com DSL central



Com:



múltiplas interfaces

um núcleo determinístico

experiência consistente

