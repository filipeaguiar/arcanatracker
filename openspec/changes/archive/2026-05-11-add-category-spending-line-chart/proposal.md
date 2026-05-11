## Why

Users currently lack a visual way to track spending trends over time per category. Adding a line chart to the reports page will provide clear insights into financial habits and seasonal spending patterns, making the data more actionable.

## What Changes

- **New Reports View**: Addition of interactive charts on the reports page.
- **Visual Options**: Toggle between Line Chart (for trends) and Stacked Area Chart (for composition).
- **Categorized Trends**: The charts will display separate series for each major spending category.
- **Category Grouping**: Automatic grouping of low-volume categories into an "Others" category to maintain chart legibility.
- **Period Selection**: Toggle between different time granularities (e.g., Monthly, Yearly).
- **Visual Branding**: Series will be colored using the system's defined category colors.
- **Data Aggregation**: Implementation of server-side logic to aggregate transaction data by selected period and category.

## Capabilities

### New Capabilities
- `spending-reports`: Requirements for visual financial reporting and time-series data aggregation.

### Modified Capabilities
- `transactions`: Add requirements for supporting periodic aggregation for reports.

## Impact

- **Frontend**: `src/app/dashboard/reports/` (New components and layout updates).
- **Backend**: `src/lib/actions/transactions.ts` (New aggregation logic).
- **Styles**: Integration with existing category color utilities.
