"use client";
import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress } from "@/lib/format";

export default function Header() {
  const { publicKey } = useWallet();

  return (
    <header className="w-full glass-strong sticky top-0 z-40 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <span className="text-xl font-bold gradient-text tracking-tight">
            SolSwap
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: "Swap", active: true },
            { label: "Tokens", active: false },
            { label: "History", active: false },
          ].map((item) => (
            <a
              key={item.label}
              href="#"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                item.active
                  ? "text-white bg-white/5"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Wallet */}
        <div className="flex items-center gap-3">
          {publicKey && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              {shortenAddress(publicKey.toBase58())}
            </div>
          )}
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
