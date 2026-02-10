"use client";
import { create } from "zustand";
import { Token } from "@/types/token";
import { POPULAR_TOKENS, getOrder, OrderResponse } from "@/lib/jupiter";
import { toSmallestUnit } from "@/lib/format";
import {
  AggregatorQuote,
  fetchJupiterQuote,
  fetchRaydiumQuote,
  fetchOkxQuote,
} from "@/lib/aggregators";

interface SwapStore {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  outputAmount: string;
  slippageBps: number;
  slippageStable: number;
  priorityFee: "auto" | number;
  order: OrderResponse | null;
  loading: boolean;
  error: string | null;
  quotes: AggregatorQuote[];
  quotesLoading: boolean;
  selectedQuoteIndex: number;
  mode: "instant" | "limit" | "prime";

  setInputToken: (token: Token) => void;
  setOutputToken: (token: Token) => void;
  setInputAmount: (amount: string) => void;
  setSlippage: (bps: number) => void;
  setSlippageStable: (bps: number) => void;
  setPriorityFee: (fee: "auto" | number) => void;
  switchTokens: () => void;
  fetchOrder: (taker?: string) => Promise<void>;
  selectQuote: (index: number) => void;
  setMode: (mode: "instant" | "limit" | "prime") => void;
  clearError: () => void;
}

function rankQuotes(quotes: AggregatorQuote[]): AggregatorQuote[] {
  if (quotes.length === 0) return [];
  const sorted = [...quotes].sort(
    (a, b) => Number(b.outputAmount) - Number(a.outputAmount)
  );
  const worst = Number(sorted[sorted.length - 1].outputAmount);
  sorted.forEach((q, i) => {
    q.isBest = i === 0;
    // savings as USD estimate (outputAmount is raw, approximate with decimals)
    q.savings = 0;
  });
  return sorted;
}

export const useSwapStore = create<SwapStore>((set, get) => ({
  inputToken: POPULAR_TOKENS[0],
  outputToken: POPULAR_TOKENS[1],
  inputAmount: "",
  outputAmount: "",
  slippageBps: 100,
  slippageStable: 30,
  priorityFee: "auto",
  order: null,
  loading: false,
  error: null,
  quotes: [],
  quotesLoading: false,
  selectedQuoteIndex: 0,
  mode: "instant",

  setInputToken: (token) => {
    set({ inputToken: token, order: null, outputAmount: "", quotes: [], selectedQuoteIndex: 0 });
  },

  setOutputToken: (token) => {
    set({ outputToken: token, order: null, outputAmount: "", quotes: [], selectedQuoteIndex: 0 });
  },

  setInputAmount: (amount) => {
    set({ inputAmount: amount, outputAmount: "", order: null, quotes: [], selectedQuoteIndex: 0 });
  },

  setSlippage: (bps) => set({ slippageBps: bps }),
  setSlippageStable: (bps) => set({ slippageStable: bps }),
  setPriorityFee: (fee) => set({ priorityFee: fee }),

  switchTokens: () => {
    const { inputToken, outputToken } = get();
    set({
      inputToken: outputToken,
      outputToken: inputToken,
      inputAmount: "",
      outputAmount: "",
      order: null,
      quotes: [],
      selectedQuoteIndex: 0,
    });
  },

  fetchOrder: async (taker?: string) => {
    const { inputToken, outputToken, inputAmount } = get();
    if (!inputAmount || parseFloat(inputAmount) <= 0) return;

    const lamports = toSmallestUnit(inputAmount, inputToken.decimals);

    // Step 1: Fetch Jupiter order FAST — show result immediately
    set({ loading: true, error: null, quotesLoading: true });
    try {
      const order = await getOrder(
        inputToken.address,
        outputToken.address,
        lamports,
        taker
      );

      const outNum = (
        Number(order.outAmount) / Math.pow(10, outputToken.decimals)
      ).toFixed(outputToken.decimals > 4 ? 6 : outputToken.decimals);

      // Show Jupiter result right away
      set({ order, outputAmount: outNum, loading: false });
    } catch (e: any) {
      set({ error: e.message || "Failed to get quote", loading: false, quotesLoading: false });
      return;
    }

    // Step 2: Fetch all quotes in background (including Jupiter again for comparison)
    try {
      const jupPromise = fetchJupiterQuote(
        inputToken.address,
        outputToken.address,
        lamports,
        taker
      );
      const rayPromise = fetchRaydiumQuote(
        inputToken.address,
        outputToken.address,
        lamports
      );
      const okxPromise = fetchOkxQuote(
        inputToken.address,
        outputToken.address,
        lamports
      );

      // As each resolves, update the quotes list
      const allQuotes: AggregatorQuote[] = [];

      const jupResult = await jupPromise;
      allQuotes.push(...jupResult.quotes);
      set({ quotes: rankQuotes([...allQuotes]), quotesLoading: true });

      // Race Raydium and OKX — add as they come in
      const remaining = await Promise.allSettled([rayPromise, okxPromise]);

      if (remaining[0].status === "fulfilled" && remaining[0].value) {
        allQuotes.push(remaining[0].value);
      }
      if (remaining[1].status === "fulfilled" && remaining[1].value) {
        allQuotes.push(remaining[1].value);
      }

      // Calculate USD savings
      const outputDecimals = outputToken.decimals;
      for (const q of allQuotes) {
        q.outputUsd = Number(q.outputAmount) / Math.pow(10, outputDecimals);
      }
      const ranked = rankQuotes(allQuotes);
      if (ranked.length > 1) {
        const worst = ranked[ranked.length - 1].outputUsd;
        ranked.forEach((q) => {
          q.savings = q.outputUsd - worst;
        });
      }

      set({ quotes: ranked, quotesLoading: false, selectedQuoteIndex: 0 });
    } catch {
      set({ quotesLoading: false });
    }
  },

  selectQuote: (index) => {
    const { quotes, outputToken } = get();
    if (index >= 0 && index < quotes.length) {
      const q = quotes[index];
      const outNum = (
        Number(q.outputAmount) / Math.pow(10, outputToken.decimals)
      ).toFixed(outputToken.decimals > 4 ? 6 : outputToken.decimals);
      set({ selectedQuoteIndex: index, outputAmount: outNum });
    }
  },

  setMode: (mode) => set({ mode }),
  clearError: () => set({ error: null }),
}));
