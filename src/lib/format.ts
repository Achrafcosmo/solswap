export function formatAmount(amount: string, decimals: number): string {
  const num = Number(amount) / Math.pow(10, decimals);
  if (num === 0) return "0";
  if (num < 0.001) return num.toExponential(2);
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  if (num < 1_000_000) return `${(num / 1000).toFixed(2)}K`;
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  return `${(num / 1_000_000_000).toFixed(2)}B`;
}

export function toSmallestUnit(amount: string, decimals: number): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  return Math.floor(num * Math.pow(10, decimals)).toString();
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatPriceImpact(pct: number): string {
  if (pct < 0.01) return "<0.01%";
  return `${pct.toFixed(2)}%`;
}
