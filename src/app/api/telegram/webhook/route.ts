import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parse } from "@/lib/parser";
import { findOrCreateCategory } from "@/lib/actions/categories";
import { findOrCreateTags } from "@/lib/actions/tags";
import { calculateInvoiceDates, calculateInstallmentInvoiceDates } from "@/lib/utils/invoice";
import { formatCurrency } from "@/lib/utils/currency";

// Nota: Usamos a Secret Key da Vercel
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY! 
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
}

export async function POST(req: Request) {
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

    // Resolve Categoria e Tags (bypass RLS via admin client)
    const category = await findOrCreateCategory(parsed.category);
    const tags = await findOrCreateTags(parsed.tags);
    
    const isInstallment = parsed.installment_type !== null;
    const today = new Date().toISOString().split('T')[0];

    // Para o Telegram, por simplicidade, vamos usar Débito se não for parcelado
    // e o cartão padrão se for parcelado.
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

    // Inserção direta
    const installmentCount = parsed.installments.length;
    const groupId = isInstallment ? crypto.randomUUID() : null;

    // Se tiver cartão, resolve fatura
    let invoiceIds: (string | null)[] = Array(installmentCount).fill(null);
    if (creditCardId) {
      const { data: card } = await supabaseAdmin.from('credit_cards').select('*').eq('id', creditCardId).single();
      if (card) {
        const datesList = isInstallment 
          ? calculateInstallmentInvoiceDates(today, installmentCount, card.closing_day, card.due_day)
          : [calculateInvoiceDates(today, card.closing_day, card.due_day)];
        
        invoiceIds = await Promise.all(datesList.map(async (d) => {
          const { data: inv } = await supabaseAdmin.from('invoices').select('id').eq('credit_card_id', card.id).eq('reference_month', d.referenceMonth).single();
          if (inv) return inv.id;
          const { data: newInv } = await supabaseAdmin.from('invoices').insert({
            credit_card_id: card.id,
            reference_month: d.referenceMonth,
            closing_date: d.closingDate,
            due_date: d.dueDate
          }).select('id').single();
          return newInv?.id || null;
        }));
      }
    }

    const rows = parsed.installments.map((cents, idx) => ({
      user_id: userId,
      transaction_date: today,
      amount_cents: Math.abs(cents),
      description: parsed.description || parsed.category,
      category_id: category.id,
      credit_card_id: creditCardId,
      invoice_id: invoiceIds[idx],
      installment_group_id: groupId,
      installment_current: isInstallment ? idx + 1 : null,
      installment_total: isInstallment ? installmentCount : null,
    }));

    const { data: inserted, error: insError } = await supabaseAdmin.from('transactions').insert(rows).select('id');

    if (insError) {
      await sendTelegramMessage(chatId, `❌ *Erro ao salvar:* ${insError.message}`);
      return NextResponse.json({ ok: true });
    }

    // Link Tags
    if (tags.length > 0 && inserted) {
      const tagLinks = inserted.flatMap(tx => tags.map(t => ({ transaction_id: tx.id, tag_id: t.id })));
      await supabaseAdmin.from('transaction_tags').insert(tagLinks);
    }

    const totalStr = formatCurrency(parsed.installments.reduce((a, b) => a + b, 0));
    await sendTelegramMessage(chatId, `✅ *Lançamento realizado!*\n\n💰 *Valor:* ${totalStr}\n📝 *Desc:* ${rows[0].description}\n📂 *Cat:* ${category.name}${isInstallment ? `\n💳 *Cartão:* Parcelado em ${installmentCount}x` : ''}`);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: true });
  }
}
