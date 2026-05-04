"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export type TelegramConnectionStatus = 'awaiting_telegram' | 'awaiting_approval' | 'linked';

export interface TelegramConnection {
  id: string;
  status: TelegramConnectionStatus;
  telegram_username: string | null;
  connection_token: string | null;
}

const BOT_USERNAME = "arcanatrackerbot";

/**
 * Inicia o processo de conexão gerando um token e retornando o link do Telegram.
 */
export async function getOrCreateTelegramLink(): Promise<{ url: string; connection: TelegramConnection }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Verifica se já existe uma conexão
  const { data: existing } = await supabase
    .from("telegram_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existing && existing.status === 'linked') {
    return {
      url: `https://t.me/${BOT_USERNAME}`,
      connection: existing
    };
  }

  // Gera um token aleatório curto (6 chars)
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();

  let connection;
  if (existing) {
    const { data: updated } = await supabase
      .from("telegram_connections")
      .update({ 
        connection_token: token, 
        status: 'awaiting_telegram',
        telegram_chat_id: null,
        telegram_username: null
      })
      .eq("user_id", user.id)
      .select()
      .single();
    connection = updated;
  } else {
    const { data: inserted } = await supabase
      .from("telegram_connections")
      .insert({
        user_id: user.id,
        connection_token: token,
        status: 'awaiting_telegram'
      })
      .select()
      .single();
    connection = inserted;
  }

  revalidatePath("/dashboard/settings");
  
  return {
    url: `https://t.me/${BOT_USERNAME}?start=${token}`,
    connection: connection as TelegramConnection
  };
}

/**
 * Aprova uma conexão que está aguardando aprovação do usuário.
 */
export async function approveTelegramConnection(connectionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("telegram_connections")
    .update({ 
      status: 'linked',
      connection_token: null // Token não é mais necessário
    })
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .eq("status", 'awaiting_approval');

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
}

/**
 * Remove o vínculo com o Telegram.
 */
export async function disconnectTelegram(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("telegram_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
}
