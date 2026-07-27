import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface SendResult {
  email: string;
  status: 'sent' | 'failed';
  error?: string;
}

// Template HTML del correo
const buildHtml = (content: string, subject: string, recipientName: string) => {
  const htmlBody = content
    .replace(/^# (.+)$/gm, '<h1 style="color:#1e3a5f;font-size:17pt;text-align:center;margin:14pt 0 5pt;">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#1e3a5f;font-size:13pt;font-weight:bold;margin:11pt 0 3pt;">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="color:#2563eb;font-size:12pt;font-weight:bold;margin:8pt 0 2pt;">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:10pt 0;"/>')
    .replace(/^- (.+)$/gm, '<li style="margin:2pt 0;">$1</li>')
    .replace(/(<li.+<\/li>\n?)+/g, m => `<ul style="margin:5pt 0 5pt 18pt;">${m}</ul>`)
    .replace(/\n\n/g, '</p><p style="margin:5pt 0;text-align:justify;">')
    .replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:24px 32px;">
            <div style="color:#fff;font-size:20pt;font-weight:bold;">KIMY IA</div>
            <div style="color:#93c5fd;font-size:9pt;margin-top:2px;">Sistema de Revisión Inteligente de Tesis · UNT</div>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:24px 32px 10px;">
            <p style="font-size:12pt;color:#1e293b;margin:0 0 6px;">Estimado/a <strong>${recipientName}</strong>,</p>
            <p style="font-size:10pt;color:#475569;margin:0;line-height:1.6;">
              Se adjunta el siguiente documento generado por <strong>KIMY IA</strong>, el sistema académico de la Universidad Nacional de Trujillo.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:2px solid #e2e8f0;margin:0;"/></td></tr>

        <!-- Content -->
        <tr>
          <td style="padding:18px 32px;">
            <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:14px;">
              <div style="font-size:9pt;color:#64748b;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Documento</div>
              <div style="font-size:12pt;color:#1e293b;font-weight:bold;margin-top:2px;">${subject}</div>
            </div>
            <div style="font-size:10pt;color:#334155;line-height:1.7;">
              <p style="margin:5pt 0;text-align:justify;">${htmlBody}</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;">
            <div style="font-size:8pt;color:#64748b;">
              Enviado automáticamente por <strong>KIMY IA</strong> · ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
              Universidad Nacional de Trujillo — Trujillo, La Libertad, Perú
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private resendApiKey: string = process.env.RESEND_API_KEY || '';

  setApiKey(key: string) {
    this.resendApiKey = key;
    this.logger.log(`Resend API key configurada: ${key.slice(0, 8)}...`);
  }

  getApiKeyPreview(): string | null {
    return this.resendApiKey ? `${this.resendApiKey.slice(0, 8)}...` : null;
  }

  async send(to: string[], subject: string, content: string): Promise<SendResult[]> {
    if (!this.resendApiKey) throw new Error('API Key de Resend no configurada');

    const resend = new Resend(this.resendApiKey);
    const results: SendResult[] = [];

    for (const email of to) {
      try {
        const name = email.split('@')[0];
        const { error } = await resend.emails.send({
          from: 'KIMY IA <onboarding@resend.dev>',
          to: [email],
          subject,
          html: buildHtml(content, subject, name),
        });

        if (error) {
          results.push({ email, status: 'failed', error: error.message });
        } else {
          results.push({ email, status: 'sent' });
          this.logger.log(`✅ Email enviado a: ${email}`);
        }
      } catch (err: any) {
        results.push({ email, status: 'failed', error: err.message });
        this.logger.error(`❌ Error enviando a ${email}:`, err.message);
      }

      if (to.length > 1) await new Promise(r => setTimeout(r, 500));
    }

    return results;
  }
}
