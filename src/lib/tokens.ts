// Token metadata cache — resolves mint addresses to symbols/logos
const TOKEN_LIST_URL = "https://tokens.jup.ag/tokens?tags=verified";

interface TokenMeta {
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
}

let cache: Map<string, TokenMeta> | null = null;

export async function getTokenMeta(mint: string): Promise<TokenMeta> {
  if (!cache) {
    cache = new Map();
    try {
      const res = await fetch(TOKEN_LIST_URL);
      if (res.ok) {
        const tokens: any[] = await res.json();
        for (const t of tokens) {
          cache.set(t.address, {
            symbol: t.symbol,
            name: t.name,
            logoURI: t.logoURI,
            decimals: t.decimals,
          });
        }
      }
    } catch {}
  }

  // Known fallbacks
  if (mint === "So11111111111111111111111111111111111111112") {
    return {
      symbol: "SOL",
      name: "Solana",
      logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      decimals: 9,
    };
  }

  return (
    cache.get(mint) || {
      symbol: mint.slice(0, 4) + "...",
      name: "Unknown",
      decimals: 0,
    }
  );
}
