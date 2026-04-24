-- Tracker: 005_create_transactions
-- Tabela principal de transações financeiras

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    amount_cents INTEGER NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    credit_card_id UUID REFERENCES credit_cards(id),
    invoice_id UUID REFERENCES invoices(id),
    installment_group_id UUID,
    installment_current INTEGER,
    installment_total INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_card ON transactions(credit_card_id);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_transactions_group ON transactions(installment_group_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
