-- Tracker: 004_create_invoices
-- Faturas de cartão de crédito

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    reference_month DATE NOT NULL,  -- primeiro dia do mês referência (ex: 2026-04-01)
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(credit_card_id, reference_month)
);

CREATE INDEX idx_invoices_card ON invoices(credit_card_id);
CREATE INDEX idx_invoices_status ON invoices(status);
