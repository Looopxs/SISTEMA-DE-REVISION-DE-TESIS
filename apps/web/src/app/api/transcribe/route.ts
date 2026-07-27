import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
    if (!GROQ_API_KEY) {
      console.error('[transcribe] GROQ_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('file') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('[transcribe] Received audio:', audioFile.name, audioFile.size, 'bytes', audioFile.type);

    // Groq Whisper transcription
    const groqForm = new FormData();
    groqForm.append('file', audioFile, audioFile.name || 'audio.webm');
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('language', 'es');
    groqForm.append('response_format', 'json');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: groqForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[transcribe] Groq error:', res.status, errText);
      return NextResponse.json({ error: `Groq ${res.status}: ${errText.slice(0, 100)}` }, { status: res.status });
    }

    const json = await res.json();
    console.log('[transcribe] Success, text:', json.text?.slice(0, 80));
    return NextResponse.json({ text: json.text || '' });
  } catch (err: any) {
    console.error('[transcribe] Internal error:', err?.message);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
