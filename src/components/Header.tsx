"use client";
import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Header() {
  return (
    <header className="w-full border-b border-brand-border bg-brand-darker/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-xl font-bold bg-gradient-to-r from-brand-purple to-brand-accent bg-clip-text text-transparent">
            SolSwap
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <a href="#" className="text-white font-medium">Swap</a>
          <a href="#" className="hover:text-white transition-colors">Tokens</a>
          <a href="#" className="hover:text-white transition-colors">History</a>
        </nav>
        <WalletMultiButton className="!rounded-xl !py-2 !px-4 !text-sm" />
      </div>
    </header>
  );
}
