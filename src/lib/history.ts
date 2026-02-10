const HELIUS_API_KEY = "925d8b57-8b95-42e6-9fc8-0ffa673c29e5";
const HELIUS_URL = `https://api.helius.xyz/v0`;

export interface SwapHistoryItem {
  signature: string;
  timestamp: number;
  status: "success" | "failed";
  type: string;
  source: string;
  fee: number;
  description: string;
  transfers: TokenTransfer[];
}

export interface TokenTransfer {
  mint: string;
  amount: number;
  direction: "in" | "out";
}

export async function getSwapHistory(
  walletAddress: string,
  limit: number = 15
): Promise<SwapHistoryItem[]> {
  const url = `${HELIUS_URL}/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch history: ${res.status}`);
  }

  const txs: any[] = await res.json();
  const history: SwapHistoryItem[] = [];

  for (const tx of txs) {
    const transfers: TokenTransfer[] = [];

    // Token transfers
    if (tx.tokenTransfers) {
      for (const t of tx.tokenTransfers) {
        if (t.fromUserAccount === walletAddress) {
          transfers.push({
            mint: t.mint,
            amount: t.tokenAmount,
            direction: "out",
          });
        }
        if (t.toUserAccount === walletAddress) {
          transfers.push({
            mint: t.mint,
            amount: t.tokenAmount,
            direction: "in",
          });
        }
      }
    }

    // Native SOL transfers
    if (tx.nativeTransfers) {
      let solIn = 0;
      let solOut = 0;
      for (const t of tx.nativeTransfers) {
        if (t.toUserAccount === walletAddress) solIn += t.amount;
        if (t.fromUserAccount === walletAddress) solOut += t.amount;
      }
      // Net SOL change (excluding fee)
      const netSol = (solIn - solOut + (tx.fee || 0)) / 1e9;
      if (Math.abs(netSol) > 0.00001) {
        transfers.push({
          mint: "So11111111111111111111111111111111111111112",
          amount: Math.abs(netSol),
          direction: netSol > 0 ? "in" : "out",
        });
      }
    }

    if (transfers.length > 0) {
      history.push({
        signature: tx.signature,
        timestamp: tx.timestamp || 0,
        status: tx.transactionError ? "failed" : "success",
        type: tx.type || "UNKNOWN",
        source: tx.source || "",
        fee: (tx.fee || 0) / 1e9,
        description: tx.description || "",
        transfers,
      });
    }
  }

  return history;
}
