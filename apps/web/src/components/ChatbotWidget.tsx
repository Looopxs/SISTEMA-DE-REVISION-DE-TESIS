'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, X, Send, Mic, MicOff, Volume2, VolumeX,
  Bot, User, Loader2, ChevronDown, Sparkles, RotateCcw, Copy, Check, Paperclip, FileText, Square
} from 'lucide-react';
import Cookies from 'js-cookie';

/* ── Types ─────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

/* ── Speech recognition type shim ──────────────────────────── */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/* ── Helpers ────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 10);

const SUGGESTIONS = [
  'Explica el formato APA 7 para tesis',
  '¿Cómo estructuro el marco teórico?',
  'Revisa este párrafo de mi introducción',
  'Genera un resumen ejecutivo de mi investigación',
  'Consejos para evitar el plagio académico',
  '¿Cómo citar una fuente web en APA?',
];

/* ── Main Component ─────────────────────────────────────────── */
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'assistant',
      content: '¡Hola! Soy **KIMY**, tu asistente IA para revisión de tesis. Puedo ayudarte con:\n\n• 📝 Estructura y redacción académica\n• 📚 Normas APA 7 y citaciones\n• 🔍 Revisión y mejora de texto\n• 💡 Ideas y sugerencias de investigación\n• 🎤 También puedes hablarme con el micrófono\n\n¿En qué te ayudo hoy?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [unread, setUnread] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; content: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<any>(null);

  /* scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* unread badge */
  useEffect(() => {
    if (!open && messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        setUnread((n) => n + 1);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      }
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  /* ── Speech Recognition via MediaRecorder + Whisper ───────── */
  const startListening = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Tu navegador no soporta acceso al micrófono.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        '',
      ].find((m) => !m || MediaRecorder.isTypeSupported(m)) ?? '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data?.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsListening(false);
        setInput(''); // limpia el placeholder de grabación

        const chunks = audioChunksRef.current;
        if (!chunks.length) return;

        const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';

        setLoading(true);
        try {
          const fd = new FormData();
          fd.append('file', audioBlob, `audio.${ext}`);
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
          if (data.text) {
            setInput(data.text);
            setTimeout(() => {
              (document.getElementById('chatbot-send-btn') as HTMLButtonElement | null)?.click();
            }, 300);
          }
        } catch (err: any) {
          console.error('[mic]', err);
          alert(`Error al transcribir: ${err?.message || 'intenta de nuevo'}`);
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start(500);
      setIsListening(true);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        alert('Permiso de micrófono denegado.\n\nEn Opera: haz clic en 🔒 → Micrófono → Permitir → Recargar página.');
      } else {
        alert(`Error de micrófono: ${err?.message}`);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  /* ── Text-to-Speech ───────────────────────────────────────── */
  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_#`]/g, '').replace(/\n/g, ' ');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'es-PE';
    utter.rate = 1.0;
    utter.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith('es'));
    if (esVoice) utter.voice = esVoice;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [ttsEnabled]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  /* ── File Attachments ─────────────────────────────────────── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      if (file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Error al procesar el PDF');
        const data = await res.json();
        setAttachment({ name: file.name, content: data.text || '' });
      } else {
        const text = await file.text();
        setAttachment({ name: file.name, content: text });
      }
    } catch (err) {
      alert('No se pudo extraer el texto del archivo. Usa un PDF o TXT válido.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Send message ─────────────────────────────────────────── */
  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setInput('');
    setShowSuggestions(false);
    setLoading(true);

    const userMsg: Message = { id: uid(), role: 'user', content, timestamp: new Date() };
    const assistantId = uid();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    let finalPayload = content;
    if (attachment) {
      finalPayload = `[Contexto de Archivo Adjunto: ${attachment.name}]\n${attachment.content.slice(0, 6000)}\n\n[Consulta del usuario]: ${content}`;
      setAttachment(null);
    }

    try {
      const token = Cookies.get('kimy_token');
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/thesis-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: finalPayload,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      let fullText = '';

      // Always try to read as SSE stream first
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.done) return;
          if (parsed.error) {
            fullText += `\n\n⚠️ ${parsed.error}`;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m)
            );
            return;
          }
          const delta =
            parsed.text ??
            parsed.content ??
            parsed.choices?.[0]?.delta?.content ??
            '';
          if (delta) {
            fullText += delta;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m)
            );
          }
        } catch { /* non-JSON line, skip */ }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Process all complete lines in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep incomplete last line
        for (const line of lines) {
          processLine(line);
        }
      }
      // Process any remaining data in buffer
      if (buffer) processLine(buffer);

      // If we got no text at all, try parsing as JSON
      if (!fullText && res.headers.get('content-type')?.includes('application/json')) {
        const json = await res.clone().json().catch(() => ({}));
        fullText = json.content || json.message || json.response || '';
        if (fullText) {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m)
          );
        }
      }

      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m)
      );
      if (fullText) speak(fullText);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const errMsg = 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, inténtalo de nuevo.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: errMsg, streaming: false } : m
        )
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [input, loading, messages, speak]);

  const cancelRequest = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    // Mark any streaming message as cancelled
    setMessages((prev) =>
      prev.map((m) =>
        m.streaming
          ? { ...m, streaming: false, content: m.content || '_[Cancelado]_' }
          : m
      )
    );
    setLoading(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearChat = () => {
    setMessages([{
      id: uid(),
      role: 'assistant',
      content: '¡Hola de nuevo! Soy **KIMY**. ¿En qué puedo ayudarte con tu tesis?',
      timestamp: new Date(),
    }]);
    setShowSuggestions(true);
  };

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(99,102,241,0.1);padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <>
      {/* ── FAB Button ── */}
      <button
        id="chatbot-fab"
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-400/50 ${
          pulse ? 'scale-110' : 'scale-100'
        }`}
        style={{
          background: open
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
        }}
        aria-label="Abrir chatbot KIMY"
      >
        {open ? (
          <ChevronDown className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
            {unread}
          </span>
        )}
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" style={{ animationDuration: '2s' }} />
        )}
      </button>

      {/* ── Chat Window ── */}
      <div
        className={`fixed bottom-24 right-6 z-[9998] w-[380px] max-w-[calc(100vw-1.5rem)] transition-all duration-300 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            height: '580px',
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight flex items-center gap-1.5">
                  KIMY <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                </p>
                <p className="text-[10px] text-indigo-200">Asistente IA de Tesis</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* TTS toggle */}
              <button
                onClick={() => { setTtsEnabled((t) => !t); if (isSpeaking) stopSpeaking(); }}
                className="p-2 rounded-lg hover:bg-white/15 transition-colors"
                title={ttsEnabled ? 'Desactivar voz' : 'Activar voz'}
              >
                {ttsEnabled ? (
                  <Volume2 className="w-4 h-4 text-white" />
                ) : (
                  <VolumeX className="w-4 h-4 text-indigo-200" />
                )}
              </button>
              {/* Clear */}
              <button
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-white/15 transition-colors"
                title="Limpiar conversación"
              >
                <RotateCcw className="w-4 h-4 text-indigo-200" />
              </button>
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-white/15 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      : 'bg-gradient-to-br from-slate-500 to-slate-700'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[80%] min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed overflow-hidden ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm text-white'
                        : 'rounded-tl-sm'
                    }`}
                    style={{
                      ...(msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }
                        : {
                            background: 'var(--surface-2)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                          }),
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                    }}
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                  {msg.streaming && (
                    <div className="flex gap-1 px-2">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  {/* Copy & timestamp row */}
                  <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {msg.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'assistant' && !msg.streaming && (
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        {copied === msg.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                        )}
                      </button>
                    )}
                    {msg.role === 'assistant' && ttsEnabled && !msg.streaming && (
                      <button
                        onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <Volume2 className="w-3 h-3" style={{ color: isSpeaking ? '#6366f1' : 'var(--text-muted)' }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Suggestions */}
            {showSuggestions && messages.length <= 1 && (
              <div className="space-y-2 mt-2">
                <p className="text-[11px] font-medium px-1" style={{ color: 'var(--text-muted)' }}>Sugerencias rápidas:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {SUGGESTIONS.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left text-xs px-3 py-2 rounded-xl border transition-all hover:shadow-sm"
                      style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div
            className="flex-shrink-0 px-3 py-3 border-t"
            style={{ borderColor: 'var(--border-color)', background: 'var(--surface)' }}
          >
            {/* Mic status indicator */}
            {isListening && (
              <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-500 font-medium">Escuchando... habla ahora</span>
              </div>
            )}
            {isSpeaking && (
              <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Volume2 className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span className="text-xs text-indigo-500 font-medium">Reproduciendo respuesta...</span>
                <button onClick={stopSpeaking} className="ml-auto text-xs text-indigo-400 hover:text-indigo-600">Detener</button>
              </div>
            )}

            {/* Attachment pill */}
            {attachment && (
              <div className="mb-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 max-w-full">
                <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                  {attachment.name}
                </span>
                <button
                  onClick={() => setAttachment(null)}
                  className="ml-1 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                id="chatbot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? '🔴 Grabando... habla ahora, luego haz clic en ⏹ para parar' : 'Escribe tu consulta o usa el micrófono…'}
                rows={1}
                disabled={isListening}
                className="flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all"
                style={{
                  maxHeight: '100px',
                  background: isListening ? 'rgba(239,68,68,0.05)' : 'var(--surface-2)',
                  border: isListening ? '1.5px solid rgba(239,68,68,0.5)' : '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  lineHeight: '1.5',
                  animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 100) + 'px';
                }}
              />

              {/* Attach button */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.csv,.md,.json"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)', background: 'var(--surface-2)' }}
                title="Adjuntar archivo (PDF, TXT)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Mic button */}
              <button
                id="chatbot-mic-btn"
                onClick={toggleListening}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 focus:outline-none ${
                  isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
                    : 'hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
                style={!isListening ? { color: 'var(--text-muted)', border: '1px solid var(--border-color)', background: 'var(--surface-2)' } : {}}
                title={isListening ? 'Detener grabación' : 'Hablar con el asistente'}
              >
                {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
              </button>

              {/* Send / Cancel button */}
              {loading ? (
                <button
                  id="chatbot-cancel-btn"
                  onClick={cancelRequest}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 focus:outline-none hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
                  }}
                  title="Cancelar respuesta"
                >
                  <Square className="w-4 h-4 text-white fill-white" />
                </button>
              ) : (
                <button
                  id="chatbot-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    boxShadow: input.trim() ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
                  }}
                  title="Enviar mensaje (Enter)"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
              Enter para enviar · Shift+Enter nueva línea · 🎤 Voz disponible
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
