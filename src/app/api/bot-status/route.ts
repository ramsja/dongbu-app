import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
  }

  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'KeepAlive/1.0' } });
    clearTimeout(timeout);
    return NextResponse.json({ online: res.ok, status: res.status, ms: Date.now() - start, ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ online: false, status: 0, ms: 10000, ts: new Date().toISOString() });
  }
}
