"use client";
import { create } from "zustand";
import { Token, QuoteResponse } from "@/types/token";
import { POPULAR_TOKENS, getQuote } from "@/lib/jupiter";
import { toSmallestUnit } from "@/lib/format";

interface SwapStore {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  outputAmount: string;
  slippageBps: number;
  quote: QuoteResponse | null;
  loading: boolean;
  error: string | null;

  setInputToken: (token: Token) => void;
  setOutputToken: (token: Token) => void;
  setInputAmount: (amount: string) => void;
  setSlippage: (bps: number) => void;
  switchTokens: () => void;
  fetchQuote: () => Promise<void>;
  clearError: () => void;
}

export const useSwapStore = create<SwapStore>((set, get) => ({
  inputToken: POPULAR_TOKENS[0], // SOL
  outputToken: POPULAR_TOKENS[1], // USDC
  inputAmount: "",
  outputAmount: "",
  slippageBps: 50,
  quote: null,
  loading: false,
  error: null,

  setInputToken: (token) => {
    set({ inputToken: token, quote: null, outputAmount: "" });
    if (get().inputAmount) get().fetchQuote();
  },

  setOutputToken: (token) => {
    set({ outputToken: token, quote: null, outputAmount: "" });
    if (get().inputAmount) get().fetchQuote();
  },

  setInputAmount: (amount) => {
    set({ inputAmount: amount, outputAmount: "", quote: null });
  },

  setSlippage: (bps) => set({ slippageBps: bps }),

  switchTokens: () => {
    const { inputToken, outputToken, inputAmount } = get();
    set({
      inputToken: outputToken,
      outputToken: inputToken,
      inputAmount: "",
      outputAmount: "",
      quote: null,
    });
  },

  fetchQuote: async () => {
    const { inputToken, outputToken, inputAmount, slippageBps } = get();
    if (!inputAmount || parseFloat(inputAmount) <= 0) return;

    set({ loading: true, error: null });
    try {
      const lamports = toSmallestUnit(inputAmount, inputToken.decimals);
      const quote = await getQuote(
        inputToken.address,
        outputToken.address,
        lamports,
        slippageBps
      );
      const outNum = (
        Number(quote.outAmount) / Math.pow(10, outputToken.decimals)
      ).toFixed(outputToken.decimals > 4 ? 6 : outputToken.decimals);
      set({ quote, outputAmount: outNum, loading: false });
    } catch (e: any) {
      set({ error: e.message || "Failed to get quote", loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
