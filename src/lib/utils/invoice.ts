/**
 * Invoice utilities — Brazilian credit card billing rules
 *
 * Determines which invoice (fatura) a transaction belongs to
 * based on the card's closing day and the transaction date.
 *
 * Rules:
 *   - If transaction_date.day <= closing_day → current month's invoice
 *   - If transaction_date.day >  closing_day → next month's invoice
 *
 * For installments, each installment N uses:
 *   transaction_date + (N - 1) months
 */

export interface InvoiceDates {
  /** First day of the reference month (for DB uniqueness) */
  referenceMonth: string;
  /** The closing date of the invoice */
  closingDate: string;
  /** The due date of the invoice */
  dueDate: string;
}

/**
 * Calculate the invoice dates for a given transaction date and credit card settings.
 *
 * @param transactionDate - ISO date string (YYYY-MM-DD)
 * @param closingDay - Day of month when the invoice closes (1-31)
 * @param dueDay - Day of month when payment is due (1-31)
 * @returns InvoiceDates with reference month, closing date, and due date
 */
export function calculateInvoiceDates(
  transactionDate: string,
  closingDay: number,
  dueDay: number
): InvoiceDates {
  const date = new Date(transactionDate + "T12:00:00"); // noon to avoid timezone issues
  const txDay = date.getDate();
  let invoiceMonth: number;
  let invoiceYear: number;

  if (txDay <= closingDay) {
    // Transaction is before or on closing day → current month's invoice
    invoiceMonth = date.getMonth();
    invoiceYear = date.getFullYear();
  } else {
    // Transaction is after closing day → next month's invoice
    invoiceMonth = date.getMonth() + 1;
    invoiceYear = date.getFullYear();
    if (invoiceMonth > 11) {
      invoiceMonth = 0;
      invoiceYear++;
    }
  }

  // Reference month: first day of the invoice month
  const referenceMonth = formatDate(invoiceYear, invoiceMonth, 1);

  // Closing date: closing_day of the invoice month
  const closingDate = formatDate(
    invoiceYear,
    invoiceMonth,
    clampDay(closingDay, invoiceYear, invoiceMonth)
  );

  // Due date: due_day of the invoice month
  // If due_day < closing_day, due date is in the next month
  let dueMonth = invoiceMonth;
  let dueYear = invoiceYear;
  if (dueDay <= closingDay) {
    dueMonth++;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear++;
    }
  }
  const dueDate = formatDate(
    dueYear,
    dueMonth,
    clampDay(dueDay, dueYear, dueMonth)
  );

  return { referenceMonth, closingDate, dueDate };
}

/**
 * Calculate invoice dates for each installment.
 * Installment N has a transaction date of original_date + (N-1) months.
 *
 * @param transactionDate - Original transaction date (ISO string)
 * @param installmentCount - Total number of installments
 * @param closingDay - Card closing day
 * @param dueDay - Card due day
 * @returns Array of InvoiceDates for each installment
 */
export function calculateInstallmentInvoiceDates(
  transactionDate: string,
  installmentCount: number,
  closingDay: number,
  dueDay: number
): InvoiceDates[] {
  const results: InvoiceDates[] = [];

  for (let i = 0; i < installmentCount; i++) {
    const installmentDate = addMonths(transactionDate, i);
    results.push(
      calculateInvoiceDates(installmentDate, closingDay, dueDay)
    );
  }

  return results;
}

/**
 * Add N months to a date string, clamping the day if needed.
 */
function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr + "T12:00:00");
  const targetMonth = date.getMonth() + months;
  const targetYear =
    date.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;

  const maxDay = daysInMonth(targetYear, normalizedMonth);
  const day = Math.min(date.getDate(), maxDay);

  return formatDate(targetYear, normalizedMonth, day);
}

/**
 * Clamp a day to the maximum days in a given month.
 */
function clampDay(day: number, year: number, month: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/**
 * Get the number of days in a month (0-indexed).
 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Format year, month (0-indexed), day into ISO date string.
 */
function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}
