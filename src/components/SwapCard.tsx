"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useSwapStore } from "@/hooks/useSwapStore";
import { executeOrder } from "@/lib/jupiter";
import { formatPriceImpact } from "@/lib/format";
import TokenSelector from "./TokenSelector";
import SettingsModal from "./SettingsModal";
import QuotesPanel from "./QuotesPanel";
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

  const maxInput = inputBalance !== null
    ? (store.inputToken.address === SOL_MINT ? Math.max(0, inputBalance - 0.01) : inputBalance)
    : null;

  const handleHalf = () => {
    if (maxInput !== null) store.setInputAmount(maxInput > 0 ? (maxInput / 2).toString() : "0");
  };
  const handleMax = () => {
    if (maxInput !== null) store.setInputAmount(maxInput > 0 ? maxInput.toString() : "0");
  };

  useEffect(() => {
    if (!store.inputAmount || parseFloat(store.inputAmount) <= 0) return;
    const taker = publicKey?.toBase58();
    const timer = setTimeout(() => store.fetchOrder(taker), 300);
    return () => clearTimeout(timer);
  }, [store.inputAmount, store.inputToken.address, store.outputToken.address, publicKey]);

  const handleSwap = useCallback(async () => {
    if (!publicKey || !signTransaction || !store.order?.transaction) return;
    setSwapping(true);
    setSwapError(null);
    setTxResult(null);
    try {
      const txBuf = Buffer.from(store.order.transaction, "base64");
      const tx = VersionedTransaction.deserialize(txBuf);
      const signed = await signTransaction(tx);
      const signedBase64 = Buffer.from(signed.serialize()).toString("base64");
      const result = await executeOrder(signedBase64, store.order.requestId);
      if (result.status === "Success" || result.signature) {
        setTxResult({ txid: result.signature || "" });
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

  // Exchange rate
  const exchangeRate =
    store.inputAmount && store.outputAmount && parseFloat(store.inputAmount) > 0
      ? (parseFloat(store.outputAmount) / parseFloat(store.inputAmount)).toFixed(
          store.outputToken.decimals > 4 ? 6 : 4
        )
      : null;

  const priceImpact = store.order?.priceImpactPct ? parseFloat(store.order.priceImpactPct) : 0;

  const MODES = [
    { key: "instant" as const, label: "Instant", badge: null },
    { key: "limit" as const, label: "Limit", badge: "Beta" },
    { key: "prime" as const, label: "Prime", badge: "✨" },
  ];

  return (
    <>
      <div className="w-full max-w-[480px] mx-auto">
        <div className="bg-brand-card border border-brand-border rounded-2xl glow-gold">
          <div className="p-5">
            {/* Mode tabs + Settings */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1 bg-brand-dark rounded-lg p-1">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => store.setMode(m.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                      store.mode === m.key
                        ? "bg-brand-gold/15 text-brand-gold"
                        : "text-brand-muted hover:text-white"
                    }`}
                  >
                    {m.label}
                    {m.badge && (
                      <span className="text-[9px] bg-brand-gold/20 text-brand-gold px-1 py-0.5 rounded">
                        {m.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-brand-muted hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>
            </div>

            {/* Coming soon for non-instant */}
            {store.mode !== "instant" ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">{store.mode === "limit" ? "📊" : "✨"}</div>
                <div className="text-white font-semibold mb-1">Coming Soon</div>
                <div className="text-brand-muted text-sm">
                  {store.mode === "limit" ? "Limit orders" : "Prime trading"} will be available soon.
                </div>
              </div>
            ) : (
              <>
                {/* Sell panel */}
                <div className="token-input-card rounded-xl p-4 mb-1.5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-brand-muted">Sell</span>
                    {connected && inputBalance !== null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-brand-muted">
                          Balance: {inputBalance < 0.001 ? inputBalance.toExponential(2) : inputBalance.toFixed(inputBalance < 1 ? 4 : 2)}
                        </span>
                        <button onClick={handleHalf} className="text-[10px] font-bold text-brand-gold hover:text-brand-gold-dark bg-brand-gold/10 px-1.5 py-0.5 rounded transition-all">
                          HALF
                        </button>
                        <button onClick={handleMax} className="text-[10px] font-bold text-brand-gold hover:text-brand-gold-dark bg-brand-gold/10 px-1.5 py-0.5 rounded transition-all">
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
                      className="token-select-btn flex items-center gap-2 rounded-xl px-3 py-2.5 shrink-0"
                    >
                      {store.inputToken.logoURI && (
                        <img src={store.inputToken.logoURI} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <span className="text-white font-bold text-sm">{store.inputToken.symbol}</span>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-brand-muted">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Switch */}
                <div className="flex justify-center -my-3 relative z-10">
                  <button
                    onClick={store.switchTokens}
                    className="w-9 h-9 bg-brand-card border border-brand-border rounded-lg flex items-center justify-center hover:border-brand-gold/50 hover:bg-brand-gold/5 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-brand-gold">
                      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>

                {/* Buy panel */}
                <div className="token-input-card rounded-xl p-4 mt-1.5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-brand-muted">Buy</span>
                    {connected && outputBalance !== null && (
                      <span className="text-xs text-brand-muted">
                        Balance: {outputBalance < 0.001 ? outputBalance.toExponential(2) : outputBalance.toFixed(outputBalance < 1 ? 4 : 2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-3xl font-bold min-w-0">
                      {store.loading ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                          <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" style={{ animationDelay: "0.4s" }} />
                        </div>
                      ) : store.outputAmount ? (
                        <span className="text-white">{store.outputAmount}</span>
                      ) : (
                        <span className="text-gray-700">0</span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectingSide("output")}
                      className="token-select-btn flex items-center gap-2 rounded-xl px-3 py-2.5 shrink-0"
                    >
                      {store.outputToken.logoURI && (
                        <img src={store.outputToken.logoURI} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <span className="text-white font-bold text-sm">{store.outputToken.symbol}</span>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-brand-muted">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Exchange rate */}
                {exchangeRate && (
                  <div className="mt-3 text-center text-xs text-brand-muted">
                    1 {store.inputToken.symbol} ≈ {exchangeRate} {store.outputToken.symbol}
                  </div>
                )}

                {/* Quote details */}
                {store.order && (
                  <div className="mt-3 p-3 rounded-xl bg-brand-dark/60 border border-brand-border space-y-2">
                    {priceImpact > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-brand-muted">Price Impact</span>
                        <span className={`text-xs font-semibold ${
                          priceImpact > 1 ? "text-brand-red" : priceImpact > 0.5 ? "text-yellow-400" : "text-brand-green"
                        }`}>
                          {formatPriceImpact(priceImpact)}
                        </span>
                      </div>
                    )}
                    {store.order.routePlan && store.order.routePlan.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-brand-muted">Route</span>
                        <div className="flex items-center gap-1">
                          {store.order.routePlan.map((r, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-gray-600 text-xs">→</span>}
                              <span className="text-xs font-medium text-gray-300 bg-white/[0.04] px-1.5 py-0.5 rounded">
                                {r.swapInfo.label}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Errors / Success */}
                {(store.error || swapError) && (
                  <div className="mt-3 px-3 py-2.5 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs flex items-center gap-2">
                    <span>⚠</span>
                    <span>{store.error || swapError}</span>
                  </div>
                )}
                {txResult && (
                  <div className="mt-3 px-3 py-2.5 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs flex items-center gap-2">
                    <span>✓</span>
                    <span>
                      Swap successful!{" "}
                      {txResult.txid && (
                        <a href={`https://solscan.io/tx/${txResult.txid}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                          View on Solscan →
                        </a>
                      )}
                    </span>
                  </div>
                )}

                {/* Swap button */}
                <div className="mt-4">
                  {!connected ? (
                    <button
                      onClick={() => {
                        const btn = document.querySelector(".wallet-adapter-button") as HTMLButtonElement;
                        if (btn) btn.click();
                      }}
                      className="w-full py-3.5 rounded-xl btn-gold text-base"
                    >
                      Connect Wallet
                    </button>
                  ) : (
                    <button
                      onClick={handleSwap}
                      disabled={!store.order?.transaction || swapping || store.loading}
                      className="w-full py-3.5 rounded-xl btn-gold text-base"
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
              </>
            )}
          </div>
        </div>

        {/* Quotes Panel */}
        {store.mode === "instant" && <QuotesPanel />}

        {/* Powered by */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-brand-muted">
          ⚡ Powered by Jupiter Ultra + Raydium • Solana
        </div>
      </div>

      {/* Modals */}
      {selectingSide && (
        <TokenSelector
          onSelect={(token) => {
            if (selectingSide === "input") store.setInputToken(token);
            else store.setOutputToken(token);
          }}
          onClose={() => setSelectingSide(null)}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
