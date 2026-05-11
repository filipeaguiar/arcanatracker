## Context

The current reports page provides a basic overview but lacks time-series analysis. This design introduces a line chart to visualize categorical spending trends over time, leveraging the existing deterministic color system.

## Goals / Non-Goals

**Goals:**
- Implement a responsive line chart for category spending.
- Use `getCategoryColor` to ensure visual consistency between the chart and other parts of the app.
- Aggregation of data on the server to minimize client-side processing.

**Non-Goals:**
- Adding interactive drill-downs in this phase.
- Supporting custom user-defined colors for categories (still using deterministic palette).

## Decisions

### Chart Library: Recharts
- **Decision**: Use `recharts` for both Line and Area charts.
- **Rationale**: It's a standard, highly customizable, and well-supported library for React/Next.js applications. It supports multi-series charts natively.

### Dual Visualization: Line & Area
- **Decision**: Implement a toggle to switch between `LineChart` and `AreaChart` (stacked).
- **Rationale**: Line charts are better for comparing individual category growth, while stacked area charts clearly show the composition of total spending.

### Category Grouping ("Others")
- **Decision**: Categories representing less than 5% of the total spending in the selected period will be grouped into an "Others" category.
- **Rationale**: Prevents visual clutter ("spaghetti chart") when a user has many small categories. This logic will be applied on the server or in a dedicated data-processing utility.

### Dynamic Period Aggregation
- **Decision**: Support `month` and `year` granularities using PostgreSQL `date_trunc`.
- **Rationale**: Users need to compare habits month-to-month and year-over-year. The UI will provide a selector that triggers a re-fetch with the new period parameter.

## Risks / Trade-offs

- **[Risk]**: Too many categories could clutter the chart.
  - **Mitigation**: Limit the chart to the top 10 categories by volume or provide a toggle to select specific categories.
- **[Risk]**: Performance with large datasets.
  - **Mitigation**: Use indexed queries on `transaction_date` and `user_id`.
