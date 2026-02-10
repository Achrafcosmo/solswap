// Token metadata cache — resolves mint addresses to symbols/logos
const TOKEN_LIST_URL = "https://tokens.jup.ag/tokens?tags=verified";

interface TokenMeta {
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
}

let cache: Map<string, TokenMeta> | null = null;
let fetchPromise: Promise<void> | null = null;

async function loadCache(): Promise<void> {
  if (cache) return;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    cache = new Map();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(TOKEN_LIST_URL, { signal: controller.signal });
      clearTimeout(timeout);
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
    } catch (e) {
      console.warn("Failed to load token list:", e);
    }
  })();

  return fetchPromise;
}

// Known tokens as fallback
const KNOWN: Record<string, TokenMeta> = {
  "So11111111111111111111111111111111111111112": {
    symbol: "SOL",
    name: "Solana",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    decimals: 9,
  },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
    symbol: "USDC",
    name: "USD Coin",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    decimals: 6,
  },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": {
    symbol: "USDT",
    name: "Tether USD",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png",
    decimals: 6,
  },
};

export async function getTokenMeta(mint: string): Promise<TokenMeta> {
  // Check known first
  if (KNOWN[mint]) return KNOWN[mint];

  // Try cache
  await loadCache();
  if (cache?.has(mint)) return cache.get(mint)!;

  return {
    symbol: mint.slice(0, 4) + "..." + mint.slice(-4),
    name: "Unknown Token",
    decimals: 0,
  };
}
