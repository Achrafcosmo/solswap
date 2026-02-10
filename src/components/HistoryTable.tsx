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

interface EnrichedItem extends Omit<SwapHistoryItem, "transfers"> {
  sent: EnrichedTransfer[];
  received: EnrichedTransfer[];
}

export default function HistoryTable() {
  const { publicKey, connected } = useWallet();
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);

    try {
      const history = await getSwapHistory(publicKey.toBase58(), 15);

      const enriched: EnrichedItem[] = await Promise.all(
        history.map(async (item) => {
          const enrichedTransfers = await Promise.all(
            item.transfers.map(async (t) => {
              const meta = await getTokenMeta(t.mint);
              return { ...t, symbol: meta.symbol, logoURI: meta.logoURI };
            })
          );
          return {
            ...item,
            sent: enrichedTransfers.filter((t) => t.direction === "out"),
            received: enrichedTransfers.filter((t) => t.direction === "in"),
          };
        })
      );

      setItems(enriched);
    } catch (e: any) {
      console.error("History error:", e);
      setError(e.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) fetchHistory();
  }, [connected, publicKey, fetchHistory]);

  const typeIcon = (type: string) => {
    switch (type) {
      case "SWAP":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-accent">
            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        );
      case "TRANSFER":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        );
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "SWAP": return "bg-brand-accent/10";
      case "TRANSFER": return "bg-blue-400/10";
      default: return "bg-gray-500/10";
    }
  };

  const formatAmount = (amount: number) => {
    if (amount < 0.001) return amount.toExponential(2);
    if (amount < 1) return amount.toFixed(4);
    if (amount < 1000) return amount.toFixed(2);
    if (amount < 1_000_000) return `${(amount / 1000).toFixed(1)}K`;
    return `${(amount / 1_000_000).toFixed(1)}M`;
  };

  if (!connected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500 mb-6">Connect your wallet to view your transaction history</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <p className="text-sm text-gray-500 mt-1">
            {shortenAddress(publicKey?.toBase58() || "")}
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-40"
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-2xl border border-white/[0.06] p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/[0.06] rounded w-1/3" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-white mb-1">No transactions found</h3>
          <p className="text-gray-500 text-sm">Your recent transactions will appear here</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((item) => (
            <a
              key={item.signature}
              href={`https://solscan.io/tx/${item.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass rounded-2xl border border-white/[0.06] p-4 hover:border-brand-accent/20 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColor(item.type)}`}>
                  {typeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400 uppercase bg-white/[0.04] px-2 py-0.5 rounded-md">
                      {item.type}
                    </span>
                    {item.source && (
                      <span className="text-xs text-gray-600">{item.source}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {item.sent.map((t, i) => (
                      <span key={`out-${i}`} className="flex items-center gap-1">
                        {t.logoURI && <img src={t.logoURI} alt="" className="w-4 h-4 rounded-full" />}
                        <span className="text-sm font-medium text-red-400">
                          -{formatAmount(t.amount)} {t.symbol}
                        </span>
                      </span>
                    ))}

                    {item.sent.length > 0 && item.received.length > 0 && (
                      <span className="text-gray-600">→</span>
                    )}

                    {item.received.map((t, i) => (
                      <span key={`in-${i}`} className="flex items-center gap-1">
                        {t.logoURI && <img src={t.logoURI} alt="" className="w-4 h-4 rounded-full" />}
                        <span className="text-sm font-medium text-brand-accent">
                          +{formatAmount(t.amount)} {t.symbol}
                        </span>
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-600 mt-1">
                    {item.timestamp
                      ? new Date(item.timestamp * 1000).toLocaleString()
                      : "Unknown time"}
                    {item.status === "failed" && (
                      <span className="text-red-400 ml-2">• Failed</span>
                    )}
                  </div>
                </div>

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
