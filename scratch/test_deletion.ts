import { createClient } from "../src/lib/supabase/server";
import { createTransaction, deleteTransaction, listTransactions } from "../src/lib/actions/transactions";

async function testDeletion() {
  console.log("Iniciando teste de deleção...");
  
  // 1. Criar uma transação parcelada (3x)
  // Usamos a DSL para facilitar
  const input = "3*100 teste deleção compras";
  console.log("Criando transação 3x...");
  const createRes = await createTransaction(input);
  
  if (!createRes.success) {
    console.error("Erro ao criar:", createRes.error);
    return;
  }
  
  const groupId = createRes.data?.group_id;
  console.log("Transações criadas. Group ID:", groupId);

  // 2. Verificar se as 3 parcelas existem
  const { data: allTx } = await listTransactions({ limit: 100 });
  const groupItems = allTx.filter(t => t.installment_group_id === groupId);
  console.log(`Encontradas ${groupItems.length} parcelas no banco.`);

  if (groupItems.length !== 3) {
    console.error("ERRO: Deveriam existir 3 parcelas.");
    return;
  }

  // 3. Deletar a SEGUNDA parcela
  const idToDelete = groupItems[1].id;
  console.log(`Deletando a parcela ID: ${idToDelete} (Parcela ${groupItems[1].installment_current})`);
  await deleteTransaction(idToDelete);

  // 4. Verificar se SOBROU alguma coisa desse grupo
  const { data: afterTx } = await listTransactions({ limit: 100 });
  const remainingItems = afterTx.filter(t => t.installment_group_id === groupId);
  
  if (remainingItems.length === 0) {
    console.log("SUCESSO: Todas as parcelas do grupo foram removidas!");
  } else {
    console.error(`FALHA: Ainda restam ${remainingItems.length} parcelas do grupo ${groupId}.`);
  }
}

testDeletion().catch(console.error);
