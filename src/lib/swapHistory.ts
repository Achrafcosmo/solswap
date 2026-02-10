export interface LocalSwap {
  signature: string;
  timestamp: number;
  inputMint: string;
  inputSymbol: string;
  inputAmount: string;
  inputLogoURI?: string;
  outputMint: string;
  outputSymbol: string;
  outputAmount: string;
  outputLogoURI?: string;
  wallet: string;
  status: "success" | "failed";
}

const STORAGE_KEY = "solswap_history";

export function saveSwap(swap: LocalSwap): void {
  const history = getSwaps(swap.wallet);
  history.unshift(swap);
  // Keep max 100
  if (history.length > 100) history.pop();
  try {
    localStorage.setItem(`${STORAGE_KEY}_${swap.wallet}`, JSON.stringify(history));
  } catch {}
}

export function getSwaps(wallet: string): LocalSwap[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${wallet}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearSwaps(wallet: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${wallet}`);
  } catch {}
}
