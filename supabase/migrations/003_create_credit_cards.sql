-- Tracker: 003_create_credit_cards
-- Cartões de crédito com dia de fechamento e vencimento

CREATE TABLE credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_credit_cards_user ON credit_cards(user_id);

-- Garantir que apenas 1 cartão pode ser default por usuário
CREATE UNIQUE INDEX idx_credit_cards_default
    ON credit_cards(user_id) WHERE is_default = TRUE;
