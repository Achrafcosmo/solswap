import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import WalletProvider from "@/components/WalletProvider";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "SolSwap — Swap Any Solana Token",
  description: "Trade any token on Solana with the best prices across all DEXes. Fast, secure, zero fees.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className={inter.className}>
        <WalletProvider>
          <Header />
          <main>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
