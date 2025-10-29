import { NextRequest, NextResponse } from 'next/server';

const aliases: Record<string,string> = { Allahabad: 'Prayagraj', 'Sant Ravidas Nagar': 'Bhadohi' };

function normalize(name: string) {
  return aliases[name] || name;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  if (!lat || !lon) return NextResponse.json({ error: 'lat/lon required' }, { status: 400 });
  const url = new URL(process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('zoom', '10');
  url.searchParams.set('addressdetails', '1');
  const r = await fetch(url.toString(), { headers: { 'User-Agent': 'mgnrega-dashboard' } });
  const j = await r.json();
  const district = normalize(j?.address?.county || j?.address?.state_district || j?.address?.city || '');
  return NextResponse.json({ district });
}
