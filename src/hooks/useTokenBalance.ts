"use client";
import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const SOL_MINT = "So11111111111111111111111111111111111111112";

export function useTokenBalance(mintAddress: string) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    setLoading(true);
    try {
      if (mintAddress === SOL_MINT) {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } else {
        const mint = new PublicKey(mintAddress);
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint });
        if (accounts.value.length > 0) {
          const amount = accounts.value[0].account.data.parsed.info.tokenAmount;
          setBalance(parseFloat(amount.uiAmountString || "0"));
        } else {
          setBalance(0);
        }
      }
    } catch (e) {
      console.warn("Balance fetch failed:", e);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [publicKey, mintAddress, connection]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
}
