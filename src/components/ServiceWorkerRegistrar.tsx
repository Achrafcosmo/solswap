"use client";
import { useEffect } from "react";
import { registerSW } from "@/lib/registerSW";

export default function ServiceWorkerRegistrar() {
  useEffect(() => { registerSW(); }, []);
  return null;
}
