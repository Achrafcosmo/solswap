import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const OKX_API_KEY = process.env.OKX_API_KEY || "";
const OKX_SECRET = process.env.OKX_SECRET || "";
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE || "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromToken = searchParams.get("fromTokenAddress");
  const toToken = searchParams.get("toTokenAddress");
  const amount = searchParams.get("amount");

  if (!fromToken || !toToken || !amount) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  if (!OKX_API_KEY || !OKX_SECRET || !OKX_PASSPHRASE) {
    return NextResponse.json({ error: "OKX not configured" }, { status: 500 });
  }

  const queryString = `chainIndex=501&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}`;
  const requestPath = `/api/v6/dex/aggregator/quote?${queryString}`;
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z");
  const prehash = timestamp + "GET" + requestPath;
  const sign = crypto
    .createHmac("sha256", OKX_SECRET)
    .update(prehash)
    .digest("base64");

  try {
    const res = await fetch(`https://web3.okx.com${requestPath}`, {
      headers: {
        "OK-ACCESS-KEY": OKX_API_KEY,
        "OK-ACCESS-SIGN": sign,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
        "User-Agent": "SolSwap/1.0",
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
