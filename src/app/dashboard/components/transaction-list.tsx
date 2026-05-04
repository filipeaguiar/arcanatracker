import { listTransactions } from "@/lib/actions/transactions";
import TransactionListClient from "./transaction-list-client";
import type { Category } from "@/lib/actions/categories";
import type { Tag } from "@/lib/actions/tags";
import type { CreditCard } from "@/lib/actions/credit-cards";

interface TransactionListProps {
  from?: string;
  to?: string;
  categories: Category[];
  tags: Tag[];
  cards: CreditCard[];
}

export default async function TransactionList({ from, to, categories, tags, cards }: TransactionListProps) {
  const result = await listTransactions({ limit: 100, from, to });
  const transactions = result.data;

  return (
    <TransactionListClient 
      initialTransactions={transactions} 
      categories={categories} 
      tags={tags} 
      cards={cards} 
    />
  );
}
