"use client";
import React from "react";
import { useSwapStore } from "@/hooks/useSwapStore";

export default function QuotesPanel() {
  const { quotes, selectedQuoteIndex, selectQuote, outputToken, loading, quotesLoading } = useSwapStore();

  if (loading && quotes.length === 0) return null;
  if (!loading && quotes.length === 0) return null;

  return (
    <div className="w-full max-w-[480px] mx-auto mt-3">
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Quotes</h3>
          <span className="text-xs text-brand-muted flex items-center gap-1.5">
            {quotes.length} source{quotes.length !== 1 ? "s" : ""}
            {quotesLoading && (
              <span className="flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-brand-gold animate-pulse" />
                <span className="w-1 h-1 rounded-full bg-brand-gold animate-pulse" style={{ animationDelay: "0.2s" }} />
              </span>
            )}
          </span>
        </div>

        <div className="space-y-2">
          {quotes.map((quote, i) => {
            const outNum = Number(quote.outputAmount) / Math.pow(10, outputToken.decimals);
            const isSelected = i === selectedQuoteIndex;

            return (
              <button
                key={`${quote.name}-${i}`}
                onClick={() => selectQuote(i)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                  isSelected
                    ? "bg-brand-gold/10 border border-brand-gold/30"
                    : "bg-brand-dark/60 border border-brand-border hover:border-brand-border/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {quote.name}
                      </span>
                      {quote.isBest && (
                        <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded">
                          Best Price
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-brand-muted mt-0.5">
                      {quote.routeLabel}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {outNum < 0.001
                      ? outNum.toExponential(2)
                      : outNum < 1
                      ? outNum.toFixed(6)
                      : outNum.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    <span className="text-brand-muted ml-1 text-xs">{outputToken.symbol}</span>
                  </div>
                  {quote.isBest && quote.savings > 0 && (
                    <span className="text-xs text-brand-green font-medium">
                      +${quote.savings.toFixed(4)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
