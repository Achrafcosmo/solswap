"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import { useSwapStore } from "@/hooks/useSwapStore";
import { getSwapTransaction } from "@/lib/jupiter";
import { formatPriceImpact } from "@/lib/format";
import TokenSelector from "./TokenSelector";

export default function SwapCard() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const store = useSwapStore();
  const [selectingSide, setSelectingSide] = useState<"input" | "output" | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [txResult, setTxResult] = useState<{ txid: string } | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  // Debounced quote fetch
  useEffect(() => {
    if (!store.inputAmount || parseFloat(store.inputAmount) <= 0) return;
    const timer = setTimeout(() => store.fetchQuote(), 500);
    return () => clearTimeout(timer);
  }, [store.inputAmount, store.inputToken.address, store.outputToken.address]);

  const handleSwap = useCallback(async () => {
    if (!publicKey || !signTransaction || !store.quote) return;

    setSwapping(true);
    setSwapError(null);
    setTxResult(null);

    try {
      const swapTxBase64 = await getSwapTransaction(
        store.quote,
        publicKey.toBase58()
      );

      const swapTxBuf = Buffer.from(swapTxBase64, "base64");
      const tx = VersionedTransaction.deserialize(swapTxBuf);
      const signed = await signTransaction(tx);
      const txid = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
        maxRetries: 2,
      });

      await connection.confirmTransaction(txid, "confirmed");
      setTxResult({ txid });
    } catch (e: any) {
      setSwapError(e.message || "Swap failed");
    } finally {
      setSwapping(false);
    }
  }, [publicKey, signTransaction, store.quote, connection]);

  const slippageOptions = [25, 50, 100, 300]; // bps

  return (
    <>
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Swap</h2>
            <div className="flex items-center gap-1">
              {slippageOptions.map((bps) => (
                <button
                  key={bps}
                  onClick={() => store.setSlippage(bps)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    store.slippageBps === bps
                      ? "bg-brand-accent/20 text-brand-accent"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {bps / 100}%
                </button>
              ))}
            </div>
          </div>

          {/* Input Token */}
          <div className="bg-brand-dark rounded-2xl p-4 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">You pay</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={store.inputAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  if (val.split(".").length > 2) return;
                  store.setInputAmount(val);
                }}
                className="flex-1 bg-transparent text-2xl text-white font-semibold focus:outline-none placeholder-gray-600"
              />
              <button
                onClick={() => setSelectingSide("input")}
                className="flex items-center gap-2 bg-brand-card border border-brand-border rounded-xl px-3 py-2 hover:border-brand-accent/50 transition-colors"
              >
                {store.inputToken.logoURI && (
                  <img
                    src={store.inputToken.logoURI}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-white font-semibold text-sm">
                  {store.inputToken.symbol}
                </span>
                <span className="text-gray-500">▾</span>
              </button>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={store.switchTokens}
              className="w-10 h-10 bg-brand-card border border-brand-border rounded-xl flex items-center justify-center hover:border-brand-accent/50 hover:rotate-180 transition-all duration-300"
            >
              <span className="text-brand-accent text-lg">⇅</span>
            </button>
          </div>

          {/* Output Token */}
          <div className="bg-brand-dark rounded-2xl p-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">You receive</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-semibold">
                {store.loading ? (
                  <span className="text-gray-500 animate-pulse">...</span>
                ) : store.outputAmount ? (
                  <span className="text-white">{store.outputAmount}</span>
                ) : (
                  <span className="text-gray-600">0.00</span>
                )}
              </div>
              <button
                onClick={() => setSelectingSide("output")}
                className="flex items-center gap-2 bg-brand-card border border-brand-border rounded-xl px-3 py-2 hover:border-brand-accent/50 transition-colors"
              >
                {store.outputToken.logoURI && (
                  <img
                    src={store.outputToken.logoURI}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-white font-semibold text-sm">
                  {store.outputToken.symbol}
                </span>
                <span className="text-gray-500">▾</span>
              </button>
            </div>
          </div>

          {/* Quote Details */}
          {store.quote && (
            <div className="mt-4 px-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Price Impact</span>
                <span
                  className={
                    store.quote.priceImpactPct > 1
                      ? "text-red-400"
                      : store.quote.priceImpactPct > 0.5
                      ? "text-yellow-400"
                      : "text-brand-accent"
                  }
                >
                  {formatPriceImpact(store.quote.priceImpactPct)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Route</span>
                <span className="text-gray-300">
                  {store.quote.routePlan
                    .map((r) => r.swapInfo.label)
                    .join(" → ")}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Slippage</span>
                <span className="text-gray-300">{store.slippageBps / 100}%</span>
              </div>
            </div>
          )}

          {/* Error */}
          {(store.error || swapError) && (
            <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              {store.error || swapError}
            </div>
          )}

          {/* Success */}
          {txResult && (
            <div className="mt-3 px-3 py-2 bg-brand-accent/10 border border-brand-accent/20 rounded-xl text-brand-accent text-xs">
              Swap successful!{" "}
              <a
                href={`https://solscan.io/tx/${txResult.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on Solscan →
              </a>
            </div>
          )}

          {/* Swap Button */}
          <div className="mt-5">
            {!connected ? (
              <WalletMultiButton className="!w-full !justify-center !rounded-2xl !py-4 !text-base" />
            ) : (
              <button
                onClick={handleSwap}
                disabled={!store.quote || swapping || store.loading}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-brand-purple to-brand-accent text-black hover:opacity-90"
              >
                {swapping
                  ? "Swapping..."
                  : store.loading
                  ? "Fetching quote..."
                  : !store.inputAmount
                  ? "Enter amount"
                  : !store.quote
                  ? "Get quote"
                  : "Swap"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Token Selector Modal */}
      {selectingSide && (
        <TokenSelector
          onSelect={(token) => {
            if (selectingSide === "input") store.setInputToken(token);
            else store.setOutputToken(token);
          }}
          onClose={() => setSelectingSide(null)}
        />
      )}
    </>
  );
}
