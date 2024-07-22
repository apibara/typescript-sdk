import type { Transaction, TransactionReceipt } from "./block";

/** Returns the transaction receipt for the given transaction index. */
export function getReceipt(
  transactionIndex: number,
  receipts: readonly TransactionReceipt[],
): TransactionReceipt | undefined {
  return binarySearch(
    transactionIndex,
    receipts,
    (receipt) => receipt.meta?.transactionIndex ?? 0,
  );
}

/** Returns the transaction for the given transaction index. */
export function getTransaction(
  transactionIndex: number,
  transactions: readonly Transaction[],
): Transaction | undefined {
  return binarySearch(
    transactionIndex,
    transactions,
    (transaction) => transaction.meta?.transactionIndex ?? 0,
  );
}

function binarySearch<T>(
  index: number,
  arr: readonly T[],
  getIndex: (item: T) => number,
): T | undefined {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const item = arr[mid];
    const itemIndex = getIndex(item);

    if (itemIndex === index) {
      return item;
    }

    if (itemIndex < index) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
}
