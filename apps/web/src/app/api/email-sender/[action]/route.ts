import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:3001';

export async function POST(req: NextRequest, { params }: { params: { action: string } }) {
  const { action } = params;
  const body = await req.json().catch(() => ({}));
  const r = await fetch(`${API_URL}/api/email-sender/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await r.json(), { status: r.status });
}

export async function GET(_req: NextRequest, { params }: { params: { action: string } }) {
  const { action } = params;
  const r = await fetch(`${API_URL}/api/email-sender/${action}`);
  return NextResponse.json(await r.json(), { status: r.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: { action: string } }) {
  const { action } = params;
  const r = await fetch(`${API_URL}/api/email-sender/${action}`, { method: 'DELETE' });
  return NextResponse.json(await r.json(), { status: r.status });
}
