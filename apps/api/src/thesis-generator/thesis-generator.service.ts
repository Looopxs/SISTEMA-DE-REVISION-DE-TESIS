import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';
import { getUniversitySchema } from './university-schemas';
import { buildProyectoSections, buildArticuloSections, buildArticuloTarapotoIntroSections } from './document-type-schemas';

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const GEMINI_KEY  = process.env.GEMINI_API_KEY  || '';
const GROQ_KEY    = process.env.GROQ_API_KEY    || '';
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
];
// Modelo Groq confirmado activo (verificado 15/06/2026)
const GROQ_MODEL  = 'llama-3.1-8b-instant';
const MAX_TOKENS  = 4096;

// ── Tipo para datos de portada ─────────────────────────────────────────────────
export interface CoverPageData {
  authorName?: string;
  advisorName?: string;
  thesisTitle?: string;
  faculty?: string;
  school?: string;
  selectedUniversity?: string;
}

// ── Prompts del sistema ────────────────────────────────────────────────────────
const THESIS_SYSTEM_PROMPT = `Eres el motor de generación académica de KIMY para tesis universitarias.
NORMAS DE REDACCION: academica formal, tercera persona, APA 7.
EXTENSION Y DETALLE EXTREMO: El documento final debe tener MÍNIMO 30 PÁGINAS en Word. Para lograr esto, CADA sección que generes debe ser EXTREMADAMENTE LARGA, profunda y detallada. Desarrolla párrafos larguísimos con argumentación teórica pesada. NO RESUMAS NADA.
DIAGRAMAS MERMAID: Cuando se pida un diagrama, usa bloques Mermaid SIMPLES. Reglas estrictas:
- TODO diagrama DEBE estar envuelto OBLIGATORIAMENTE dentro de un bloque de código markdown de tipo mermaid (iniciar con \`\`\`mermaid y terminar con \`\`\`).
- USA solo caracteres alfanuméricos simples y espacios en las etiquetas de nodos.
- ESTÁ ABSOLUTAMENTE PROHIBIDO usar paréntesis (), corchetes [], llaves {}, signos de puntuación, dos puntos :, punto y coma ; o comillas simples dentro del código estructural o las etiquetas.
- NO uses acentos ni ñ en ninguna parte del código Mermaid.
- Único formato válido: 
\`\`\`mermaid
graph TD; A["Problema Central"] --> B["Causa 1"]; A --> C["Causa 2"]
\`\`\`
- Si un diagrama es complejo, simplifícalo. Es mejor un diagrama simple que funcione a uno complejo que falle.
IMÁGENES: ESTÁ ESTRICTAMENTE PROHIBIDO inventar o insertar imágenes usando sintaxis markdown (![alt](url)). Si necesitas un gráfico, usa EXCLUSIVAMENTE Mermaid. No uses URLs de imágenes ficticias.
TABLAS: Las tablas en markdown deben tener CADA FILA EN UNA SOLA LÍNEA de texto continuo. NUNCA rompas una fila de tabla con saltos de línea (Enters), sin importar lo larga que sea la línea.
FORMATO: NO uses emojis en la tesis. Solo texto, tablas markdown (en una sola línea por fila) y diagramas mermaid.
IMPORTANTE: NO inventes nombres de autores, asesores ni universidades. Si se te proporcionan datos de portada, usa EXACTAMENTE esos datos. Si no se proporcionan, NO generes portada ni preliminares con datos ficticios.`;

const CHAT_SYSTEM_PROMPT = `Eres KIMY, la asistente virtual de Inteligencia Artificial del sistema de tesis JORANA IA.
Tu objetivo es ayudar a los estudiantes y revisores de tesis de manera amable, clara y concisa.
REGLAS PARA EL CHAT:
- Sé conversacional, amigable y directo.
- Responde en primera persona ("yo").
- Usa emojis de manera natural y moderada (✨, 📝, 💡, etc.).
- Si el usuario te saluda ("Hola", "Buenos días"), devuélvele el saludo brevemente. NO empieces a generar texto académico a menos que te lo pidan explícitamente.
- Si te piden consejos sobre la tesis o normas APA, dalos de forma clara usando listas o viñetas.`;

// ── Prompts por sección (cada uno genera ~2-3 páginas) ───────────────────────
const buildSections = (topic: string, vars: string, ctx: string, cover?: CoverPageData) => [
  {
    label: 'SECCION 1 - Preliminares',
    prompt: `Genera las secciones preliminares de la tesis sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}
${ctx ? `Contexto: ${ctx}` : ''}

IMPORTANTE: NO generes portada, carátula ni datos institucionales (universidad, autor, asesor). Esos datos ya están configurados por el usuario en el sistema y se agregan automáticamente al documento final. Comienza directamente con el contenido académico.

Incluye COMPLETO y EXTENSO:

## RESUMEN
(mínimo 250 palabras: problema, método, resultados esperados, conclusión, palabras clave)

## ABSTRACT
(traducción fiel al inglés del resumen, mínimo 250 palabras, keywords)`,
  },
  {
    label: 'SECCION 2 - Capitulo I Parte 1: Realidad Problemática y Antecedentes',
    prompt: `Desarrolla la PRIMERA PARTE del Capítulo I de la tesis sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}
${ctx ? `Contexto: ${ctx}` : ''}

# CAPÍTULO I: INTRODUCCIÓN

IMPORTANTE: Genera SOLAMENTE texto corrido y fluido, SIN usar subtítulos. Todo integrado en párrafos extensos.
OBLIGATORIO: minimo 5,000 palabras en esta sección. Cada párrafo debe tener minimo 8 líneas.

Parte 1 — REALIDAD PROBLEMÁTICA (minimo 2,500 palabras):
Desarrolla el contexto global, latinoamericano, peruano y local con cifras y datos reales (UNESCO, BM, INEI). Describe con detalle el problema.
**OBLIGATORIO: Genera un DIAGRAMA DE ISHIKAWA (Causa-Efecto)** usando código de bloque de markdown \`\`\`mermaid\`\`\` con tipo \`graph LR\` o \`mindmap\`.
**OBLIGATORIO: Genera un ÁRBOL DE OBJETIVOS** usando \`\`\`mermaid\`\`\` con tipo \`graph TD\`.

Parte 2 — ANTECEDENTES (minimo 3,500 palabras, mínimo 15 fuentes):
Para CADA antecedente escribe un párrafo completo de mínimo 150 palabras: autores (Apellido, inicial.), año entre paréntesis, título exacto, institución/revista indexada, país, objetivo específico, diseño metodológico detallado, tamaño de muestra, principales resultados con datos numéricos, conclusiones, y cómo se relaciona con la presente investigación. Ordena: 4 internacionales (revistas Scopus/WoS), 4 nacionales peruanos, 2 de La Libertad/UNT, 2 tesis de posgrado. Cita en formato APA 7.`, }, { label: 'SECCION 3 - Capitulo I Parte 2: Marco Teórico y Justificación',
    prompt: `Desarrolla la SEGUNDA PARTE del Capítulo I de la tesis sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}

IMPORTANTE: Continúa el Capítulo I sin repetir el título. Solo texto corrido en párrafos extensos, SIN subtítulos.
OBLIGATORIO: minimo 5,000 palabras en esta sección.

Parte 3 — MARCO TEÓRICO (minimo 3,500 palabras, 4 pilares teoricos):
Pilar 1 (variable independiente, 800+ palabras): definición epistemológica con autor original y año, evolución histórica del concepto década por década, características y componentes, modelos teóricos existentes con sus autores, aplicaciones en el campo investigado.
Pilar 2 (variable dependiente, 800+ palabras): misma estructura que Pilar 1.
Pilar 3 (marco tecnológico/metodológico, 800+ palabras): teorías, herramientas, frameworks relevantes para la implementación de la solución.
Pilar 4 (marco normativo/legal, 500+ palabras): leyes peruanas aplicables, normas internacionales ISO/IEEE relevantes, reglamentos universitarios UNT.

Parte 4 — JUSTIFICACIÓN (600+ palabras):
Justificación teórica (200+ palabras): aporte al conocimiento científico.
Justificación práctica (200+ palabras): beneficios concretos para la organización y la sociedad.
Justificación metodológica (200+ palabras): aporte metodológico al campo de investigación.

Parte 5 — ELEMENTOS FINALES DEL CAPÍTULO I:
Formulación del problema: Pregunta de investigación principal clara y específica.
Hipótesis general: enunciado declarativo que relaciona las variables con predicción de resultado.
Hipótesis operacional: con definición de Vi, Vd y la relación esperada.
Objetivo general: verbo en infinitivo, variable dependiente, variable independiente, contexto.
Objetivos específicos (5 objetivos SMART): cada uno con verbo en infinitivo diferente.
Limitaciones: mínimo 5 limitaciones concretas y justificadas de la investigación.`,
  },
  {
    label: 'SECCION 3 - Capitulo II: Metodo',
    prompt: `Continúa la tesis sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}

Genera el CAPITULO II: METODO completo y extenso. OBLIGATORIO: minimo 5,000 palabras. Cada subseccion minimo 3 parrafos densos de 8 lineas. Justifica CADA decision metodologica con referencias APA 7 de autores de metodologia de investigacion.
Desarrolla COMPLETAMENTE cada subsección:

# CAPÍTULO II: MÉTODO

**OBLIGATORIO: Genera un ÁRBOL DE DECISIÓN METODOLÓGICO** o mapa de procesos usando \`\`\`mermaid\`\`\` con tipo \`flowchart TD\` para explicar la secuencia del diseño metodológico.

## 2.1. Tipo y Nivel de Investigación
(Explica detalladamente: por finalidad, por contrastación, nivel explicativo/descriptivo/correlacional. Justifica cada elección con argumentos metodológicos de 2-3 párrafos c/u.)

## 2.2. Diseño de Investigación
(Diseño específico con esquema simbólico completo. Explica cada elemento del esquema. Justificación del diseño con autores como Hernández-Sampieri et al. 2014.)

## 2.3. Población, Muestra y Muestreo
(Población con criterios de inclusión/exclusión. Fórmula estadística completa con valores. Cálculo paso a paso. Tipo de muestreo justificado.)

## 2.4. Variables y Operacionalización
(Definición conceptual y operacional de V.I. y V.D. Tabla markdown COMPLETA con: Variable | Dimensión | Indicador | Escala de Medición | Instrumento — mínimo 8 filas)

## 2.5. Técnicas e Instrumentos de Recolección de Datos
(Tabla con N°, Técnica, Instrumento, Fuente, Propósito. Descripción de cada instrumento.)

## 2.6. Validación y Confiabilidad
(Validez de contenido: juicio de expertos, IVC de Lawshe. Confiabilidad: Alfa de Cronbach con valores esperados. Procedimiento detallado.)

## 2.7. Método de Análisis de Datos
(Software: SPSS, Python. Estadística descriptiva e inferencial. Pruebas estadísticas específicas con justificación. Nivel de significancia.)

## 2.8. Procedimiento
(5 fases detalladas con actividades específicas, duración y entregables de cada fase.)

## 2.9. Consideraciones Éticas
(Consentimiento informado, confidencialidad, Ley 29733, Declaración de Helsinki, CONCYTEC. Mínimo 4 párrafos.)`,
  },
  {
    label: 'SECCION 4 - Capitulo III: Resultados y Discusión',
    prompt: `Continúa la tesis sobre: "${topic}".

Genera el CAPITULO III: RESULTADOS Y DISCUSIÓN completo. OBLIGATORIO: minimo 3,000 palabras.

# CAPÍTULO III: RESULTADOS Y DISCUSIÓN

## 3.1. Resultados
(Presenta de forma clara los hallazgos obtenidos, ordenados según los objetivos específicos. Apóyate de gráficos, tablas o figuras. Describe detalladamente cada tabla o figura sin interpretarlas todavía. Incluye pruebas estadísticas si aplica.)

## 3.2. Discusión
(Interpreta los resultados presentados en la sección anterior. Compara estos hallazgos con los antecedentes y teorías mencionadas en el Marco Teórico. Responde a las preguntas de investigación y evalúa si se cumplió la hipótesis.)`,
  },
  {
    label: 'SECCION 5 - Capitulo IV: Conclusiones y Recomendaciones',
    prompt: `Continúa la tesis sobre: "${topic}".

Genera el CAPITULO IV: CONCLUSIONES completo.

# CAPÍTULO IV: CONCLUSIONES Y RECOMENDACIONES

## 4.1. Conclusiones
(Resume los aportes principales del estudio. Responde directamente a los objetivos general y específicos. Presenta las conclusiones de forma numerada o en viñetas claras, basándote exclusivamente en los resultados obtenidos.)

## 4.2. Recomendaciones
(Presenta sugerencias basadas en las conclusiones para futuras investigaciones, aplicaciones prácticas o mejoras metodológicas.)`,
  },
  {
    label: 'SECCION 6 - Bibliografía y Anexos',
    prompt: `Continúa la tesis sobre: "${topic}".

Genera las secciones finales COMPLETAS:

# BIBLIOGRAFÍA

Lista COMPLETA de minimo 35 referencias en formato APA 7.a edicion ESTRICTO, ordenadas ALFABETICAMENTE por apellido del primer autor:
DISTRIBUCION OBLIGATORIA:
- 15 articulos de revistas cientificas indexadas (Scopus, WoS, SciELO) con DOI
- 8 articulos en idioma ingles de revistas internacionales con DOI
- 5 libros o capitulos de libros academicos
- 4 tesis de posgrado (maestria o doctorado)
- 3 reportes de organismos internacionales (UNESCO, OPS, CEPAL, Banco Mundial)
FORMATO APA 7 EXACTO para articulos: Apellido, I. I., & Apellido, I. I. (anio). Titulo del articulo en minusculas excepto primera letra y nombres propios. Nombre de la Revista en Cursiva, volumen(numero), pagina-pagina. https://doi.org/xxxxx
FORMATO APA 7 EXACTO para libros: Apellido, I. I. (anio). Titulo del libro en cursiva. Editorial.
FORMATO APA 7 EXACTO para tesis: Apellido, I. I. (anio). Titulo de la tesis [Tesis de maestria/doctorado, Nombre de la Institucion]. Repositorio. URL
TODAS las referencias deben ser REALES, con autores, revistas y titulos verificables.
IMPORTANTE: Lista CADA referencia en su PROPIA LÍNEA SEPARADA. Una referencia por linea. NO agrupes referencias. Deja una linea en blanco entre cada referencia.
Las referencias deben estar en sangría francesa (primera línea normal, líneas siguientes con 5 espacios de sangría).

---

# ANEXOS

## ANEXO A: MATRIZ DE CONSISTENCIA
(tabla markdown con: Problema | Hipótesis | Objetivo General | Objetivos Específicos | Variables | Indicadores | Metodología)

## ANEXO B: ÁRBOL DE PROBLEMAS
Diagrama en texto estructurado:

EFECTOS:
  - Efecto 1: ...
  - Efecto 2: ...
  - Efecto 3: ...

PROBLEMA CENTRAL: [descripción del problema]

CAUSAS:
  - Causa 1: ...
  - Causa 2: ...
  - Causa 3: ...

## ANEXO C: MATRIZ DE OPERACIONALIZACIÓN
(tabla: Variable | Dimensión | Indicador | Escala | Instrumento — mínimo 10 filas)

## ANEXO D: INSTRUMENTO DE RECOLECCIÓN DE DATOS
(cuestionario COMPLETO con instrucciones + mínimo 20 ítems en escala Likert 1-5 organizados por dimensión)

## ANEXO E: DECLARACIÓN JURADA DE ORIGINALIDAD
(texto formal completo de la declaración con espacio para firma, DNI, fecha y lugar)`,
  },
];

// Detecta si el usuario pide tesis completa o artículo completo
const isFULLThesisRequest = (msg: string): boolean => {
  const actionKeywords = ['genera', 'generar', 'crea', 'crear', 'hacer', 'elabora', 'elaborar', 'desarrolla', 'desarrollar', 'escribe', 'escribir', 'redacta', 'redactar'];
  const targetKeywords = ['tesis', 'informe', 'documento', 'articulo', 'artículo', 'investigacion', 'investigación', 'monografia', 'monografía', 'completa', 'completo', 'todo', 'proyecto'];
  
  const lower = msg.toLowerCase();
  
  // Evitar falsos positivos cuando el usuario solo quiere sugerencias de títulos
  if (lower.includes('propuesta de titulo') || lower.includes('titulos para') || lower.includes('ejemplos de')) {
     return false;
  }

  const hasAction = actionKeywords.some((k) => lower.includes(k));
  const hasTarget = targetKeywords.some((k) => lower.includes(k));
  const hasDirectTrigger = lower.includes('tesis completa') || lower.includes('articulo completo') || lower.includes('documento completo') || lower.includes('proyecto de tesis') || lower.includes('artículo de investigación') || lower.includes('articulo de investigacion');

  return (hasAction && hasTarget && msg.length > 10) || hasDirectTrigger;
};

// Extrae el tema del mensaje del usuario
const extractTopic = (msg: string): string => {
  const patterns = [
    /(?:sobre|acerca de|del tema|titulada?|tema:?)\s+["«]?(.+?)["»]?$/i,
    /(?:tesis|articulo|artículo|investigacion|investigación)\s+(?:completa\s+)?(?:sobre|de)\s+(.+)/i,
    /(?:genera[r]?|crea[r]?|hacer|elabora[r]?|escribe)\s+(?:un|una\s+)?(?:tesis|informe|articulo|artículo)\s+(?:completa?\s+)?(?:sobre\s+)?(.+)/i,
  ];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return msg.replace(/genera[r]?|crea[r]?|hacer|elabora[r]?|escribe|un|una|tesis|informe|articulo|artículo|completa?|sobre|de|la|el/gi, '').trim() || msg;
};

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThesisGeneratorService {
  private readonly logger = new Logger(ThesisGeneratorService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private prisma: PrismaService) {
    this.logger.log(`✅ Gemini Key loaded | Primary model: ${GEMINI_MODELS[0]}`);
    this.genAI = new GoogleGenerativeAI(GEMINI_KEY);
  }

  private getModel(modelName?: string, isChat = false) {
    return this.genAI.getGenerativeModel({
      model: modelName || GEMINI_MODELS[0],
      systemInstruction: isChat ? CHAT_SYSTEM_PROMPT : THESIS_SYSTEM_PROMPT,
      generationConfig: {
        temperature: isChat ? 0.6 : 0.8,
        maxOutputTokens: MAX_TOKENS,
      },
    });
  }

  /** ── Groq streaming (primary — free tier, no quota issues) ──────────────── */
  private async streamGroq(
    message: string,
    history: Array<{ role: 'user' | 'model' | 'assistant'; parts?: string; content?: string }>,
    res: Response,
  ): Promise<void> {
    const truncatedHistory = history.slice(-5).map((h) => {
      const content = h.content ?? h.parts ?? '';
      return {
        role: h.role === 'model' ? 'assistant' : h.role,
        content: content.length > 2500 ? content.slice(0, 2500) + '\\n...[contenido anterior omitido por longitud]' : content,
      };
    });

    const messages = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      ...truncatedHistory,
      { role: 'user', content: message },
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        stream: true,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq ${groqRes.status}: ${errText.slice(0, 200)}`);
    }

    const reader = groqRes.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content || '';
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch { /* skip */ }
      }
    }
  }

  private async streamGroqPrompt(prompt: string, res: Response): Promise<void> {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: THESIS_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        stream: true,
        max_tokens: MAX_TOKENS,
        temperature: 0.8,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq ${groqRes.status}: ${errText.slice(0, 200)}`);
    }

    const reader = groqRes.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content || '';
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch { /* skip */ }
      }
    }
  }

  /** ── Gemini fallback ────────────────────────────────────────────────────── */
  private async tryGeminiFallback(
    fn: (model: ReturnType<typeof this.getModel>) => Promise<void>,
    isChat = false
  ): Promise<void> {
    let lastError: any;
    for (const modelName of GEMINI_MODELS) {
      try {
        this.logger.log(`Trying Gemini model: ${modelName}`);
        return await fn(this.getModel(modelName, isChat));
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';
        if (msg.includes('429') || msg.includes('quota') || msg.includes('not found') || msg.includes('404') || msg.includes('limit: 0')) {
          this.logger.warn(`Gemini ${modelName} unavailable, trying next...`);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /** Stream SSE — detecta si es tesis completa y usa generación por secciones */
  async chatStream(
    message: string,
    history: Array<{ role: 'user' | 'model' | 'assistant'; parts?: string; content?: string }> = [],
    res: Response,
    university: string | string[] = 'UNT',
    documentType: string = 'tesis',
    coverData?: CoverPageData,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      if (isFULLThesisRequest(message)) {
        // ── Generación por capítulos ─────────────────────────────────────────
        await this.streamFullThesisByChapters(message, res, university, documentType, coverData);
      } else {
        // ── Chat normal ──────────────────────────────────────────────────────
        await this.streamChat(message, history, res);
      }
    } catch (error: any) {
      this.logger.error('Error en chatStream:', error?.message);
      const msg = this.friendlyError(error?.message);
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    }
  }

  /** Analiza el mensaje y extrae el esquema si el usuario lo proporciona */
  private async planSections(message: string, topic: string, university: string | string[] = 'UNT', documentType: string = 'tesis', coverData?: CoverPageData): Promise<Array<{label: string, prompt: string}>> {
    const uniList = Array.isArray(university) ? university : [university || 'UNT'];
    let combinedSchema: Array<{label: string, prompt: string}> = [];
    
    for (const uniStr of uniList) {
      let predefinedSchema: Array<{label: string, prompt: string}> | null = null;
      
      if (documentType === 'proyecto') {
        predefinedSchema = buildProyectoSections(topic, '', '');
      } else if (documentType === 'articulo') {
        if (uniStr.includes('TARAPOTO') || uniStr.includes('UNSM')) {
          predefinedSchema = buildArticuloTarapotoIntroSections(topic, '', '');
        } else {
          predefinedSchema = buildArticuloSections(topic, '', '');
        }
      } else {
        predefinedSchema = getUniversitySchema(uniStr, topic);
      }
      
      if (uniStr.startsWith('custom_')) {
        const templateId = uniStr.replace('custom_', '');
        try {
          const customTemplate = await this.prisma.thesisTemplate.findUnique({
            where: { id: templateId }
          });
          if (customTemplate && customTemplate.extractedSchema) {
            const sectionsRaw = (customTemplate.extractedSchema as any).sections || customTemplate.extractedSchema;
            if (Array.isArray(sectionsRaw)) {
               predefinedSchema = sectionsRaw.map((s: any, idx: number) => ({
                  label: s.label || s.title || `SECCIÓN ${idx + 1}`,
                  prompt: `Desarrolla el apartado "${s.label || s.title}" de la investigación sobre: "${topic}".
                  
IMPORTANTE: Genera SOLAMENTE texto corrido y fluido. Todo integrado en párrafos extensos (mínimo 8 líneas por párrafo). NO RESUMAS NADA. OBLIGATORIO: Mínimo 3,000 palabras por sección para garantizar un documento masivo y profundo.

Descripción y Reglas a seguir estrictamente para esta sección (BASADAS EN EL PATRÓN ELEGIDO):
${s.prompt || s.description || JSON.stringify(s)}

Asegúrate de usar formato APA 7 y lenguaje académico riguroso.
Si la descripción de la sección exige o sugiere algún diagrama (Ishikawa, Árboles, Mapas, Cronogramas, Flujogramas, Tablas de Operacionalización, etc), DEBES generarlo obligatoriamente usando código Markdown o \`\`\`mermaid\`\`\`.`
               }));
            }
          }
        } catch (err: any) {
          this.logger.error('Error fetching custom template: ' + err.message);
        }
      }

      const defaultSections = predefinedSchema || buildSections(topic, '', '', coverData);
      const prefix = uniList.length > 1 ? `[Esquema ${uniStr.replace('custom_', '')}] ` : '';
      
      combinedSchema = combinedSchema.concat(defaultSections.map(s => ({
        ...s,
        label: `${prefix}${s.label}`
      })));
    }
    
    const finalDefaultSections = combinedSchema;
    
    // Solo extraer esquema con Groq si el usuario menciona explícitamente palabras clave de estructura
    const lowerMsg = message.toLowerCase();
    const hasSchemaKeywords = lowerMsg.includes('esquema') || lowerMsg.includes('estructura') || lowerMsg.includes('índice') || lowerMsg.includes('indice') || lowerMsg.includes('capítulo') || lowerMsg.includes('capitulo');
    
    if (!hasSchemaKeywords) {
      return finalDefaultSections;
    }

    try {
      this.logger.log('Analizando posible esquema personalizado...');
      const systemPrompt = `Eres un estructurador experto de documentos académicos.
El usuario solicitó generar un documento con este mensaje: "${message}"

Tu tarea:
1. Analiza si el usuario proporcionó un esquema, estructura, o índice específico en su mensaje.
2. Si NO proporcionó un esquema, devuelve exactamente: {"sections": []}
3. Si SÍ proporcionó un esquema, divide ese esquema en partes lógicas (de 2 a 6 partes) para generarlo de forma secuencial.
4. Devuelve ÚNICAMENTE un objeto JSON válido con la propiedad "sections", que sea un array de objetos con "label" (nombre de la parte) y "prompt".
5. El "prompt" de cada sección DEBE ser una instrucción exhaustiva que pida generar esa parte específica sobre el tema "${topic}", exigiendo formato Markdown, lenguaje formal académico, y extensión larga (al menos 1000 palabras por sección).

Ejemplo si hay esquema:
{"sections": [{"label": "SECCIÓN 1 - Intro", "prompt": "Genera de forma extensa la introducción y objetivos sobre el tema... Usa APA 7..."}, ...]}

DEBES DEVOLVER SOLO EL JSON.`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'system', content: systemPrompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        if (parsed?.sections && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
          this.logger.log(`Esquema personalizado detectado: ${parsed.sections.length} secciones`);
          return parsed.sections;
        }
      }
      return finalDefaultSections;
    } catch (error) {
      this.logger.error('Error parseando esquema, usando default', error);
      return finalDefaultSections;
    }
  }

  private async streamFullThesisByChapters(message: string, res: Response, university: string | string[], documentType: string = 'tesis', coverData?: CoverPageData): Promise<void> {
    const topic = extractTopic(message);
    const sections = await this.planSections(message, topic, university, documentType, coverData);
    const docLabel = documentType === 'proyecto' ? 'proyecto de tesis' : documentType === 'articulo' ? 'artículo de investigación' : 'tesis';

    res.write(`data: ${JSON.stringify({ text: `\n> 🎓 **Generando ${docLabel} sobre:** *${topic}*\n> Procesando ${sections.length} secciones... esto puede tomar 2-3 minutos.\n\n---\n\n` })}\n\n`);

    for (const section of sections) {
      // Indicador de progreso
      res.write(`data: ${JSON.stringify({ text: `\n\n---\n## ${section.label}\n\n` })}\n\n`);

      try {
        await this.streamGroqPrompt(section.prompt, res);

        // Gran pausa entre secciones para resetear los tokens de Groq (Llama-3 limite 6000 TPM)
        res.write(`data: ${JSON.stringify({ text: `\n\n> ⏳ *Procesando siguiente fase para evitar saturación de IA... (esperando 45s)*\n\n` })}\n\n`);
        await new Promise((r) => setTimeout(r, 45000));
      } catch (err: any) {
        this.logger.error(`Error en sección "${section.label}":`, err?.message);
        if (err?.message?.includes('429') || err?.message?.includes('quota')) {
          res.write(`data: ${JSON.stringify({ text: `\n\n> ⚠️ *Rate limit extremo alcanzado en "${section.label}". Esperando 60 segundos más...*\n\n` })}\n\n`);
          await new Promise((r) => setTimeout(r, 60000));
          // Reintento
          try {
            await this.streamGroqPrompt(section.prompt, res);
            await new Promise((r) => setTimeout(r, 45000));
          } catch (retryErr: any) {
            res.write(`data: ${JSON.stringify({ text: `\n\n> ❌ *No se pudo generar "${section.label}": ${retryErr?.message}*\n\n` })}\n\n`);
          }
        } else {
          res.write(`data: ${JSON.stringify({ text: `\n\n> ❌ *Error en "${section.label}": ${err?.message}*\n\n` })}\n\n`);
        }
      }
    }

    res.write(`data: ${JSON.stringify({ text: `\n\n---\n\n✅ **${docLabel.charAt(0).toUpperCase() + docLabel.slice(1)} generada.** Usa el botón **Descargar** para guardar el documento.\n` })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }

  /** Chat normal — uses Groq first, then Gemini as fallback */
  private async streamChat(
    message: string,
    history: Array<{ role: 'user' | 'model' | 'assistant'; parts?: string; content?: string }>,
    res: Response,
  ): Promise<void> {
    // ── Solo Groq ──────────────────────────────────────────────────────
    if (GROQ_KEY) {
      this.logger.log(`Using Groq (${GROQ_MODEL})`);
      await this.streamGroq(message, history, res);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    throw new Error('No AI provider configured. Set GROQ_API_KEY in .env');
  }

  private friendlyError(msg: string = ''): string {
    if (msg.includes('API_KEY') || msg.includes('API key')) return '⚠️ API Key de Gemini inválida. Verifica la variable GEMINI_API_KEY en el .env';
    if (msg.includes('429') || msg.includes('quota')) return '⚠️ Cuota de Gemini agotada en todos los modelos disponibles. Espera unos minutos e intenta de nuevo, o activa la facturación en https://ai.google.dev';
    if (msg.includes('SAFETY')) return '⚠️ El contenido fue bloqueado por filtros de seguridad. Reformula tu solicitud.';
    if (msg.includes('not found') || msg.includes('404')) return '⚠️ Modelo de IA no disponible. Intenta de nuevo.';
    return `⚠️ Error: ${msg.slice(0, 120) || 'desconocido'}`;
  }

  /** Generación directa sin streaming (endpoint /generate) */
  async generateThesisFull(topic: string, variables?: string, context?: string): Promise<string> {
    const sections = buildSections(topic, variables || '', context || '');
    const parts: string[] = [];

    for (const section of sections) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: THESIS_SYSTEM_PROMPT },
            { role: 'user', content: section.prompt }
          ],
          temperature: 0.8,
        }),
      });
      const data = await groqRes.json();
      parts.push(data.choices?.[0]?.message?.content || '');
      await new Promise((r) => setTimeout(r, 2000));
    }

    return parts.join('\n\n');
  }
}
