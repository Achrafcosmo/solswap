'use client';

import { useEffect, useRef } from 'react';

const EXPO_URL = 'https://expo.dev/accounts/cosmobuild/projects/solswap-mobile/updates/4db35164-3944-4129-9d17-b11886b40ccc';

export default function MobilePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Generate QR code on canvas using minimal implementation
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
    script.onload = () => {
      if (canvasRef.current && (window as any).QRCode) {
        (window as any).QRCode.toCanvas(canvasRef.current, EXPO_URL, {
          width: 280,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: 500 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          marginBottom: 4,
          background: 'linear-gradient(135deg, #F0B90B, #FFD54F)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          SolSwap Mobile
        </h1>
        <p style={{ color: '#888', fontSize: 16, marginBottom: 32 }}>
          Best swap prices across Solana DEXes
        </p>

        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          display: 'inline-block',
          marginBottom: 32,
          boxShadow: '0 0 40px rgba(240,185,11,0.15)',
        }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>

        <div style={{
          textAlign: 'left' as const,
          background: '#111',
          border: '1px solid #222',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}>
          <h3 style={{ color: '#F0B90B', marginBottom: 16, fontSize: 18 }}>How to open:</h3>
          {[
            ['1', 'Download Expo Go on your phone'],
            ['2', 'Scan the QR code above with your camera (iPhone) or inside Expo Go (Android)'],
            ['3', 'The app loads instantly — no install needed!'],
          ].map(([num, text]) => (
            <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14, color: '#ccc', fontSize: 15, lineHeight: 1.5 }}>
              <span style={{
                background: '#F0B90B',
                color: '#000',
                fontWeight: 700,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 14,
              }}>{num}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="https://apps.apple.com/app/expo-go/id982107779" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#F0B90B', color: '#000', padding: '12px 24px',
            borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 14,
          }}>🍎 App Store</a>
          <a href="https://play.google.com/store/apps/details?id=host.exp.exponent" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#F0B90B', color: '#000', padding: '12px 24px',
            borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 14,
          }}>🤖 Play Store</a>
        </div>

        <p style={{ marginTop: 32, color: '#555', fontSize: 13 }}>
          Powered by SolSwap ⚡ Meta-aggregating Jupiter · Raydium · OKX
        </p>
      </div>
    </div>
  );
}
