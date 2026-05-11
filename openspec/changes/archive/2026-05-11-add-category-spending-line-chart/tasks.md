## 1. Setup and Dependencies

- [x] 1.1 Install `recharts` library
- [x] 1.2 Create `src/lib/actions/analytics.ts` for report logic

## 2. Data Layer

- [x] 2.1 Implement `getCategorySpendingTrends` server action with support for `interval` parameter (month/year)
- [x] 2.2 Implement category grouping logic (threshold < 5%) in the server action or a utility
- [x] 2.3 Add TypeScript interfaces for the multi-series aggregated report data

## 3. UI Components

- [x] 3.1 Create `CategorySpendingChart` component using Recharts
- [x] 3.2 Implement support for both `Line` and `Area` chart types with a toggle
- [x] 3.3 Integrate `getCategoryColor` for series styling
- [x] 3.4 Add "Others" category with a neutral gray color (#94a3b8)
- [x] 3.5 Add loading states and empty state for the charts

## 4. Reports Page Integration

- [x] 4.1 Update `src/app/dashboard/reports/page.tsx` with Chart Type and Period selectors
- [x] 4.2 Ensure responsive layout for the chart container

## 5. Validation and Testing

- [x] 5.1 Verify data aggregation correctness with sample transactions
- [x] 5.2 Test chart rendering with multiple categories and different time ranges
