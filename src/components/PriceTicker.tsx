"use client";
import React, { useEffect, useState } from "react";

interface TickerToken {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
  logo: string;
}

const TOKEN_CONFIG: { id: string; symbol: string; logo: string }[] = [
  { id: "solana", symbol: "SOL", logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" },
  { id: "bitcoin", symbol: "BTC", logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
  { id: "ethereum", symbol: "ETH", logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  { id: "dogecoin", symbol: "DOGE", logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
  { id: "bonk", symbol: "BONK", logo: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I" },
  { id: "jupiter-exchange-solana", symbol: "JUP", logo: "https://static.jup.ag/jup/icon.png" },
  { id: "raydium", symbol: "RAY", logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png" },
  { id: "jito-governance-token", symbol: "JTO", logo: "https://metadata.jito.network/token/jto/icon.png" },
];

export default function PriceTicker() {
  const [tokens, setTokens] = useState<TickerToken[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = TOKEN_CONFIG.map((t) => t.id).join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await res.json();
        const items: TickerToken[] = TOKEN_CONFIG.map((t) => ({
          id: t.id,
          symbol: t.symbol,
          price: data[t.id]?.usd ?? 0,
          change24h: data[t.id]?.usd_24h_change ?? 0,
          logo: t.logo,
        }));
        setTokens(items);
      } catch {}
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 120000);
    return () => clearInterval(interval);
  }, []);

  if (tokens.length === 0) return null;

  const tickerItems = [...tokens, ...tokens]; // duplicate for seamless loop

  return (
    <div className="w-full bg-brand-dark border-b border-brand-border overflow-hidden">
      <div className="flex animate-ticker-scroll whitespace-nowrap py-2.5">
        {tickerItems.map((token, i) => (
          <div
            key={`${token.id}-${i}`}
            className="inline-flex items-center gap-2 px-5 text-sm"
          >
            <img
              src={token.logo}
              alt={token.symbol}
              className="w-4 h-4 rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-white font-medium">{token.symbol}</span>
            <span className="text-brand-muted">
              ${token.price < 0.01 ? token.price.toFixed(6) : token.price < 1 ? token.price.toFixed(4) : token.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span
              className={`font-medium ${
                token.change24h >= 0 ? "text-brand-green" : "text-brand-red"
              }`}
            >
              {token.change24h >= 0 ? "+" : ""}
              {token.change24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
