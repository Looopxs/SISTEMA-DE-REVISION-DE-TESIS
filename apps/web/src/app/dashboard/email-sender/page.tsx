'use client';

import { useState, useEffect } from 'react';
import {
  Mail, Send, CheckCircle, XCircle, Loader2,
  Key, FileText, Users, ExternalLink, Sparkles,
} from 'lucide-react';

const API = '/api/email-action';

export default function EmailSenderPage() {
  const [configured, setConfigured] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState('');

  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('Documento académico — KIMY IA');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ email: string; status: string; error?: string }[]>([]);

  // Verificar si ya hay API key configurada
  useEffect(() => {
    fetch(`${API}/status`).then(r => r.json()).then(d => setConfigured(d.configured)).catch(() => setConfigured(true));
  }, []);

  const validEmails = emails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@') && e.includes('.'));

  const saveKey = async () => {
    if (!apiKey.startsWith('re_')) return setKeyMsg('❌ La clave debe empezar con "re_"');
    setSavingKey(true);
    const r = await fetch(`${API}/set-key`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }) });
    const d = await r.json();
    setKeyMsg(d.ok ? '✅ API Key guardada. ¡Ya puedes enviar correos!' : '❌ Error al guardar');
    if (d.ok) setConfigured(true);
    setSavingKey(false);
  };

  const sendEmails = async () => {
    if (!validEmails.length || !content.trim()) return;
    setSending(true);
    setResults([]);
    try {
      const r = await fetch(`${API}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: validEmails, subject, content }),
      });
      const d = await r.json();
      setResults(d.results || []);
    } catch (err: any) {
      setResults(validEmails.map(email => ({ email, status: 'failed', error: err.message })));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Mail className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">Envío de Documentos</h1>
            <p className="text-xs text-gray-500">Envío automático · sin abrir ninguna aplicación</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${configured ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {configured ? 'Listo para enviar' : 'Configurar API Key'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">

          {/* ── PASO 1: API KEY (solo si no está configurada) ── */}
          {!configured && (
            <div className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-blue-500/20 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Paso único: Conecta tu cuenta de correo</span>
              </div>
              <div className="p-5 space-y-4">

                {/* Instrucciones */}
                <div className="space-y-3">
                  {[
                    { n: '1', text: 'Crea una cuenta GRATIS en Resend.com', link: 'https://resend.com/signup', linkLabel: '→ Crear cuenta gratis' },
                    { n: '2', text: 'Ve a "API Keys" y crea una nueva clave', link: 'https://resend.com/api-keys', linkLabel: '→ Ir a API Keys' },
                    { n: '3', text: 'Copia la clave (empieza con re_...) y pégala abajo', link: null, linkLabel: null },
                  ].map(step => (
                    <div key={step.n} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {step.n}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-[var(--text-primary)]">{step.text}</p>
                        {step.link && (
                          <a href={step.link} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                            <ExternalLink className="w-3 h-3" /> {step.linkLabel}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input API Key */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[var(--card-bg)] border border-[var(--topbar-border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <button
                    onClick={saveKey}
                    disabled={savingKey || apiKey.length < 5}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-sky-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    {savingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Guardar y activar
                  </button>
                  {keyMsg && (
                    <p className={`text-xs text-center ${keyMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{keyMsg}</p>
                  )}
                </div>

                <p className="text-[10px] text-gray-500 text-center">
                  Resend ofrece 3,000 correos/mes gratis · No requiere tarjeta de crédito
                </p>
              </div>
            </div>
          )}

          {/* ── FORMULARIO DE ENVÍO ── */}
          <div className={`space-y-4 ${!configured ? 'opacity-40 pointer-events-none' : ''}`}>

            {/* Destinatarios */}
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                ¿A quién enviar?
                {validEmails.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">{validEmails.length} correo(s)</span>
                )}
              </label>
              <textarea
                value={emails}
                onChange={e => setEmails(e.target.value)}
                placeholder={'jorgeernandes587@gmail.com\nanapaula@hotmail.com, carlos@uni.pe'}
                rows={3}
                className="w-full bg-[var(--card-bg)] border border-[var(--topbar-border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
              <p className="text-[10px] text-gray-500 mt-1">Separa varios correos con coma o nueva línea</p>
            </div>

            {/* Asunto */}
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Asunto del correo</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--topbar-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Contenido */}
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Contenido a enviar
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Pega aquí el texto de la tesis, revisión de artículo u otro documento generado..."
                rows={12}
                className="w-full bg-[var(--card-bg)] border border-[var(--topbar-border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-gray-600 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Botón enviar */}
            <button
              onClick={sendEmails}
              disabled={sending || !validEmails.length || !content.trim()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] transition-all disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {sending
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                : <><Send className="w-5 h-5" /> Enviar correo a {validEmails.length || '?'} destinatario(s)</>
              }
            </button>

            {/* Resultados */}
            {results.length > 0 && (
              <div className="rounded-2xl border border-[var(--topbar-border)] bg-[var(--card-bg)] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)]">
                  <span className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Resultado del envío
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${r.status === 'sent' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      {r.status === 'sent'
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="text-xs font-medium text-[var(--text-primary)]">{r.email}</div>
                        {r.error && <div className="text-[10px] text-red-400 mt-0.5">{r.error}</div>}
                      </div>
                      <span className={`text-[10px] font-bold ${r.status === 'sent' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {r.status === 'sent' ? '✅ ENVIADO' : '❌ FALLÓ'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cambiar API Key */}
            {configured && (
              <button onClick={() => { setConfigured(false); setApiKey(''); setKeyMsg(''); }}
                className="w-full text-xs text-gray-500 hover:text-gray-400 py-2 transition-colors">
                🔑 Cambiar API Key de Resend
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
