import { NextRequest, NextResponse } from 'next/server';

// The backend API URL — resolved at runtime so it works on any machine
function getApiUrl(): string {
  // Server-side: use internal URL or default to localhost
  return (
    process.env.API_INTERNAL_URL ||
    (process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
      : 'http://localhost:3001')
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';
    const API_URL = getApiUrl();

    const upstream = await fetch(`${API_URL}/api/thesis-generator/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        message: body.message ?? '',
        university: body.university ?? 'UNT',
        documentType: body.documentType ?? 'tesis',
        authorName: body.authorName,
        advisorName: body.advisorName,
        thesisTitle: body.thesisTitle,
        faculty: body.faculty,
        school: body.school,
        selectedUniversity: body.selectedUniversity,
        history: (body.history ?? []).map((h: any) => ({
          role: h.role === 'assistant' ? 'assistant' : h.role,
          content: h.content ?? h.parts ?? '',
          parts: h.parts ?? h.content ?? '',
        })),
      }),
      // Aumentado a 15 minutos (900,000ms) para soportar generación muy larga de Groq
      signal: AbortSignal.timeout(900_000),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => `HTTP ${upstream.status}`);
      console.error('[thesis-chat] upstream error:', upstream.status, errText.slice(0, 200));
      return NextResponse.json(
        { error: `Error del servidor IA: ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const contentType = upstream.headers.get('content-type') || '';

    // ── SSE streaming: pipe directly to browser ──────────────────────────────
    if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
      return new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // ── JSON fallback ────────────────────────────────────────────────────────
    const json = await upstream.json();
    return NextResponse.json(json);
  } catch (err: any) {
    const msg = err?.message || 'Error de conexión';
    console.error('[thesis-chat] proxy error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
