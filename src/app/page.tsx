import SwapCard from "@/components/SwapCard";

export default function Home() {
  return (
    <>
      <div className="bg-mesh" />
      <div className="relative z-10 min-h-[calc(100vh-72px)] flex flex-col items-center justify-center px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
            Live on Solana Mainnet
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="gradient-text">Swap Any Token</span>
            <br />
            <span className="text-white/90">on Solana</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Best prices aggregated across every DEX.
            <br className="hidden sm:block" />
            Fast. Secure. Zero platform fees.
          </p>
        </div>

        <SwapCard />

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-md w-full">
          {[
            { label: "DEXes", value: "15+" },
            { label: "Tokens", value: "10K+" },
            { label: "Fees", value: "$0" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
