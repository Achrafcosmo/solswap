import { Connection, PublicKey } from "@solana/web3.js";

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.helius-rpc.com/?api-key=925d8b57-8b95-42e6-9fc8-0ffa673c29e5";

export interface SwapHistoryItem {
  signature: string;
  timestamp: number;
  status: "success" | "failed";
  fee: number;
  transfers: TokenTransfer[];
}

export interface TokenTransfer {
  mint: string;
  amount: number;
  decimals: number;
  direction: "in" | "out";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getSwapHistory(
  walletAddress: string,
  limit: number = 10
): Promise<SwapHistoryItem[]> {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const pubkey = new PublicKey(walletAddress);

  const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
  if (!signatures.length) return [];

  const history: SwapHistoryItem[] = [];

  // Fetch ONE at a time with delay to avoid rate limits
  for (const sig of signatures) {
    try {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta) continue;

      const transfers = extractTransfers(tx, walletAddress);

      if (transfers.length > 0) {
        history.push({
          signature: sig.signature,
          timestamp: sig.blockTime || 0,
          status: tx.meta.err ? "failed" : "success",
          fee: (tx.meta.fee || 0) / 1e9,
          transfers,
        });
      }

      // Small delay between requests
      await sleep(200);
    } catch (e: any) {
      // Skip failed fetches, continue with others
      console.warn("Failed to fetch tx:", sig.signature, e.message);
      await sleep(500);
    }
  }

  return history;
}

function extractTransfers(
  tx: any,
  walletAddress: string
): TokenTransfer[] {
  const transfers: TokenTransfer[] = [];
  const meta = tx.meta;
  if (!meta) return transfers;

  const accountKeys = tx.transaction.message.accountKeys;
  const walletIndex = accountKeys.findIndex(
    (k: any) => k.pubkey.toBase58() === walletAddress
  );

  if (walletIndex !== -1 && meta.preBalances && meta.postBalances) {
    const fee = (meta.fee || 0) / 1e9;
    const solChange = (meta.postBalances[walletIndex] - meta.preBalances[walletIndex]) / 1e9;
    const adjustedChange = solChange + fee;

    if (Math.abs(adjustedChange) > 0.00001) {
      transfers.push({
        mint: "So11111111111111111111111111111111111111112",
        amount: Math.abs(adjustedChange),
        decimals: 9,
        direction: adjustedChange > 0 ? "in" : "out",
      });
    }
  }

  const preTokenBalances = meta.preTokenBalances || [];
  const postTokenBalances = meta.postTokenBalances || [];

  const preMap = new Map<string, number>();
  for (const bal of preTokenBalances) {
    if (bal.owner === walletAddress) {
      preMap.set(bal.mint, parseFloat(bal.uiTokenAmount.uiAmountString || "0"));
    }
  }

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

  for (const [mint, preAmount] of preMap) {
    if (preAmount > 0) {
      transfers.push({ mint, amount: preAmount, decimals: 0, direction: "out" });
    }
  }

  return transfers;
}
