"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getSwapHistory, SwapHistoryItem } from "@/lib/history";
import { getTokenMeta } from "@/lib/tokens";
import { shortenAddress } from "@/lib/format";

interface EnrichedTransfer {
  mint: string;
  symbol: string;
  logoURI?: string;
  amount: number;
  direction: "in" | "out";
}

interface EnrichedSwap {
  signature: string;
  timestamp: number;
  status: "success" | "failed";
  fee: number;
  sent: EnrichedTransfer[];
  received: EnrichedTransfer[];
}

export default function HistoryTable() {
  const { publicKey, connected } = useWallet();
  const [swaps, setSwaps] = useState<EnrichedSwap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);

    try {
      const history = await getSwapHistory(publicKey.toBase58(), 20);

      // Enrich with token metadata
      const enriched: EnrichedSwap[] = await Promise.all(
        history.map(async (swap) => {
          const enrichedTransfers = await Promise.all(
            swap.transfers.map(async (t) => {
              const meta = await getTokenMeta(t.mint);
              return {
                mint: t.mint,
                symbol: meta.symbol,
                logoURI: meta.logoURI,
                amount: t.amount,
                direction: t.direction,
              };
            })
          );

          return {
            signature: swap.signature,
            timestamp: swap.timestamp,
            status: swap.status,
            fee: swap.fee,
            sent: enrichedTransfers.filter((t) => t.direction === "out"),
            received: enrichedTransfers.filter((t) => t.direction === "in"),
          };
        })
      );

      setSwaps(enriched);
    } catch (e: any) {
      console.error("History fetch error:", e);
      setError(e.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) fetchHistory();
  }, [connected, publicKey, fetchHistory]);

  if (!connected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500 mb-6">Connect your wallet to view your swap history</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Swap History</h2>
          <p className="text-sm text-gray-500 mt-1">
            Recent swaps for {shortenAddress(publicKey?.toBase58() || "")}
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-40"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-2xl border border-white/[0.06] p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/[0.06] rounded w-1/3" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/4" />
                </div>
                <div className="h-4 bg-white/[0.06] rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && swaps.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-white mb-1">No swaps found</h3>
          <p className="text-gray-500 text-sm">
            Your recent swap transactions will appear here
          </p>
        </div>
      )}

      {/* Swap list */}
      {!loading && swaps.length > 0 && (
        <div className="space-y-2.5">
          {swaps.map((swap) => (
            <a
              key={swap.signature}
              href={`https://solscan.io/tx/${swap.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass rounded-2xl border border-white/[0.06] p-4 hover:border-brand-accent/20 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  swap.status === "success" ? "bg-brand-accent/10" : "bg-red-500/10"
                }`}>
                  {swap.status === "success" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-accent">
                      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                      <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                  )}
                </div>

                {/* Swap details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Sent */}
                    {swap.sent.map((t, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {t.logoURI && (
                          <img src={t.logoURI} alt="" className="w-4 h-4 rounded-full" />
                        )}
                        <span className="text-sm font-medium text-red-400">
                          -{t.amount < 0.001 ? t.amount.toExponential(2) : t.amount.toFixed(t.amount < 1 ? 4 : 2)} {t.symbol}
                        </span>
                      </span>
                    ))}

                    <span className="text-gray-600">→</span>

                    {/* Received */}
                    {swap.received.map((t, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {t.logoURI && (
                          <img src={t.logoURI} alt="" className="w-4 h-4 rounded-full" />
                        )}
                        <span className="text-sm font-medium text-brand-accent">
                          +{t.amount < 0.001 ? t.amount.toExponential(2) : t.amount.toFixed(t.amount < 1 ? 4 : 2)} {t.symbol}
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* Time */}
                  <div className="text-xs text-gray-600">
                    {swap.timestamp
                      ? new Date(swap.timestamp * 1000).toLocaleString()
                      : "Unknown time"}
                    {" · "}
                    Fee: {swap.fee.toFixed(6)} SOL
                  </div>
                </div>

                {/* Arrow */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 group-hover:text-brand-accent transition-colors shrink-0">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
