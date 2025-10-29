import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get('district') || 'Unknown';
  // Mock trend series derived from district hash for determinism
  const hash = Array.from(district).reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 0);
  const base = 600000 + (hash % 400000); // 600k - 1M
  const series = Array.from({ length: 12 }, (_, i) => {
    const drift = (i - 6) * 0.015; // slight trend
    const jitter = ((hash >> (i % 16)) % 20) / 200; // 0..0.1
    return Math.round(base * (0.8 + i * 0.02 + drift + jitter));
  });
  return NextResponse.json({ series });
}
