import { QuoteResponse, Token } from "@/types/token";

const JUPITER_API = "https://quote-api.jup.ag/v6";
const TOKEN_LIST_URL = "https://token.jup.ag/strict";

let tokenCache: Token[] | null = null;

export async function getTokenList(): Promise<Token[]> {
  if (tokenCache) return tokenCache;

  const res = await fetch(TOKEN_LIST_URL);
  if (!res.ok) throw new Error("Failed to fetch token list");
  tokenCache = await res.json();
  return tokenCache!;
}

export async function searchTokens(query: string): Promise<Token[]> {
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

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: string, // in lamports / smallest unit
  slippageBps: number = 50
): Promise<QuoteResponse> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps.toString(),
  });

  const res = await fetch(`${JUPITER_API}/quote?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get quote");
  }
  return res.json();
}

export async function getSwapTransaction(
  quoteResponse: QuoteResponse,
  userPublicKey: string
): Promise<string> {
  const res = await fetch(`${JUPITER_API}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get swap transaction");
  }

  const { swapTransaction } = await res.json();
  return swapTransaction;
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
