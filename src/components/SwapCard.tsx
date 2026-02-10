"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import { useSwapStore } from "@/hooks/useSwapStore";
import { executeOrder } from "@/lib/jupiter";
import { formatPriceImpact } from "@/lib/format";
import TokenSelector from "./TokenSelector";
import { saveSwap } from "@/lib/swapHistory";
import { useTokenBalance } from "@/hooks/useTokenBalance";

const SOL_MINT = "So11111111111111111111111111111111111111112";

export default function SwapCard() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const store = useSwapStore();
  const [selectingSide, setSelectingSide] = useState<"input" | "output" | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [txResult, setTxResult] = useState<{ txid: string } | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { balance: inputBalance } = useTokenBalance(store.inputToken.address);
  const { balance: outputBalance } = useTokenBalance(store.outputToken.address);

  // For SOL, reserve 0.01 for fees
  const maxInput = inputBalance !== null
    ? (store.inputToken.address === SOL_MINT ? Math.max(0, inputBalance - 0.01) : inputBalance)
    : null;

  const handleHalf = () => {
    if (maxInput !== null) {
      const half = maxInput / 2;
      store.setInputAmount(half > 0 ? half.toString() : "0");
    }
  };

  const handleMax = () => {
    if (maxInput !== null) {
      store.setInputAmount(maxInput > 0 ? maxInput.toString() : "0");
    }
  };

  // Debounced order fetch
  useEffect(() => {
    if (!store.inputAmount || parseFloat(store.inputAmount) <= 0) return;
    const taker = publicKey?.toBase58();
    const timer = setTimeout(() => store.fetchOrder(taker), 500);
    return () => clearTimeout(timer);
  }, [store.inputAmount, store.inputToken.address, store.outputToken.address, publicKey]);

  const handleSwap = useCallback(async () => {
    if (!publicKey || !signTransaction || !store.order?.transaction) return;

    setSwapping(true);
    setSwapError(null);
    setTxResult(null);

    try {
      // Deserialize and sign
      const txBuf = Buffer.from(store.order.transaction, "base64");
      const tx = VersionedTransaction.deserialize(txBuf);
      const signed = await signTransaction(tx);
      const signedBase64 = Buffer.from(signed.serialize()).toString("base64");

      // Execute via Jupiter Ultra
      const result = await executeOrder(signedBase64, store.order.requestId);

      if (result.status === "Success" || result.signature) {
        setTxResult({ txid: result.signature || "" });
        // Save to database
        saveSwap({
          wallet: publicKey.toBase58(),
          signature: result.signature || "",
          input_mint: store.inputToken.address,
          input_symbol: store.inputToken.symbol,
          input_amount: store.inputAmount,
          input_logo: store.inputToken.logoURI,
          output_mint: store.outputToken.address,
          output_symbol: store.outputToken.symbol,
          output_amount: store.outputAmount,
          output_logo: store.outputToken.logoURI,
          status: "success",
        });
      } else {
        throw new Error(result.error || "Swap failed");
      }
    } catch (e: any) {
      setSwapError(e.message || "Swap failed");
    } finally {
      setSwapping(false);
    }
  }, [publicKey, signTransaction, store.order, connection]);

  const slippageOptions = [
    { label: "0.1%", value: 10 },
    { label: "0.5%", value: 50 },
    { label: "1%", value: 100 },
    { label: "3%", value: 300 },
  ];

  const priceImpact = store.order?.priceImpactPct
    ? parseFloat(store.order.priceImpactPct)
    : 0;

  return (
    <>
      <div className="w-full max-w-[480px] mx-auto animate-float" style={{ animationDuration: "8s" }}>
        {/* Main Card */}
        <div className="glass-strong rounded-3xl border border-white/[0.06] p-1.5 glow-accent">
          <div className="rounded-[22px] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Swap</h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-500 group-hover:text-white transition-colors">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>
            </div>

            {/* Slippage Settings */}
            {showSettings && (
              <div className="mb-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-xs text-gray-500 mb-2.5 font-medium">Max Slippage</div>
                <div className="flex gap-1.5">
                  {slippageOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => store.setSlippage(opt.value)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        store.slippageBps === opt.value
                          ? "btn-gradient text-black"
                          : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Token */}
            <div className="token-input-card rounded-2xl p-4 mb-1.5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">You pay</span>
                {connected && inputBalance !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">
                      Balance: {inputBalance < 0.001 ? inputBalance.toExponential(2) : inputBalance.toFixed(inputBalance < 1 ? 4 : 2)}
                    </span>
                    <button
                      onClick={handleHalf}
                      className="text-[10px] font-bold text-brand-accent/70 hover:text-brand-accent bg-brand-accent/[0.08] hover:bg-brand-accent/[0.15] px-1.5 py-0.5 rounded-md transition-all"
                    >
                      HALF
                    </button>
                    <button
                      onClick={handleMax}
                      className="text-[10px] font-bold text-brand-accent/70 hover:text-brand-accent bg-brand-accent/[0.08] hover:bg-brand-accent/[0.15] px-1.5 py-0.5 rounded-md transition-all"
                    >
                      MAX
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={store.inputAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    if (val.split(".").length > 2) return;
                    store.setInputAmount(val);
                  }}
                  className="flex-1 bg-transparent text-3xl text-white font-bold focus:outline-none placeholder-gray-700 min-w-0"
                />
                <button
                  onClick={() => setSelectingSide("input")}
                  className="token-select-btn flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shrink-0"
                >
                  {store.inputToken.logoURI && (
                    <img src={store.inputToken.logoURI} alt="" className="w-7 h-7 rounded-full" />
                  )}
                  <span className="text-white font-bold text-sm">{store.inputToken.symbol}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center -my-3 relative z-10">
              <button
                onClick={store.switchTokens}
                className="switch-btn w-10 h-10 glass rounded-xl border border-white/[0.08] flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-accent">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Output Token */}
            <div className="token-input-card rounded-2xl p-4 mt-1.5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">You receive</span>
                {connected && outputBalance !== null && (
                  <span className="text-xs text-gray-500">
                    Balance: {outputBalance < 0.001 ? outputBalance.toExponential(2) : outputBalance.toFixed(outputBalance < 1 ? 4 : 2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-3xl font-bold min-w-0">
                  {store.loading ? (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse-glow" />
                      <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse-glow" style={{ animationDelay: "0.2s" }} />
                      <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse-glow" style={{ animationDelay: "0.4s" }} />
                    </div>
                  ) : store.outputAmount ? (
                    <span className="text-white">{store.outputAmount}</span>
                  ) : (
                    <span className="text-gray-700">0</span>
                  )}
                </div>
                <button
                  onClick={() => setSelectingSide("output")}
                  className="token-select-btn flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shrink-0"
                >
                  {store.outputToken.logoURI && (
                    <img src={store.outputToken.logoURI} alt="" className="w-7 h-7 rounded-full" />
                  )}
                  <span className="text-white font-bold text-sm">{store.outputToken.symbol}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quote Details */}
            {store.order && (
              <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-2.5">
                {priceImpact > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Price Impact</span>
                    <span className={`text-xs font-semibold ${
                      priceImpact > 1 ? "text-red-400" :
                      priceImpact > 0.5 ? "text-yellow-400" : "text-brand-accent"
                    }`}>
                      {formatPriceImpact(priceImpact)}
                    </span>
                  </div>
                )}
                {store.order.routePlan && store.order.routePlan.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Route</span>
                    <div className="flex items-center gap-1.5">
                      {store.order.routePlan.map((r, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-gray-600 text-xs">→</span>}
                          <span className="text-xs font-medium text-gray-300 bg-white/[0.04] px-2 py-0.5 rounded-md">
                            {r.swapInfo.label}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Swap Type</span>
                  <span className="text-xs text-gray-300">{store.order.swapType}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {(store.error || swapError) && (
              <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/[0.08] border border-red-500/20 flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 shrink-0">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                <span className="text-red-400 text-xs">{store.error || swapError}</span>
              </div>
            )}

            {/* Success */}
            {txResult && (
              <div className="mt-4 px-4 py-3 rounded-2xl bg-brand-accent/[0.08] border border-brand-accent/20 flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-accent shrink-0">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-brand-accent text-xs">
                  Swap successful!{" "}
                  {txResult.txid && (
                    <a href={`https://solscan.io/tx/${txResult.txid}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                      View on Solscan →
                    </a>
                  )}
                </span>
              </div>
            )}

            {/* Swap Button */}
            <div className="mt-5">
              {!connected ? (
                <button
                  onClick={() => {
                    // Trigger wallet modal
                    const btn = document.querySelector(".wallet-adapter-button") as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                  className="w-full py-4 rounded-2xl font-bold text-base btn-gradient text-black group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 7V4a1 1 0 00-1-1H5a2 2 0 00-2 2v14a2 2 0 002 2h13a1 1 0 001-1v-3" />
                      <path d="M16 7h3a2 2 0 012 2v6a2 2 0 01-2 2h-3" />
                      <circle cx="16" cy="12" r="1" />
                    </svg>
                    Connect Wallet
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/0 via-white/10 to-brand-purple/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
              ) : (
                <button
                  onClick={handleSwap}
                  disabled={!store.order?.transaction || swapping || store.loading}
                  className="w-full py-4 rounded-2xl font-bold text-base btn-gradient text-black"
                >
                  {swapping ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Swapping...
                    </span>
                  ) : store.loading ? (
                    "Fetching best price..."
                  ) : !store.inputAmount ? (
                    "Enter an amount"
                  ) : !store.order ? (
                    "Get quote"
                  ) : !store.order.transaction ? (
                    "Connect wallet to swap"
                  ) : (
                    "Swap"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Powered by */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Powered by Jupiter Ultra • Solana
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
