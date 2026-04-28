-- Tracker: 011_cascade_credit_cards
-- Adiciona deleção em cascata para transações quando o cartão ou fatura for removido

-- Remover as restrições antigas (nomes padrão do Postgres/Supabase)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_credit_card_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_invoice_id_fkey;

-- Adicionar novas restrições com ON DELETE CASCADE
ALTER TABLE transactions
ADD CONSTRAINT transactions_credit_card_id_fkey
FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE CASCADE;

ALTER TABLE transactions
ADD CONSTRAINT transactions_invoice_id_fkey
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
