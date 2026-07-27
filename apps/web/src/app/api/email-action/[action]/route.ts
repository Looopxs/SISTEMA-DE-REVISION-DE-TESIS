import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:3001';

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const body = await req.json().catch(() => ({}));
  const r = await fetch(`${API_URL}/api/email-sender/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await r.json(), { status: r.status });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const r = await fetch(`${API_URL}/api/email-sender/${action}`);
  return NextResponse.json(await r.json(), { status: r.status });
}
