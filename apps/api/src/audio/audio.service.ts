import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class AudioService {
  async transcribeAudio(fileBuffer: Buffer, mimeType: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpException('GEMINI_API_KEY no configurada', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const base64Audio = fileBuffer.toString('base64');
    
    const payload = {
      contents: [
        {
          parts: [
            { text: "Por favor, transcribe este audio con exactitud. No agregues descripciones ni comentarios adicionales, devuelve únicamente el texto hablado en el mismo idioma." },
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: base64Audio
              }
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Error from Gemini API:', data);
        throw new Error(data.error?.message || 'Error transcribiendo audio');
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text.trim();
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new HttpException('Error transcribiendo audio', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
