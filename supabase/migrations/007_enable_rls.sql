-- Tracker: 007_enable_rls
-- Habilitar Row Level Security em todas as tabelas
-- Regra: user_id = auth.uid() para isolamento total

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
    ON categories FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own categories"
    ON categories FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
    ON categories FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
    ON categories FOR DELETE
    USING (user_id = auth.uid());

-- Tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
    ON tags FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own tags"
    ON tags FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tags"
    ON tags FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tags"
    ON tags FOR DELETE
    USING (user_id = auth.uid());

-- Credit Cards
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit cards"
    ON credit_cards FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own credit cards"
    ON credit_cards FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own credit cards"
    ON credit_cards FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own credit cards"
    ON credit_cards FOR DELETE
    USING (user_id = auth.uid());

-- Invoices (via credit card ownership)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
    ON invoices FOR SELECT
    USING (
        credit_card_id IN (
            SELECT id FROM credit_cards WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own invoices"
    ON invoices FOR INSERT
    WITH CHECK (
        credit_card_id IN (
            SELECT id FROM credit_cards WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own invoices"
    ON invoices FOR UPDATE
    USING (
        credit_card_id IN (
            SELECT id FROM credit_cards WHERE user_id = auth.uid()
        )
    );

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions"
    ON transactions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    USING (user_id = auth.uid());

-- Transaction Tags (via transaction ownership)
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction tags"
    ON transaction_tags FOR SELECT
    USING (
        transaction_id IN (
            SELECT id FROM transactions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own transaction tags"
    ON transaction_tags FOR INSERT
    WITH CHECK (
        transaction_id IN (
            SELECT id FROM transactions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own transaction tags"
    ON transaction_tags FOR DELETE
    USING (
        transaction_id IN (
            SELECT id FROM transactions WHERE user_id = auth.uid()
        )
    );
