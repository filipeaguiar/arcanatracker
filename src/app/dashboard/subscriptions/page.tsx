import { listSubscriptions } from "@/lib/actions/subscriptions";
import { listCategories } from "@/lib/actions/categories";
import SubscriptionsClient from "./subscriptions-client";

export default async function SubscriptionsPage() {
  const [subscriptions, categories] = await Promise.all([
    listSubscriptions(),
    listCategories()
  ]);

  return <SubscriptionsClient initialSubscriptions={subscriptions} categories={categories} />;
}
