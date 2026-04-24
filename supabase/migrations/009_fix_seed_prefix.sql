-- Tracker: 009_fix_seed_prefix
-- Corrige a função de seed adicionando o prefixo public. para evitar erro de search_path vazio

CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.categories (user_id, name, type) VALUES
        -- Despesas
        (p_user_id, 'alimentação', 'expense'),
        (p_user_id, 'transporte', 'expense'),
        (p_user_id, 'moradia', 'expense'),
        (p_user_id, 'saúde', 'expense'),
        (p_user_id, 'educação', 'expense'),
        (p_user_id, 'lazer', 'expense'),
        (p_user_id, 'compras', 'expense'),
        (p_user_id, 'vestuário', 'expense'),
        (p_user_id, 'assinaturas', 'expense'),
        (p_user_id, 'serviços', 'expense'),
        (p_user_id, 'pets', 'expense'),
        (p_user_id, 'outros', 'expense'),
        -- Receitas
        (p_user_id, 'salário', 'income'),
        (p_user_id, 'freelance', 'income'),
        (p_user_id, 'investimentos', 'income'),
        (p_user_id, 'outros receita', 'income')
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;
