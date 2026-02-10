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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Select Token</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name or paste address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent mb-4"
        />

        <div className="max-h-72 overflow-y-auto space-y-1">
          {searching && (
            <div className="text-center text-gray-500 py-4">Searching...</div>
          )}
          {!searching && results.length === 0 && (
            <div className="text-center text-gray-500 py-4">No tokens found</div>
          )}
          {!searching &&
            results.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-dark transition-colors"
              >
                {token.logoURI ? (
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center text-xs font-bold">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-white font-medium">{token.symbol}</div>
                  <div className="text-gray-500 text-xs">{token.name}</div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
