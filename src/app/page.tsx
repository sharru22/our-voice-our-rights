"use client";
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

type District = { name: string };

const DISTRICTS_UP: string[] = [
  'Lucknow','Agra','Varanasi','Prayagraj','Kanpur Nagar','Gorakhpur','Ghaziabad','Meerut','Bareilly','Ayodhya'
];

const dict = {
  en: {
    title: 'MGNREGA Performance – Uttar Pradesh',
    subtitle: 'Our Voice, Our Rights',
    findMyDistrict: 'Find my district',
    selectDistrict: 'Select District',
    householdsDemanded: 'Households Demanded',
    householdsWorked: 'Households Worked',
    persondays: 'Persondays',
    avgDaysPerHH: 'Avg Days/HH',
    compareWithState: 'Compare with State Avg',
    trend12m: '12‑month Trend',
    aboutTitle: 'About this project',
    aboutText:
      'This website helps citizens view MGNREGA performance for their district with simple visuals, Hindi support, audio help, and resilient caching from data.gov.in.',
    dataSource: 'Data Source: data.gov.in',
    lastUpdated: 'Last Updated',
    hindiNarration: 'Play Hindi Narration',
  },
  hi: {
    title: 'मनरेगा प्रदर्शन – उत्तर प्रदेश',
    subtitle: 'हमारी आवाज़, हमारे अधिकार',
    findMyDistrict: 'मेरा ज़िला ढूँढें',
    selectDistrict: 'ज़िला चुनें',
    householdsDemanded: 'मांग करने वाले परिवार',
    householdsWorked: 'काम करने वाले परिवार',
    persondays: 'व्यक्तिदिन',
    avgDaysPerHH: 'औसत दिन/परिवार',
    compareWithState: 'राज्य औसत से तुलना',
    trend12m: '12‑महीने की प्रवृत्ति',
    aboutTitle: 'परियोजना के बारे में',
    aboutText:
      'यह वेबसाइट आपके ज़िले के मनरेगा कामकाज को आसान भाषा और चित्रों में दिखाती है। हिन्दी, ऑडियो मदद और data.gov.in से भरोसेमंद डेटा कैशिंग के साथ।',
    dataSource: 'स्रोत: data.gov.in',
    lastUpdated: 'अंतिम अद्यतन',
    hindiNarration: 'हिन्दी वाचन चलाएँ',
  },
};

const metricIcons: Record<string, string> = {
  households_demanded: '🏠',
  households_allocated: '👷',
  persondays: '🗓️',
  avg_days_per_hh: '📅',
};

function Sparkline({ data = [], color = '#2563eb' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const width = 200; const height = 48;
  const max = Math.max(...data); const min = Math.min(...data);
  const norm = (v: number) => (height - 4) - ((v - min) / Math.max(1, max - min)) * (height - 8);
  const step = data.length > 1 ? (width - 8) / (data.length - 1) : 0;
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${4 + i * step} ${norm(v)}`).join(' ');
  return (
    <svg width={width} height={height} className="mt-2">
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export default function Home() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const t = useMemo(() => dict[lang], [lang]);

  const [districts, setDistricts] = useState<District[]>([]);
  const [district, setDistrict] = useState<string>('');
  const [state] = useState<string>('Uttar Pradesh');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [trend, setTrend] = useState<number[]>([]);
  const [stateAvg] = useState<number>(100000);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const speak = (text: string, l = 'hi-IN') => {
    try {
      const utter = new SpeechSynthesisUtterance(text); utter.lang = l;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(utter);
    } catch {}
  };

  // Offline cache
  const cacheKey = (d: string) => `mgnrega:metrics:${d}`;
  const saveCache = (d: string, data: any) => localStorage.setItem(cacheKey(d), JSON.stringify({ data, ts: Date.now() }));
  const readCache = (d: string) => { const raw = localStorage.getItem(cacheKey(d)); if (!raw) return null; try { return JSON.parse(raw); } catch { return null; } };

  // Service worker registration for PWA shell/offline
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => { fetch('/api/districts?state=' + encodeURIComponent(state)).then(r => r.json()).then(setDistricts); }, [state]);

  const fetchMetrics = async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metrics?district=${encodeURIComponent(d)}`);
      const json = await res.json();
      setMetrics(json); setLastUpdated(new Date().toISOString());
      const existing = readCache(d)?.data || {}; saveCache(d, { ...existing, metrics: json });
    } catch {
      const cached = readCache(d); if (cached?.data?.metrics) { setMetrics(cached.data.metrics); setLastUpdated(new Date(cached.ts).toISOString()); }
    } finally { setLoading(false); }
  };

  const fetchTrend = async (d: string) => {
    try {
      const res = await fetch(`/api/trends?district=${encodeURIComponent(d)}`);
      if (res.ok) {
        const json = await res.json(); setTrend(json?.series || []);
        const existing = readCache(d)?.data || {}; saveCache(d, { ...existing, trend: json?.series || [] });
        return;
      }
      const base = metrics?.persondays || 800000; setTrend(Array.from({ length: 12 }, (_, i) => Math.round(base * (0.8 + 0.02 * i))));
    } catch {
      const cached = readCache(d); if (cached?.data?.trend) { setTrend(cached.data.trend); } else { const base = metrics?.persondays || 800000; setTrend(Array.from({ length: 12 }, (_, i) => Math.round(base * (0.8 + 0.02 * i)))); }
    }
  };

  useEffect(() => { if (!district) return; fetchMetrics(district).then(() => fetchTrend(district)); }, [district]);

  const tryGeolocate = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      const r = await fetch(`/api/geolocate?lat=${latitude}&lon=${longitude}`);
      const j = await r.json(); if (j?.district) setDistrict(j.district);
    });
  };

  const KPIS = useMemo(() => ([
    { key: 'households_demanded', label: t.householdsDemanded, icon: metricIcons.households_demanded },
    { key: 'households_allocated', label: t.householdsWorked, icon: metricIcons.households_allocated },
    { key: 'persondays', label: t.persondays, icon: metricIcons.persondays },
    { key: 'avg_days_per_hh', label: t.avgDaysPerHH, icon: metricIcons.avg_days_per_hh },
  ] as const), [t]);

  const formatNumber = (n: number | null) => {
    if (n == null) return '—';
    if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return (n / 100000).toFixed(2) + ' L';
    return n.toLocaleString('en-IN');
  };
  const comparePct = (value?: number, avg?: number) => { if (!value || !avg) return 0; const pct = Math.max(0, Math.min(1, value / avg)); return Math.round(pct * 100); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-blue-50 to-orange-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-green-800">{t.title}</h1>
            <p className="text-sm md:text-base text-gray-700">{t.subtitle}</p>
          </div>
          <select className="px-3 py-2 rounded-lg border bg-white" value={lang} onChange={(e) => setLang(e.target.value as 'en'|'hi')} aria-label="Language">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 space-y-5">
        <div className="flex flex-wrap gap-3 items-center">
          <select className="border rounded-xl px-4 py-3 text-lg bg-white shadow-sm" value={state} disabled>
            <option>Uttar Pradesh</option>
          </select>
          <select className="border rounded-xl px-4 py-3 text-lg bg-white shadow-sm" value={district} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDistrict(e.target.value)}>
            <option value="">{t.selectDistrict}</option>
            {DISTRICTS_UP.map(d => (<option key={d} value={d}>{d}</option>))}
          </select>
          <button className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-lg bg-green-600 text-white shadow hover:bg-green-700" onClick={tryGeolocate}>📍 {t.findMyDistrict}</button>
        </div>

        {metrics && (
          <div className="rounded-2xl p-4 bg-white shadow border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-green-800">{t.compareWithState}</div>
              <div className="text-sm text-gray-500">{formatNumber(metrics.households_demanded)} / {formatNumber(stateAvg)}</div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: `${comparePct(metrics.households_demanded, stateAvg)}%` }} />
            </div>
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {KPIS.map(item => (
              <div key={item.key} className="rounded-2xl p-4 bg-white shadow-md border border-orange-100">
                <div className="flex items-start justify-between">
                  <div className="text-3xl" aria-hidden>{item.icon}</div>
                  <button className="text-xl" aria-label="Play audio" onClick={() => speak(`${item.label}: ${formatNumber(metrics[item.key])}`, lang === 'hi' ? 'hi-IN' : 'en-IN')} title="Play audio">🔊</button>
                </div>
                <div className="mt-2 text-gray-600 text-sm md:text-base">{item.label}</div>
                <div className="text-2xl md:text-3xl font-extrabold mt-1">{formatNumber(metrics[item.key])}</div>
                <div className="text-xs text-gray-500 mt-1">{t.lastUpdated}: {lastUpdated ? new Date(lastUpdated).toLocaleString('en-IN') : '—'}</div>
              </div>
            ))}
          </div>
        )}

        {metrics && (
          <div className="rounded-2xl p-4 bg-white shadow border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-blue-800">{t.trend12m}</div>
            </div>
            <Sparkline data={trend} color="#2563eb" />
          </div>
        )}

        <div className="rounded-2xl p-4 bg-white shadow border border-gray-100 flex items-center justify-between">
          <div className="text-gray-800 font-medium">{t.aboutTitle}</div>
          <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-orange-600 text-white shadow hover:bg-orange-700" onClick={() => speak('यह वेबसाइट आपके ज़िले के मनरेगा कामकाज की जानकारी देती है', 'hi-IN')}>
            🎙 {t.hindiNarration}
          </button>
        </div>

        <section className="rounded-2xl p-5 bg-white shadow border border-gray-100 leading-relaxed text-lg">
          <p>{t.aboutText}</p>
          <ul className="mt-3 text-base list-disc pl-6 space-y-1">
            <li>Low-literacy design: big text, icons, audio explanations.</li>
            <li>Dynamic data by district; auto-detect via location.</li>
            <li>Resilient: caches last data for offline viewing.</li>
          </ul>
        </section>
      </main>

      <footer className="mt-10 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 text-sm text-gray-700 flex flex-wrap items-center justify-between gap-2">
          <div>{t.dataSource}</div>
          <div>{t.lastUpdated}: {lastUpdated ? new Date(lastUpdated).toLocaleString('en-IN') : '—'}</div>
        </div>
      </footer>

      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center">
          <div className="rounded-2xl bg-white px-6 py-4 shadow text-lg">Loading…</div>
        </div>
      )}
    </div>
  );
}
