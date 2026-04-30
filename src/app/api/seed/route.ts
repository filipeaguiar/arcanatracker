import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Você precisa estar logado para seedar dados." }, { status: 401 });
  }

  const USER_ID = user.id;
  console.log('Seeding iniciado para o usuário:', USER_ID);
    // 1. Garantir categorias
    const defaultCategories = [
      { name: 'alimentação', type: 'expense' },
      { name: 'transporte', type: 'expense' },
      { name: 'moradia', type: 'expense' },
      { name: 'saúde', type: 'expense' },
      { name: 'lazer', type: 'expense' },
      { name: 'compras', type: 'expense' },
      { name: 'assinaturas', type: 'expense' },
      { name: 'salário', type: 'income' },
      { name: 'investimentos', type: 'income' }
    ];

    const { data: catData, error: catError } = await supabase
      .from('categories')
      .upsert(defaultCategories.map(c => ({ ...c, user_id: USER_ID })), { onConflict: 'user_id, name' })
      .select();

    if (catError) {
      console.error('Erro ao criar categorias:', catError);
      throw catError;
    }

    console.log(`Categorias prontas: ${catData?.length} categorias.`);
    const catMap = new Map(catData.map(c => [c.name, c.id]));

    // 2. Criar um Cartão de Crédito
    const { data: cardData } = await supabase
      .from('credit_cards')
      .upsert([{ 
        user_id: USER_ID, 
        name: 'Nubank Teste', 
        limit_cents: 500000, 
        closing_day: 25, 
        due_day: 1 
      }], { onConflict: 'user_id, name' })
      .select()
      .single();

    const cardId = cardData?.id;
    console.log('Cartão pronto:', cardId);

    // 3. Gerar Transações para os últimos 12 meses
    const transactions = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const monthStr = monthDate.toISOString().substring(0, 7); // YYYY-MM
      
      // Salário
      transactions.push({
        user_id: USER_ID,
        category_id: catMap.get('salário'),
        amount_cents: 500000 + (Math.random() * 50000),
        description: 'Salário Mensal',
        transaction_date: `${monthStr}-05`,
      });

      // Aluguel
      transactions.push({
        user_id: USER_ID,
        category_id: catMap.get('moradia'),
        amount_cents: 150000,
        description: 'Aluguel',
        transaction_date: `${monthStr}-10`,
      });

      // Supermercado
      for (let j = 0; j < 3; j++) {
        transactions.push({
          user_id: USER_ID,
          category_id: catMap.get('alimentação'),
          amount_cents: 10000 + (Math.random() * 20000),
          description: 'Supermercado',
          transaction_date: `${monthStr}-${10 + (j * 7)}`,
        });
      }

      // Lazer
      transactions.push({
        user_id: USER_ID,
        category_id: catMap.get('lazer'),
        amount_cents: 5000 + (Math.random() * 15000),
        description: 'Jantar fora',
        transaction_date: `${monthStr}-20`,
      });

      // Transporte
      transactions.push({
        user_id: USER_ID,
        category_id: catMap.get('transporte'),
        amount_cents: 2000 + (Math.random() * 8000),
        description: 'Combustível / Uber',
        transaction_date: `${monthStr}-15`,
      });

      // Uma compra parcelada há 6 meses
      if (cardId && i === 6) {
        const installments = 10;
        const installmentValue = 12000;
        for (let p = 1; p <= installments; p++) {
          const pDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + p - 1, 15);
          transactions.push({
            user_id: USER_ID,
            category_id: catMap.get('compras'),
            credit_card_id: cardId,
            amount_cents: installmentValue,
            description: `Notebook (Parcela ${p}/${installments})`,
            transaction_date: pDate.toISOString().substring(0, 10),
            is_installment: true,
            installment_number: p,
            total_installments: installments
          });
        }
      }
    }

    console.log(`Inserindo ${transactions.length} transações...`);
    // Inserir transações
    const chunkSize = 50;
    let insertedCount = 0;
    for (let i = 0; i < transactions.length; i += chunkSize) {
      const chunk = transactions.slice(i, i + chunkSize);
      const { error } = await supabase.from('transactions').insert(chunk);
      if (error) {
        console.error('Erro ao inserir transações:', error);
        throw error;
      }
      insertedCount += chunk.length;
    }

    console.log(`Seeding finalizado! ${insertedCount} transações inseridas.`);
    return NextResponse.json({ success: true, message: `Seeding completo! ${insertedCount} transações inseridas.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
