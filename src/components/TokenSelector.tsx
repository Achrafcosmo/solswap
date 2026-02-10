"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Token } from "@/types/token";
import { searchTokens, POPULAR_TOKENS } from "@/lib/jupiter";

interface Props {
  onSelect: (token: Token) => void;
  onClose: () => void;
}

export default function TokenSelector({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Token[]>(POPULAR_TOKENS);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(POPULAR_TOKENS);
      return;
    }
    setSearching(true);
    try {
      const tokens = await searchTokens(q);
      setResults(tokens);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md glass-strong border border-white/[0.06] rounded-3xl p-6 shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">Select Token</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-500">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or paste address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/30 transition-colors"
          />
        </div>

        {/* Popular tags */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {POPULAR_TOKENS.map((token) => (
            <button
              key={token.address}
              onClick={() => { onSelect(token); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-brand-accent/30 hover:bg-white/[0.06] transition-all text-xs"
            >
              {token.logoURI && (
                <img src={token.logoURI} alt="" className="w-4 h-4 rounded-full" />
              )}
              <span className="text-gray-300 font-medium">{token.symbol}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] mb-3" />

        {/* Results */}
        <div className="max-h-72 overflow-y-auto space-y-0.5 -mx-2 px-2">
          {searching && (
            <div className="text-center py-8">
              <div className="flex justify-center gap-1 mb-2">
                <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse-glow" />
                <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse-glow" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse-glow" style={{ animationDelay: "0.4s" }} />
              </div>
              <span className="text-gray-600 text-xs">Searching tokens...</span>
            </div>
          )}
          {!searching && results.length === 0 && (
            <div className="text-center text-gray-600 py-8 text-sm">
              No tokens found
            </div>
          )}
          {!searching &&
            results.map((token) => (
              <button
                key={token.address}
                onClick={() => { onSelect(token); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-all group"
              >
                {token.logoURI ? (
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-9 h-9 rounded-full ring-1 ring-white/10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="text-left flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm">{token.symbol}</div>
                  <div className="text-gray-600 text-xs truncate">{token.name}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
