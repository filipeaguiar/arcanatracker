-- Tracker: 008_seed_categories
-- Função para criar categorias default para um novo usuário
-- Pode ser chamada via trigger ou manualmente após signup

CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
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

-- Trigger: criar categorias automaticamente ao criar novo usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM public.seed_default_categories(NEW.id);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
