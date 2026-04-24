import { SummarySkeleton, ListSkeleton } from "@/app/components/ui/skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <div style={{ width: "200px", height: "36px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)", animation: "pulse 2s infinite", marginBottom: "var(--space-2)" }} />
          <div style={{ width: "250px", height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)", animation: "pulse 2s infinite" }} />
        </div>
        <div style={{ width: "300px", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)", animation: "pulse 2s infinite" }} />
      </header>

      <SummarySkeleton />

      {/* Chart skeletons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        <div className="glass card" style={{ height: "280px", animation: "pulse 2s infinite" }} />
        <div className="glass card" style={{ height: "280px", animation: "pulse 2s infinite" }} />
      </div>

      <div className="glass" style={{ height: "140px", marginBottom: "var(--space-10)", animation: "pulse 2s infinite" }} />

      <ListSkeleton />
    </div>
  );
}
