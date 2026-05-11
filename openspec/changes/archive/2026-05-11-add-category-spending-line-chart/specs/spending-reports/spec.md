## ADDED Requirements

### Requirement: Category Spending Visualization
The system SHALL provide charts on the reports page that visualize spending trends across different categories over time.

#### Scenario: Viewing Spending Trends
- **GIVEN** the user has transactions in multiple categories over several months
- **WHEN** the user visits the reports page
- **THEN** a chart SHALL be displayed
- **AND** the system SHALL provide a toggle between Line and Stacked Area views
- **AND** each series SHALL represent a specific spending category or the "Others" group
- **AND** the color SHALL match the category's assigned color (except for "Others", which SHALL have a neutral color)
- **AND** the x-axis SHALL represent time based on the selected granularity
- **AND** the y-axis SHALL represent the total amount spent in cents

### Requirement: Automatic Category Grouping
To maintain legibility, the system SHALL group low-volume categories into a single "Others" series.

#### Scenario: Grouping Small Categories
- **GIVEN** a category represents < 5% of the total spending in the current view
- **WHEN** the chart is rendered
- **THEN** its data SHALL be added to the "Others" series instead of being shown individually

### Requirement: Flexible Period Selection
The system SHALL allow users to switch between different time granularities for reports.

#### Scenario: Switching to Yearly View
- **WHEN** the user selects "Yearly" in the period picker
- **THEN** the system SHALL re-aggregate transaction data using a yearly interval
- **AND** update the chart accordingly

