"use client";
import { create } from "zustand";
import { Token, } from "@/types/token";
import { POPULAR_TOKENS, getOrder, OrderResponse } from "@/lib/jupiter";
import { toSmallestUnit } from "@/lib/format";

interface SwapStore {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  outputAmount: string;
  slippageBps: number;
  order: OrderResponse | null;
  loading: boolean;
  error: string | null;

  setInputToken: (token: Token) => void;
  setOutputToken: (token: Token) => void;
  setInputAmount: (amount: string) => void;
  setSlippage: (bps: number) => void;
  switchTokens: () => void;
  fetchOrder: (taker?: string) => Promise<void>;
  clearError: () => void;
}

export const useSwapStore = create<SwapStore>((set, get) => ({
  inputToken: POPULAR_TOKENS[0], // SOL
  outputToken: POPULAR_TOKENS[1], // USDC
  inputAmount: "",
  outputAmount: "",
  slippageBps: 50,
  order: null,
  loading: false,
  error: null,

  setInputToken: (token) => {
    set({ inputToken: token, order: null, outputAmount: "" });
  },

  setOutputToken: (token) => {
    set({ outputToken: token, order: null, outputAmount: "" });
  },

  setInputAmount: (amount) => {
    set({ inputAmount: amount, outputAmount: "", order: null });
  },

  setSlippage: (bps) => set({ slippageBps: bps }),

  switchTokens: () => {
    const { inputToken, outputToken } = get();
    set({
      inputToken: outputToken,
      outputToken: inputToken,
      inputAmount: "",
      outputAmount: "",
      order: null,
    });
  },

  fetchOrder: async (taker?: string) => {
    const { inputToken, outputToken, inputAmount } = get();
    if (!inputAmount || parseFloat(inputAmount) <= 0) return;

    set({ loading: true, error: null });
    try {
      const lamports = toSmallestUnit(inputAmount, inputToken.decimals);
      const order = await getOrder(
        inputToken.address,
        outputToken.address,
        lamports,
        taker
      );
      const outNum = (
        Number(order.outAmount) / Math.pow(10, outputToken.decimals)
      ).toFixed(outputToken.decimals > 4 ? 6 : outputToken.decimals);
      set({ order, outputAmount: outNum, loading: false });
    } catch (e: any) {
      set({ error: e.message || "Failed to get quote", loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
