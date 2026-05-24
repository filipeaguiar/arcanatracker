/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTransactionCore } from '../../src/lib/actions/transaction-core';

// Mock dependencies
vi.mock('../../src/lib/actions/db-helpers', () => ({
  findOrCreateCategoryAdmin: vi.fn().mockResolvedValue({ id: 'cat-1', name: 'test-cat' }),
  findOrCreateTagsAdmin: vi.fn().mockResolvedValue([{ id: 'tag-1', name: 'test-tag' }]),
}));

vi.mock('../../src/lib/utils/invoice', () => ({
  calculateInvoiceDates: vi.fn().mockReturnValue({ referenceMonth: '2026-05', closingDate: '2026-05-15', dueDate: '2026-05-22' }),
  calculateInstallmentInvoiceDates: vi.fn().mockReturnValue([
    { referenceMonth: '2026-05', closingDate: '2026-05-15', dueDate: '2026-05-22' },
    { referenceMonth: '2026-06', closingDate: '2026-06-15', dueDate: '2026-06-22' },
    { referenceMonth: '2026-07', closingDate: '2026-07-15', dueDate: '2026-07-22' },
  ]),
}));

describe('createTransactionCore', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };
  });

  const userId = 'user-123';

  it('should correctly distribute dates for direct payment installments', async () => {
    mockSupabase.insert.mockImplementation(() => {
      mockSupabase.select.mockResolvedValue({ data: [{ id: 'tx-1' }, { id: 'tx-2' }, { id: 'tx-3' }], error: null });
      return mockSupabase;
    });

    const params = {
      transactionDate: '2026-05-22',
      amountCentsList: [1000, 1000, 1000],
      description: 'Test Direct Installments',
      categoryName: 'test',
      tagNames: [],
      creditCardId: null,
    };

    const result = await createTransactionCore(mockSupabase, userId, params);

    if (!result.success) {
      console.error('Test failed with error:', result.error);
    }
    expect(result.success).toBe(true);
    
    const insertCall = mockSupabase.insert.mock.calls.find((call: any) => Array.isArray(call[0]));
    const rows = insertCall[0];
    
    expect(rows).toHaveLength(3);
    expect(rows[0].transaction_date).toBe('2026-05-22');
    expect(rows[1].transaction_date).toBe('2026-06-22');
    expect(rows[2].transaction_date).toBe('2026-07-22');
  });

  it('should correctly use invoice due dates for credit card installments', async () => {
    // 1. Get Card: single()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'card-1', closing_day: 15, due_day: 22 }, error: null });
    
    // 2. getOrCreateInvoice: single()
    mockSupabase.single.mockResolvedValue({ data: { id: 'inv-1' }, error: null });
    
    // 3. Insert Transactions: select()
    mockSupabase.insert.mockImplementation(() => {
      mockSupabase.select.mockResolvedValue({ data: [{ id: 'tx-1' }, { id: 'tx-2' }, { id: 'tx-3' }], error: null });
      return mockSupabase;
    });

    const params = {
      transactionDate: '2026-05-22',
      amountCentsList: [1000, 1000, 1000],
      description: 'Test CC Installments',
      categoryName: 'test',
      tagNames: [],
      creditCardId: 'card-1',
    };

    const result = await createTransactionCore(mockSupabase, userId, params);

    if (!result.success) {
      console.error('Test failed with error:', result.error);
    }
    expect(result.success).toBe(true);

    const insertCall = mockSupabase.insert.mock.calls.find((call: any) => Array.isArray(call[0]));
    const rows = insertCall[0];

    expect(rows).toHaveLength(3);
    expect(rows[0].transaction_date).toBe('2026-05-22');
    expect(rows[1].transaction_date).toBe('2026-06-22');
    expect(rows[2].transaction_date).toBe('2026-07-22');
    expect(rows[0].invoice_id).toBe('inv-1');
  });
});
