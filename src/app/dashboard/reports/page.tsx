import { Suspense } from "react";
import { SummarySkeleton } from "@/app/components/ui/skeleton";
import ReportFilterBar from "./components/report-filter-bar";
import ReportsDashboard from "./components/reports-dashboard";

interface ReportsPageProps {
  searchParams: Promise<{ period?: string; refDate?: string }>;
}

export const unstable_instant = { prefetch: 'static' };

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const period = params.period || "monthly";
  // refDate é a data de referência (padrão é hoje)
  const refDate = params.refDate || new Date().toISOString().split("T")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <header className="dashboard-page-header">
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: "800", letterSpacing: "-0.03em" }}>
            Relatórios
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Análise detalhada das suas finanças.
          </p>
        </div>
      </header>
      
      <ReportFilterBar currentPeriod={period} refDate={refDate} />

      <Suspense fallback={<SummarySkeleton />}>
        <ReportsDashboard period={period} refDate={refDate} />
      </Suspense>
    </div>
  );
}
