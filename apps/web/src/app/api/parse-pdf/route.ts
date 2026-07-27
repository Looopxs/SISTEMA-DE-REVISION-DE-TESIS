import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let text = '';

    if (fileName.endsWith('.docx')) {
      // Parse Word document
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith('.pdf')) {
      // Parse PDF document
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      // Try to decode as plain text for other files (.txt, .md, .csv)
      text = buffer.toString('utf-8');
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('[parse-doc] Error:', err);
    return NextResponse.json({ error: err.message || 'Error parsing document' }, { status: 500 });
  }
}
