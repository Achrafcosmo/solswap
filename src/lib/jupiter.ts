import { Token } from "@/types/token";

const JUPITER_API = "https://api.jup.ag";
const TOKEN_LIST_URL = "https://tokens.jup.ag/tokens?tags=verified";

let tokenCache: Token[] | null = null;

export async function getTokenList(): Promise<Token[]> {
  if (tokenCache) return tokenCache;
  const res = await fetch(TOKEN_LIST_URL);
  if (!res.ok) throw new Error("Failed to fetch token list");
  tokenCache = await res.json();
  return tokenCache!;
}

export async function searchTokens(query: string): Promise<Token[]> {
  // Try Jupiter search API first
  try {
    const res = await fetch(
      `${JUPITER_API}/ultra/v1/search?query=${encodeURIComponent(query)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data) && data.length > 0) {
        return data.slice(0, 20).map((t: any) => ({
          address: t.address || t.mint,
          symbol: t.symbol,
          name: t.name,
          decimals: t.decimals,
          logoURI: t.logoURI || t.logo,
        }));
      }
    }
  } catch {}

  // Fallback to local list search
  const tokens = await getTokenList();
  const q = query.toLowerCase();
  return tokens
    .filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address === query
    )
    .slice(0, 20);
}

export interface OrderResponse {
  requestId: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold?: string;
  swapType: string;
  slippageBps: number;
  priceImpactPct?: string;
  routePlan?: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  transaction?: string; // base64 encoded transaction
}

export async function getOrder(
  inputMint: string,
  outputMint: string,
  amount: string,
  taker?: string
): Promise<OrderResponse> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
  });
  if (taker) params.set("taker", taker);

  const res = await fetch(`${JUPITER_API}/ultra/v1/order?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to get order");
  }
  return res.json();
}

export async function executeOrder(
  signedTransaction: string,
  requestId: string
): Promise<{ status: string; signature?: string; error?: string }> {
  const res = await fetch(`${JUPITER_API}/ultra/v1/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      signedTransaction,
      requestId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to execute swap");
  }
  return res.json();
}

// Well-known tokens for default display
export const POPULAR_TOKENS: Token[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png",
  },
];
