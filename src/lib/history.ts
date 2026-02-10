import { Connection, PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";

export interface SwapHistoryItem {
  signature: string;
  timestamp: number;
  status: "success" | "failed";
  fee: number; // in SOL
  slot: number;
  transfers: TokenTransfer[];
}

export interface TokenTransfer {
  mint: string;
  amount: number;
  decimals: number;
  direction: "in" | "out";
}

export async function getSwapHistory(
  walletAddress: string,
  limit: number = 20
): Promise<SwapHistoryItem[]> {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const pubkey = new PublicKey(walletAddress);

  // Get recent signatures
  const signatures = await connection.getSignaturesForAddress(pubkey, {
    limit,
  });

  if (!signatures.length) return [];

  // Fetch parsed transactions
  const txs = await connection.getParsedTransactions(
    signatures.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0 }
  );

  const history: SwapHistoryItem[] = [];

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const sig = signatures[i];
    if (!tx || !tx.meta) continue;

    // Extract token balance changes for the wallet
    const transfers = extractTransfers(tx, walletAddress);

    // Only include transactions that look like swaps (have both in and out transfers)
    const hasIn = transfers.some((t) => t.direction === "in");
    const hasOut = transfers.some((t) => t.direction === "out");

    if (hasIn && hasOut) {
      history.push({
        signature: sig.signature,
        timestamp: sig.blockTime || 0,
        status: tx.meta.err ? "failed" : "success",
        fee: (tx.meta.fee || 0) / 1e9,
        slot: sig.slot,
        transfers,
      });
    }
  }

  return history;
}

function extractTransfers(
  tx: ParsedTransactionWithMeta,
  walletAddress: string
): TokenTransfer[] {
  const transfers: TokenTransfer[] = [];
  const meta = tx.meta;
  if (!meta) return transfers;

  // Check SOL balance change
  const accountKeys = tx.transaction.message.accountKeys;
  const walletIndex = accountKeys.findIndex(
    (k) => k.pubkey.toBase58() === walletAddress
  );

  if (walletIndex !== -1 && meta.preBalances && meta.postBalances) {
    const solChange =
      (meta.postBalances[walletIndex] - meta.preBalances[walletIndex]) / 1e9;
    // Subtract fee for outgoing
    const fee = (meta.fee || 0) / 1e9;
    const adjustedChange = solChange + fee; // add fee back to see actual swap amount

    if (Math.abs(adjustedChange) > 0.0001) {
      transfers.push({
        mint: "So11111111111111111111111111111111111111112",
        amount: Math.abs(adjustedChange),
        decimals: 9,
        direction: adjustedChange > 0 ? "in" : "out",
      });
    }
  }

  // Check token balance changes
  const preTokenBalances = meta.preTokenBalances || [];
  const postTokenBalances = meta.postTokenBalances || [];

  // Build map of pre-balances for the wallet
  const preMap = new Map<string, number>();
  for (const bal of preTokenBalances) {
    if (bal.owner === walletAddress) {
      preMap.set(
        bal.mint,
        parseFloat(bal.uiTokenAmount.uiAmountString || "0")
      );
    }
  }

  // Compare with post-balances
  for (const bal of postTokenBalances) {
    if (bal.owner === walletAddress) {
      const pre = preMap.get(bal.mint) || 0;
      const post = parseFloat(bal.uiTokenAmount.uiAmountString || "0");
      const diff = post - pre;

      if (Math.abs(diff) > 0) {
        transfers.push({
          mint: bal.mint,
          amount: Math.abs(diff),
          decimals: bal.uiTokenAmount.decimals,
          direction: diff > 0 ? "in" : "out",
        });
      }
      preMap.delete(bal.mint);
    }
  }

  // Handle tokens that existed in pre but not in post (fully sold)
  for (const [mint, preAmount] of preMap) {
    if (preAmount > 0) {
      transfers.push({
        mint,
        amount: preAmount,
        decimals: 0, // unknown at this point
        direction: "out",
      });
    }
  }

  return transfers;
}
