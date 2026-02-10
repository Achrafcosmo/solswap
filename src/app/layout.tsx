import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import WalletProvider from "@/components/WalletProvider";
import Header from "@/components/Header";
import PriceTicker from "@/components/PriceTicker";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "SolSwap Exchange — Best Solana Token Prices",
  description: "Meta-aggregated swaps across Jupiter, Raydium, and more. Best prices on Solana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className={inter.className}>
        <WalletProvider>
          <Header />
          <PriceTicker />
          <main>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
