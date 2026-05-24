import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parse } from "@/lib/parser";
import { createTransactionCore } from "@/lib/actions/transaction-core";
import { formatCurrency } from "@/lib/utils/currency";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
}

export async function POST(req: Request) {
  // Nota: Inicializamos aqui para evitar erro no build (env vars ausentes)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY! 
  );

  try {
    const body = await req.json();
    const { message } = body;

    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.trim();

    // 1. Lógica de Conexão (/start <token>)
    if (text.startsWith('/start ')) {
      const token = text.split(' ')[1];
      
      const { data: connection, error } = await supabaseAdmin
        .from('telegram_connections')
        .update({ 
          telegram_chat_id: chatId,
          telegram_username: message.from.username || message.from.first_name,
          status: 'awaiting_approval'
        })
        .eq('connection_token', token)
        .select()
        .single();

      if (error || !connection) {
        await sendTelegramMessage(chatId, "❌ Código inválido ou expirado. Gere um novo link no aplicativo Tracker.");
      } else {
        await sendTelegramMessage(chatId, "⏳ *Código recebido!*\n\nAgora volte ao aplicativo Tracker e clique em *'Aprovar'* para finalizar o vínculo.");
      }
      return NextResponse.json({ ok: true });
    }

    // 2. Lógica de Transação (Mensagens normais)
    const { data: connection } = await supabaseAdmin
      .from('telegram_connections')
      .select('user_id, status')
      .eq('telegram_chat_id', chatId)
      .single();

    if (!connection || connection.status !== 'linked') {
      await sendTelegramMessage(chatId, "⚠️ Sua conta ainda não está vinculada ou aguarda aprovação. Use o link de conexão no aplicativo Tracker.");
      return NextResponse.json({ ok: true });
    }

    // Processa a mensagem como DSL
    const parseResult = parse(text);
    if (!parseResult.success) {
      await sendTelegramMessage(
        chatId, 
        `❌ *Não entendi o que você quis dizer.*\n\n` +
        `Tente o formato: \`valor descrição #tag\`\n\n` +
        `Exemplos:\n` +
        `• \`150 mercado #casa\`\n` +
        `• \`300/3 netflix\``
      );
      return NextResponse.json({ ok: true });
    }

    const parsed = parseResult.data;
    const userId = connection.user_id;
    const today = new Date().toISOString().split('T')[0];
    
    const isInstallment = parsed.installment_type !== null;

    // Resolve Cartão Padrão para parcelados
    let creditCardId = null;
    if (isInstallment) {
      const { data: defaultCard } = await supabaseAdmin
        .from('credit_cards')
        .select('id')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();
      
      creditCardId = defaultCard?.id || null;
    }

    // Chama o core unificado
    const result = await createTransactionCore(supabaseAdmin, userId, {
      transactionDate: today,
      amountCentsList: parsed.installments,
      description: parsed.description || parsed.category,
      categoryName: parsed.category,
      tagNames: parsed.tags,
      creditCardId,
    });

    if (!result.success) {
      await sendTelegramMessage(chatId, `❌ *Erro ao salvar:* ${result.error}`);
      return NextResponse.json({ ok: true });
    }

    const totalStr = formatCurrency(parsed.installments.reduce((a, b) => a + b, 0));
    await sendTelegramMessage(chatId, `✅ *Lançamento realizado!*\n\n💰 *Valor:* ${totalStr}\n📝 *Desc:* ${parsed.description || parsed.category}\n📂 *Cat:* ${parsed.category}${isInstallment ? `\n💳 *Cartão:* Parcelado em ${parsed.installments.length}x` : ''}`);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: true });
  }
}
