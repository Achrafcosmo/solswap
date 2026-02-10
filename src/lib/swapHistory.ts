const SUPABASE_URL = "https://xfrzkferqgzbflwhrqtf.supabase.co";
const SUPABASE_KEY = "sb_publishable_XJG3alvet0u3GS07N_gfdg_zwxBTMmJ";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export interface SwapRecord {
  id?: number;
  wallet: string;
  signature: string;
  input_mint: string;
  input_symbol: string;
  input_amount: string;
  input_logo?: string;
  output_mint: string;
  output_symbol: string;
  output_amount: string;
  output_logo?: string;
  status: string;
  created_at?: string;
}

export async function saveSwap(swap: Omit<SwapRecord, "id" | "created_at">): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/swap_history`, {
      method: "POST",
      headers,
      body: JSON.stringify(swap),
    });
  } catch (e) {
    console.error("Failed to save swap:", e);
  }
}

export async function getSwaps(wallet: string): Promise<SwapRecord[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/swap_history?wallet=eq.${wallet}&order=created_at.desc&limit=50`,
      { headers }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function clearSwaps(wallet: string): Promise<void> {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/swap_history?wallet=eq.${wallet}`,
      { method: "DELETE", headers }
    );
  } catch {}
}
