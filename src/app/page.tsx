import SwapCard from "@/components/SwapCard";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="bg-gradient-to-r from-brand-purple to-brand-accent bg-clip-text text-transparent">
            Swap Any Token
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Best prices across all Solana DEXes. Fast, secure, no fees.
        </p>
      </div>
      <SwapCard />
      <div className="mt-12 text-center text-xs text-gray-600">
        Powered by Jupiter Aggregator • Built on Solana
      </div>
    </div>
  );
}
