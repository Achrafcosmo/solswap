import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import WalletProvider from "@/components/WalletProvider";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SolSwap — Swap Any Solana Token",
  description: "Trade any token on Solana with the best prices across all DEXes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <Header />
          <main>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
