import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dotjccsnpxfjllqzbcln.supabase.co';
const SUPABASE_KEY = 'sb_publishable_w3Hh3p--ihdNzai6ZM9vdg_9Mhsrzxv'; // Usando a chave pública
const USER_ID = 'c5ba9776-cd72-4ddd-9df8-833ef7268555';

// NOTA: Para rodar este script e ele funcionar com RLS, 
// o ideal seria usar a SERVICE_ROLE_KEY ou rodar dentro de uma Server Action.
// Como estou rodando externamente, vou assumir que você vai rodar isso 
// em um ambiente onde as permissões permitam ou que o RLS esteja desabilitado para testes.

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('Iniciando seeding para o usuário:', USER_ID);

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
    return;
  }
  console.log('Categorias prontas.');

  const catMap = new Map(catData.map(c => [c.name, c.id]));

  // 2. Criar um Cartão de Crédito
  const { data: cardData, error: cardError } = await supabase
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

  if (cardError) {
    console.error('Erro ao criar cartão:', cardError);
    // Não paramos aqui pois podem haver transações à vista
  } else {
    console.log('Cartão pronto.');
  }

  const cardId = cardData?.id;

  // 3. Gerar Transações para os últimos 12 meses
  const transactions = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const monthStr = monthDate.toISOString().substring(0, 7); // YYYY-MM
    
    console.log(`Gerando dados para ${monthStr}...`);

    // Salário (Income)
    transactions.push({
      user_id: USER_ID,
      category_id: catMap.get('salário'),
      amount_cents: 500000 + (Math.random() * 50000), // ~5k
      description: 'Salário Mensal',
      transaction_date: `${monthStr}-05`,
    });

    // Aluguel (Fixed Expense)
    transactions.push({
      user_id: USER_ID,
      category_id: catMap.get('moradia'),
      amount_cents: 150000,
      description: 'Aluguel',
      transaction_date: `${monthStr}-10`,
    });

    // Supermercado (Variable)
    for (let j = 0; j < 3; j++) {
      transactions.push({
        user_id: USER_ID,
        category_id: catMap.get('alimentação'),
        amount_cents: 10000 + (Math.random() * 20000),
        description: 'Supermercado',
        transaction_date: `${monthStr}-${10 + (j * 7)}`,
      });
    }

    // Lazer/Restaurante
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

    // Uma compra parcelada no cartão (se houver cartão)
    if (cardId && i === 6) { // Compra feita há 6 meses
      const totalAmount = 120000; // 1200.00
      const installments = 10;
      const installmentValue = 12000;
      
      for (let p = 1; p <= installments; p++) {
        // Data da parcela
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
  
  // Inserir em chunks para evitar limites
  const chunkSize = 50;
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    const { error: txError } = await supabase.from('transactions').insert(chunk);
    if (txError) {
      console.error('Erro ao inserir transações:', txError);
    }
  }

  console.log('Seeding finalizado com sucesso!');
}

seed();
