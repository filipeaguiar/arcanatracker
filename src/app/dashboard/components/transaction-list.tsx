import { listTransactions } from "@/lib/actions/transactions";
import TransactionListClient from "./transaction-list-client";

interface TransactionListProps {
  from?: string;
  to?: string;
}

export default async function TransactionList({ from, to }: TransactionListProps) {
  const result = await listTransactions({ limit: 100, from, to });
  const transactions = result.data;

  return <TransactionListClient initialTransactions={transactions} />;
}
