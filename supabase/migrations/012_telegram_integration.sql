-- Tracker: 012_telegram_integration
-- Gerencia o vínculo entre usuários do Tracker e chats do Telegram

CREATE TYPE telegram_connection_status AS ENUM ('awaiting_telegram', 'awaiting_approval', 'linked');

CREATE TABLE IF NOT EXISTS public.telegram_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_chat_id BIGINT UNIQUE,
    telegram_username TEXT,
    connection_token TEXT UNIQUE,
    status telegram_connection_status NOT NULL DEFAULT 'awaiting_telegram',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telegram connection" 
    ON public.telegram_connections FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own telegram connection" 
    ON public.telegram_connections FOR ALL 
    USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER handle_updated_at_telegram BEFORE UPDATE ON public.telegram_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
