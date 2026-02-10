"use client";
import React, { useState } from "react";
import { useSwapStore } from "@/hooks/useSwapStore";

interface Props {
  onClose: () => void;
}

const BASE_SLIPPAGE_OPTIONS = [
  { label: "0.5%", value: 50 },
  { label: "1%", value: 100 },
  { label: "2%", value: 200 },
  { label: "3%", value: 300 },
];

const STABLE_SLIPPAGE_OPTIONS = [
  { label: "0.1%", value: 10 },
  { label: "0.3%", value: 30 },
  { label: "0.5%", value: 50 },
  { label: "1%", value: 100 },
];

const AMM_LIST = ["Orca", "Raydium", "Meteora", "Phoenix", "Lifinity", "Openbook"];

export default function SettingsModal({ onClose }: Props) {
  const store = useSwapStore();
  const [customFee, setCustomFee] = useState("");
  const [excludedAmms, setExcludedAmms] = useState<Set<string>>(new Set());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-brand-card border border-brand-border rounded-2xl p-5 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">Settings</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-brand-muted hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Base Token Slippage */}
        <div className="mb-5">
          <div className="text-xs text-brand-muted mb-2 font-medium">
            Slippage — Base Tokens
          </div>
          <div className="flex gap-1.5">
            {BASE_SLIPPAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => store.setSlippage(opt.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  store.slippageBps === opt.value
                    ? "bg-brand-gold text-black"
                    : "bg-brand-dark text-brand-muted hover:bg-brand-border hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stable/LST Slippage */}
        <div className="mb-5">
          <div className="text-xs text-brand-muted mb-2 font-medium">
            Slippage — Stable / LST Pairs
          </div>
          <div className="flex gap-1.5">
            {STABLE_SLIPPAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => store.setSlippageStable(opt.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  store.slippageStable === opt.value
                    ? "bg-brand-gold text-black"
                    : "bg-brand-dark text-brand-muted hover:bg-brand-border hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Fee */}
        <div className="mb-5">
          <div className="text-xs text-brand-muted mb-2 font-medium">Priority Fee</div>
          <div className="flex gap-1.5">
            <button
              onClick={() => store.setPriorityFee("auto")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                store.priorityFee === "auto"
                  ? "bg-brand-gold text-black"
                  : "bg-brand-dark text-brand-muted hover:bg-brand-border hover:text-white"
              }`}
            >
              Auto
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Custom (lamports)"
                value={customFee}
                onChange={(e) => {
                  setCustomFee(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) store.setPriorityFee(val);
                }}
                onClick={() => {
                  if (store.priorityFee === "auto") store.setPriorityFee(1000);
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold bg-brand-dark text-white border transition-all focus:outline-none ${
                  store.priorityFee !== "auto"
                    ? "border-brand-gold/50"
                    : "border-brand-border"
                }`}
              />
            </div>
          </div>
        </div>

        {/* AMM Exclusion */}
        <div>
          <div className="text-xs text-brand-muted mb-2 font-medium">
            AMM Sources
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AMM_LIST.map((amm) => {
              const excluded = excludedAmms.has(amm);
              return (
                <button
                  key={amm}
                  onClick={() => {
                    const next = new Set(excludedAmms);
                    if (excluded) next.delete(amm);
                    else next.add(amm);
                    setExcludedAmms(next);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                    excluded
                      ? "bg-brand-red/10 text-brand-red border border-brand-red/30"
                      : "bg-brand-dark text-brand-muted border border-brand-border hover:text-white"
                  }`}
                >
                  {amm}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
