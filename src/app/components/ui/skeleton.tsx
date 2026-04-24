export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "var(--radius-sm)",
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ...style,
      }}
    />
  );
}

export function SummarySkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-10)" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass card" style={{ padding: "var(--space-6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
            <Skeleton style={{ width: "80px", height: "16px" }} />
            <Skeleton style={{ width: "60px", height: "20px", borderRadius: "100px" }} />
          </div>
          <Skeleton style={{ width: "150px", height: "32px" }} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="glass" style={{ padding: "var(--space-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-8)" }}>
        <Skeleton style={{ width: "200px", height: "24px" }} />
        <Skeleton style={{ width: "80px", height: "32px" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--color-border-subtle)" }}>
            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <Skeleton style={{ width: "40px", height: "40px", borderRadius: "var(--radius-sm)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Skeleton style={{ width: "150px", height: "16px" }} />
                <Skeleton style={{ width: "80px", height: "12px" }} />
              </div>
            </div>
            <Skeleton style={{ width: "100px", height: "20px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
