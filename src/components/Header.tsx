"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress } from "@/lib/format";

const NAV_ITEMS = [
  { label: "Swap", href: "/" },
  { label: "Profile", href: "/profile" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Forge", href: "/forge" },
];

export default function Header() {
  const { publicKey } = useWallet();
  const pathname = usePathname();
  const [solPrice, setSolPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        );
        const data = await res.json();
        setSolPrice(data.solana?.usd ?? null);
      } catch {}
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-brand-dark/95 backdrop-blur-xl sticky top-0 z-40 border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <span className="text-xl font-extrabold text-white tracking-tight">
            SOL<span className="text-brand-gold">SWAP</span>
          </span>
          <span className="text-sm text-brand-muted font-light ml-1 hidden sm:inline">
            Exchange
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-8">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-brand-gold bg-brand-gold/10"
                    : "text-brand-muted hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {solPrice !== null && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <img
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                alt="SOL"
                className="w-5 h-5 rounded-full"
              />
              <span className="text-white font-semibold">
                ${solPrice.toFixed(2)}
              </span>
            </div>
          )}

          {publicKey && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-border/50 text-xs text-brand-muted">
              <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              {shortenAddress(publicKey.toBase58())}
            </div>
          )}

          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
