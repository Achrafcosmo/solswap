"use client";
import { create } from "zustand";
import { Token } from "@/types/token";
import { POPULAR_TOKENS, getOrder, OrderResponse } from "@/lib/jupiter";
import { toSmallestUnit } from "@/lib/format";
import { AggregatorQuote, fetchAllQuotes } from "@/lib/aggregators";

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

    set({ loading: true, error: null });
    try {
      const lamports = toSmallestUnit(inputAmount, inputToken.decimals);

      // Fetch Jupiter order (for transaction) and all quotes in parallel
      const [order, quotes] = await Promise.all([
        getOrder(inputToken.address, outputToken.address, lamports, taker),
        fetchAllQuotes(
          inputToken.address,
          outputToken.address,
          lamports,
          outputToken.decimals,
          1, // USD price placeholder — we show raw amounts
          taker
        ),
      ]);

      const outNum = (
        Number(order.outAmount) / Math.pow(10, outputToken.decimals)
      ).toFixed(outputToken.decimals > 4 ? 6 : outputToken.decimals);

      set({ order, outputAmount: outNum, loading: false, quotes, selectedQuoteIndex: 0 });
    } catch (e: any) {
      set({ error: e.message || "Failed to get quote", loading: false });
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
