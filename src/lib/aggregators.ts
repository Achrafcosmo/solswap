export interface AggregatorQuote {
  name: string;
  outputAmount: string;
  outputUsd: number;
  routeLabel: string;
  transaction?: string;
  requestId?: string;
  isBest: boolean;
  savings: number;
}

const JUP_API_KEY = "3e17efcc-68df-4f18-8082-0f938e9e9f51";

export async function fetchJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  taker?: string
): Promise<{ quotes: AggregatorQuote[]; raw: any }> {
  const params = new URLSearchParams({ inputMint, outputMint, amount });
  if (taker) params.set("taker", taker);

  const headers: Record<string, string> = {};
  if (JUP_API_KEY) headers["x-api-key"] = JUP_API_KEY;

  const res = await fetch(`https://api.jup.ag/ultra/v1/order?${params}`, { headers });
  if (!res.ok) throw new Error("Jupiter quote failed");
  const data = await res.json();

  const quotes: AggregatorQuote[] = [];

  // Check if route includes OKX
  const routePlan = data.routePlan || [];
  const labels = routePlan.map((r: any) => r.swapInfo?.label || "");
  const hasOkx = labels.some((l: string) => l.toLowerCase().includes("okx"));

  const mainLabel = labels.filter((l: string) => !l.toLowerCase().includes("okx")).join(" → ") || "Jupiter";

  quotes.push({
    name: hasOkx ? "Jupiter + OKX" : "Jupiter",
    outputAmount: data.outAmount || "0",
    outputUsd: 0,
    routeLabel: labels.join(" → ") || "Direct",
    transaction: data.transaction,
    requestId: data.requestId,
    isBest: false,
    savings: 0,
  });

  return { quotes, raw: data };
}

export async function fetchRaydiumQuote(
  inputMint: string,
  outputMint: string,
  amount: string
): Promise<AggregatorQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps: "50",
      txVersion: "V0",
    });

    const res = await fetch(
      `https://transaction-v1.raydium.io/compute/swap-base-in?${params}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;

    const routeInfo = data.data?.routePlan?.map((r: any) => r.poolId?.slice(0, 8)).join(" → ") || "Raydium Pool";

    return {
      name: "Raydium",
      outputAmount: data.data?.outputAmount || "0",
      outputUsd: 0,
      routeLabel: routeInfo,
      isBest: false,
      savings: 0,
    };
  } catch {
    return null;
  }
}

export async function fetchAllQuotes(
  inputMint: string,
  outputMint: string,
  amount: string,
  outputDecimals: number,
  outputPriceUsd: number,
  taker?: string
): Promise<AggregatorQuote[]> {
  const results = await Promise.allSettled([
    fetchJupiterQuote(inputMint, outputMint, amount, taker),
    fetchRaydiumQuote(inputMint, outputMint, amount),
  ]);

  const quotes: AggregatorQuote[] = [];

  if (results[0].status === "fulfilled") {
    const jupResult = results[0].value;
    quotes.push(...jupResult.quotes);
  }

  if (results[1].status === "fulfilled" && results[1].value) {
    quotes.push(results[1].value);
  }

  if (quotes.length === 0) return [];

  // Calculate USD values
  for (const q of quotes) {
    const outNum = Number(q.outputAmount) / Math.pow(10, outputDecimals);
    q.outputUsd = outNum * outputPriceUsd;
  }

  // Sort by output amount descending
  quotes.sort((a, b) => Number(b.outputAmount) - Number(a.outputAmount));

  // Mark best and calculate savings
  const worstUsd = quotes[quotes.length - 1].outputUsd;
  quotes.forEach((q, i) => {
    q.isBest = i === 0;
    q.savings = q.outputUsd - worstUsd;
  });

  return quotes;
}
