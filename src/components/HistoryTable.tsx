"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getSwaps, clearSwaps, SwapRecord } from "@/lib/swapHistory";
import { shortenAddress } from "@/lib/format";

export default function HistoryTable() {
  const { publicKey, connected } = useWallet();
  const [swaps, setSwaps] = useState<SwapRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    const data = await getSwaps(publicKey.toBase58());
    setSwaps(data);
    setLoading(false);
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) fetchHistory();
  }, [connected, publicKey, fetchHistory]);

  const handleClear = async () => {
    if (!publicKey) return;
    if (confirm("Clear all swap history?")) {
      await clearSwaps(publicKey.toBase58());
      setSwaps([]);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500 mb-6">Connect your wallet to view your SolSwap history</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Swap History</h2>
          <p className="text-sm text-gray-500 mt-1">
            Swaps made on SolSwap · {shortenAddress(publicKey?.toBase58() || "")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-40"
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
          {swaps.length > 0 && (
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/[0.05] hover:border-red-500/20 transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
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

      {!loading && swaps.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-white mb-1">No swaps yet</h3>
          <p className="text-gray-500 text-sm">
            Swaps you make on SolSwap will appear here — on any device
          </p>
        </div>
      )}

      {!loading && swaps.length > 0 && (
        <div className="space-y-2.5">
          {swaps.map((swap) => (
            <a
              key={swap.signature}
              href={swap.signature ? `https://solscan.io/tx/${swap.signature}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass rounded-2xl border border-white/[0.06] p-4 hover:border-brand-accent/20 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  swap.status === "success" ? "bg-brand-accent/10" : "bg-red-500/10"
                }`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={swap.status === "success" ? "text-brand-accent" : "text-red-400"}>
                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      {swap.input_logo && (
                        <img src={swap.input_logo} alt="" className="w-5 h-5 rounded-full" />
                      )}
                      <span className="text-sm font-semibold text-red-400">
                        -{swap.input_amount} {swap.input_symbol}
                      </span>
                    </span>

                    <span className="text-gray-600">→</span>

                    <span className="flex items-center gap-1">
                      {swap.output_logo && (
                        <img src={swap.output_logo} alt="" className="w-5 h-5 rounded-full" />
                      )}
                      <span className="text-sm font-semibold text-brand-accent">
                        +{swap.output_amount} {swap.output_symbol}
                      </span>
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 mt-1.5">
                    {swap.created_at
                      ? new Date(swap.created_at).toLocaleString()
                      : "Unknown time"}
                    {swap.status === "failed" && (
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
