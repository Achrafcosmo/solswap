import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import WalletProvider from "@/components/WalletProvider";
import Header from "@/components/Header";
import PriceTicker from "@/components/PriceTicker";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "SolSwap Exchange — Best Solana Token Prices",
  description: "Meta-aggregated swaps across Jupiter, Raydium, and more. Best prices on Solana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F0B90B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <WalletProvider>
          <ServiceWorkerRegistrar />
          <Header />
          <PriceTicker />
          <main>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
