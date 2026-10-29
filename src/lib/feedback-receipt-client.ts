const KEY = 'site-feedback-receipts';
const MAX = 30;

export type FeedbackReceiptRecord = {
  id: string;
  receipt: string;
  seenReply?: string;
};

function readAll(): FeedbackReceiptRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Partial<FeedbackReceiptRecord>;
      if (typeof row.id !== 'string' || typeof row.receipt !== 'string') return [];
      return [
        {
          id: row.id,
          receipt: row.receipt,
          seenReply: typeof row.seenReply === 'string' ? row.seenReply : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
}

function writeAll(rows: FeedbackReceiptRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(-MAX)));
}

export function rememberFeedbackReceipt(id: string, receipt: string) {
  if (!id || !receipt) return;
  const rows = readAll().filter((row) => row.id !== id);
  rows.push({ id, receipt });
  writeAll(rows);
}

export function readFeedbackReceipts(): FeedbackReceiptRecord[] {
  return readAll();
}

export function markFeedbackReplySeen(id: string, reply: string) {
  const rows = readAll().map((row) => (row.id === id ? { ...row, seenReply: reply } : row));
  writeAll(rows);
}
