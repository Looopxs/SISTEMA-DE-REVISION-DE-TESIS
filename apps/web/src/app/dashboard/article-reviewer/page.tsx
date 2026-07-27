'use client';

import { useState, useRef } from 'react';
import {
  FlaskConical, Globe, FileText, BarChart3, Languages,
  Send, Loader2, Download, ChevronDown, Trash2,
  Star, BookOpen, Microscope, FileCode, FileType,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ── Ejemplos rápidos ──────────────────────────────────────────────────────────
const EXAMPLES = [
  {
    label: '📄 Ejemplo EN → ES',
    value: `Title: Deep Learning for Medical Image Diagnosis: A Systematic Review
Authors: Zhang, L., Wang, M., & Chen, R. (2023)
Journal: Nature Medicine, 29(4), 812-825. DOI: 10.1038/s41591-023-02020-8

Abstract:
This systematic review examines the application of deep learning algorithms in medical image diagnosis across 147 studies published between 2018 and 2023. We searched PubMed, Scopus, and IEEE Xplore databases following PRISMA guidelines. Convolutional Neural Networks (CNNs) demonstrated superior performance in radiological image classification (AUC 0.94±0.03) compared to traditional machine learning methods (AUC 0.81±0.05, p<0.001). Transformer-based architectures showed promising results in pathology slide analysis with 91.2% sensitivity and 89.7% specificity. Key limitations include dataset heterogeneity, limited external validation, and black-box interpretability challenges. We conclude that deep learning represents a paradigm shift in computational radiology, though clinical implementation requires standardized validation protocols.`,
  },
  {
    label: '📄 Ejemplo ES → EN',
    value: `Título: Implementación de Machine Learning para la Predicción del Rendimiento Académico en Universidades Peruanas
Autores: Ramírez, C., Torres, A., & Vega, M. (2024)
Revista: Revista Peruana de Ciencias de la Computación, 12(1), 45-67.

Resumen:
Este estudio cuasi-experimental analiza la eficacia de algoritmos de machine learning para predecir el rendimiento académico en 3,420 estudiantes universitarios de la Universidad Nacional de Trujillo durante el período 2021-2023. Se emplearon algoritmos Random Forest, Gradient Boosting y Redes Neuronales Artificiales sobre 18 variables predictoras socioeconómicas y académicas. El modelo Random Forest obtuvo el mejor desempeño predictivo (Accuracy=87.3%, F1-Score=0.85, AUC-ROC=0.91). La validación cruzada k-fold (k=10) confirmó la robustez del modelo. Las variables más relevantes fueron el promedio ponderado del semestre anterior (importancia=0.34), asistencia a clases (0.28) y horas de estudio semanal (0.19). Se concluye que los modelos de ML pueden identificar estudiantes en riesgo académico con 6 semanas de anticipación, permitiendo intervenciones tutoriales oportunas.`,
  },
];

interface ReviewResult {
  content: string;
  streaming: boolean;
}

export default function ArticleReviewerPage() {
  const [article, setArticle] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleArticleChange = (v: string) => {
    setArticle(v);
    setCharCount(v.length);
  };

  const analyze = async () => {
    if (!article.trim() || isStreaming) return;

    setResult({ content: '', streaming: true });
    setIsStreaming(true);

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);

    try {
      const response = await fetch('/api/article-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulated += data.text;
                setResult({ content: accumulated, streaming: true });
              }
              if (data.done) setResult({ content: accumulated, streaming: false });
              if (data.error) setResult({ content: `❌ ${data.error}`, streaming: false });
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setResult({ content: `❌ Error de conexión: ${err.message}`, streaming: false });
    } finally {
      setIsStreaming(false);
    }
  };

  // ── Descargas ─────────────────────────────────────────────────────────────
  const getContent = () => result?.content || '';

  const dlMarkdown = () => {
    const blob = new Blob([getContent()], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `REVISION_ARTICULO_${Date.now()}.md`; a.click();
    setShowDownloadMenu(false);
  };

  const dlTxt = () => {
    const plain = getContent().replace(/^#{1,6} /gm,'').replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1');
    const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `REVISION_ARTICULO_${Date.now()}.txt`; a.click();
    setShowDownloadMenu(false);
  };

  const dlWord = () => {
    const md = getContent();
    let html = md
      .replace(/^# (.+)$/gm,'<h1>$1</h1>').replace(/^## (.+)$/gm,'<h2>$1</h2>')
      .replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/^---$/gm,'<hr/>')
      .replace(/^- (.+)$/gm,'<li>$1</li>').replace(/(<li>.+<\/li>\n?)+/g,m=>`<ul>${m}</ul>`)
      .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm,(_,h,r)=>{
        const ths=h.split('|').filter((c:string)=>c.trim()).map((c:string)=>`<th>${c.trim()}</th>`).join('');
        const trs=r.trim().split('\n').map((row:string)=>`<tr>${row.split('|').filter((c:string)=>c.trim()).map((c:string)=>`<td>${c.trim()}</td>`).join('')}</tr>`).join('');
        return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
      })
      .replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br/>');
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>@page{margin:2.5cm;margin-left:3cm;}body{font-family:'Arial Narrow',Arial,sans-serif;font-size:12pt;line-height:1.5;text-align:justify;}h1{font-size:14pt;font-weight:bold;text-align:center;margin:18pt 0 6pt;page-break-before:always;}h2{font-size:13pt;font-weight:bold;margin:14pt 0 4pt;}h3{font-size:12pt;font-weight:bold;margin:10pt 0 3pt;}p{margin:6pt 0;}table{border-collapse:collapse;width:100%;font-size:10pt;}td,th{border:1pt solid #000;padding:4pt;}th{background:#D0D0D0;font-weight:bold;}</style></head><body><p>${html}</p></body></html>`;
    const blob = new Blob([doc], { type: 'application/msword;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `REVISION_ARTICULO_${Date.now()}.doc`; a.click();
    setShowDownloadMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Microscope className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">Revisor de Artículos Científicos</h1>
            <p className="text-xs text-gray-500">Análisis · Evaluación · Traducción · Gemini 3.1 Flash Lite</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <div className="relative" ref={downloadMenuRef}>
              <button
                onClick={() => setShowDownloadMenu(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
                <ChevronDown className={`w-3 h-3 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
              </button>
              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-[var(--topbar-border)] bg-[var(--topbar-bg)] shadow-xl z-50 overflow-hidden">
                  <button onClick={dlMarkdown} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-violet-500/10 text-[var(--text-primary)] transition-colors">
                    <FileCode className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <div><div className="font-medium">Markdown (.md)</div><div className="text-gray-500">Visual Studio Code</div></div>
                  </button>
                  <button onClick={dlTxt} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-blue-500/10 text-[var(--text-primary)] transition-colors">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div><div className="font-medium">Texto plano (.txt)</div><div className="text-gray-500">Bloc de notas</div></div>
                  </button>
                  <button onClick={dlWord} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-sky-500/10 text-[var(--text-primary)] transition-colors border-t border-[var(--topbar-border)]">
                    <FileType className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <div><div className="font-medium">Word (.doc)</div><div className="text-gray-500">Microsoft Word</div></div>
                  </button>
                </div>
              )}
            </div>
          )}
          {result && (
            <button
              onClick={() => { setResult(null); setArticle(''); setCharCount(0); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Nueva revisión
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">

          {/* Panel de entrada */}
          {!result && (
            <div className="space-y-4">
              {/* Info cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Globe, label: 'Detección de idioma', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                  { icon: BookOpen, label: 'Resumen analítico', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                  { icon: BarChart3, label: 'Evaluación crítica', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                  { icon: Languages, label: 'Traducción completa', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-2.5 p-3 rounded-xl border ${item.bg}`}>
                    <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                    <span className="text-xs text-[var(--text-primary)] font-medium leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <div className="rounded-2xl border border-[var(--topbar-border)] bg-[var(--card-bg)] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)]">
                  <span className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                    Pega aquí el artículo científico (título, resumen, metodología, etc.)
                  </span>
                  <span className={`text-xs ${charCount > 50 ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {charCount.toLocaleString()} caracteres
                  </span>
                </div>
                <textarea
                  value={article}
                  onChange={e => handleArticleChange(e.target.value)}
                  placeholder="Pega el texto completo del artículo (en inglés o español)...

Ejemplo:
Title: Machine Learning Approaches for Predicting Student Performance...
Abstract: This study investigates..."
                  rows={14}
                  className="w-full bg-transparent text-[var(--text-primary)] text-sm px-4 py-3 resize-none focus:outline-none placeholder-gray-600 font-mono leading-relaxed"
                />
              </div>

              {/* Ejemplos rápidos */}
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  Ejemplos de prueba
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex.label}
                      onClick={() => handleArticleChange(ex.value)}
                      className="px-3 py-1.5 text-xs rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 transition-all"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón analizar */}
              <button
                onClick={analyze}
                disabled={isStreaming || article.trim().length < 50}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isStreaming ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analizando con Gemini 3.1 Flash Lite...</>
                ) : (
                  <><FlaskConical className="w-4 h-4" /> Analizar artículo</>
                )}
              </button>
              {article.trim().length > 0 && article.trim().length < 50 && (
                <p className="text-xs text-amber-400 text-center">Pega más contenido del artículo para analizar (mínimo 50 caracteres)</p>
              )}
            </div>
          )}

          {/* Panel de resultados */}
          {result && (
            <div ref={resultRef} className="space-y-4">
              {/* Indicador de streaming */}
              {result.streaming && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gemini está analizando el artículo... (idioma → resumen → evaluación → traducción)
                </div>
              )}

              {/* Resultado */}
              <div className="rounded-2xl border border-[var(--topbar-border)] bg-[var(--card-bg)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)]">
                  <Microscope className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">Informe de Revisión Científica</span>
                  {!result.streaming && (
                    <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      ✅ Análisis completo
                    </span>
                  )}
                </div>
                <div className="px-6 py-5">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-primary)]
                    prose-headings:text-[var(--text-primary)] prose-headings:font-bold
                    prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                    prose-table:text-xs prose-td:py-1.5 prose-th:py-1.5
                    prose-blockquote:border-l-cyan-500 prose-blockquote:text-gray-400
                    prose-strong:text-[var(--text-primary)]">
                    <ReactMarkdown>{result.content || ' '}</ReactMarkdown>
                    {result.streaming && (
                      <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse rounded-sm ml-1 align-middle" />
                    )}
                  </div>
                </div>
              </div>

              {/* Botón nueva revisión abajo */}
              {!result.streaming && (
                <button
                  onClick={() => { setResult(null); setArticle(''); setCharCount(0); }}
                  className="w-full py-2.5 rounded-xl border border-[var(--topbar-border)] text-xs text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-all"
                >
                  ← Analizar otro artículo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
