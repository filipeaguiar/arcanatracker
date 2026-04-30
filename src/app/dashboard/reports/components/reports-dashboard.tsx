import { getDailySpending, getCategoryBreakdown, getTagBreakdown } from "@/lib/actions/analytics";
import { getTransactionSummary } from "@/lib/actions/transactions";
import ComparativeCards from "@/app/dashboard/reports/components/comparative-cards";
import TrendChart from "@/app/dashboard/reports/components/trend-chart";
import TagAnalysis from "@/app/dashboard/reports/components/tag-analysis";
import CategoryDonut from "@/app/dashboard/components/category-donut";

interface ReportsDashboardProps {
  period: string;
  refDate: string;
}

export default async function ReportsDashboard({ period, refDate }: ReportsDashboardProps) {
  // Calcular datas baseadas no período
  const ref = new Date(refDate);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  
  let from: Date;
  let to: Date;
  let previousFrom: Date;
  let previousTo: Date;

  if (period === "annual") {
    from = new Date(year, 0, 1);
    to = new Date(year + 1, 0, 0);
    previousFrom = new Date(year - 1, 0, 1);
    previousTo = new Date(year, 0, 0);
  } else if (period === "semiannual") {
    const isFirstHalf = month < 6;
    from = new Date(year, isFirstHalf ? 0 : 6, 1);
    to = new Date(year, isFirstHalf ? 6 : 12, 0);
    previousFrom = new Date(year, isFirstHalf ? -6 : 0, 1);
    previousTo = new Date(year, isFirstHalf ? 0 : 6, 0);
  } else if (period === "quarterly") {
    const quarter = Math.floor(month / 3);
    from = new Date(year, quarter * 3, 1);
    to = new Date(year, (quarter + 1) * 3, 0);
    previousFrom = new Date(year, (quarter - 1) * 3, 1);
    previousTo = new Date(year, quarter * 3, 0);
  } else {
    // monthly default
    from = new Date(year, month, 1);
    to = new Date(year, month + 1, 0);
    previousFrom = new Date(year, month - 1, 1);
    previousTo = new Date(year, month, 0);
  }

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fromStr = formatDate(from);
  const toStr = formatDate(to);
  const prevFromStr = formatDate(previousFrom);
  const prevToStr = formatDate(previousTo);

  const [currentSummary, prevSummary, dailyData, categoryData, tagData] = await Promise.all([
    getTransactionSummary(fromStr, toStr),
    getTransactionSummary(prevFromStr, prevToStr),
    getDailySpending(fromStr, toStr),
    getCategoryBreakdown(fromStr, toStr),
    getTagBreakdown(fromStr, toStr),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <ComparativeCards current={currentSummary} previous={prevSummary} periodName={period} />
      
      {/* Gráfico de Tendência em destaque (Largura Total) */}
      <TrendChart data={dailyData} period={period} />

      {/* Grid de detalhamento */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
        gap: "var(--space-6)",
        alignItems: "stretch" 
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <CategoryDonut data={categoryData} type="expense" title="Despesas por Categoria" />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <TagAnalysis data={tagData} />
        </div>
      </div>
    </div>
  );
}
