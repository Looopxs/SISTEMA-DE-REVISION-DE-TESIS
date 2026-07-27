import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBeo2XchQHHvVddCfqU1AHJMD7PYb2Ddqo';
const GEMINI_MODEL = 'gemini-3.1-flash-lite';

const REVIEWER_SYSTEM_PROMPT = `Eres un revisor académico experto y traductor científico especializado en análisis de artículos de investigación.

Tu proceso es siempre:
1. Identificar el idioma del artículo (ES o EN)
2. Analizar el contenido científico con rigor metodológico
3. Producir el informe COMPLETO con las secciones indicadas

REGLAS ESTRICTAS:
- Mantener precisión terminológica científica en todo momento
- No simplificar ni vulgarizar conceptos científicos
- No perder significado en la traducción
- Usar vocabulario académico formal
- Ser objetivo y crítico en la evaluación`;

const buildReviewPrompt = (article: string) => `Analiza el siguiente artículo científico y genera el INFORME COMPLETO con TODAS las secciones.

═══════════════════════════════════
ARTÍCULO A REVISAR:
═══════════════════════════════════
${article}
═══════════════════════════════════

Genera el siguiente informe completo:

---

## 🌐 IDENTIFICACIÓN DEL IDIOMA
Indica el idioma detectado (Español / Inglés) y justifica brevemente.

---

## 📋 RESUMEN ANALÍTICO

### 🎯 Objetivo del estudio
(Describe el objetivo principal de la investigación, la pregunta de investigación y las hipótesis planteadas. Mínimo 3 párrafos densos.)

### 🔬 Metodología
(Describe detalladamente: tipo y diseño de investigación, población/muestra, instrumentos de recolección, procedimiento, análisis estadístico o cualitativo empleado. Mínimo 3 párrafos.)

### 📊 Resultados principales
(Presenta los hallazgos más importantes con datos cuantitativos/cualitativos específicos mencionados en el artículo. Mínimo 3 párrafos.)

### ✅ Conclusiones
(Resume las conclusiones del autor, implicaciones prácticas y limitaciones reportadas. Mínimo 2 párrafos.)

---

## 🏆 EVALUACIÓN CRÍTICA

### Rigor metodológico
**Puntuación: X/10**
(Evalúa: validez interna/externa, control de variables, tamaño de muestra, instrumentos validados, análisis adecuados. Mínimo 4 párrafos críticos.)

### Relevancia científica
**Puntuación: X/10**
(Evalúa: originalidad del aporte, actualidad, impacto potencial en el campo, gap de conocimiento que aborda. Mínimo 3 párrafos.)

### Nivel de evidencia
**Clasificación:** [Nivel I / II / III / IV / V — según Oxford CEBM]
(Justifica la clasificación según la jerarquía de evidencia científica. Explica el tipo de estudio y su posición en la pirámide de evidencia.)

### Fortalezas y debilidades
| Aspecto | Fortalezas | Debilidades |
|---|---|---|
| Diseño | ... | ... |
| Muestra | ... | ... |
| Instrumentos | ... | ... |
| Análisis | ... | ... |
| Presentación | ... | ... |

### Recomendaciones para mejora
(Lista numerada con al menos 5 recomendaciones específicas y justificadas para mejorar el estudio.)

---

## 🔄 TRADUCCIÓN COMPLETA

(Si el artículo está en ESPAÑOL → traduce al INGLÉS completo y fiel)
(Si el artículo está en INGLÉS → traduce al ESPAÑOL completo y fiel)

Instrucciones:
- Mantén toda la terminología científica precisa
- Adapta expresiones idiomáticas al contexto académico del idioma destino
- Conserva la estructura original del texto
- No pierdas datos, cifras ni referencias

[TRADUCCIÓN COMPLETA AQUÍ — NO OMITIR NI RESUMIR]

---

*Revisión generada por KIMY IA · Gemini 3.1 Flash Lite · Sistema Académico UNT*`;

@Injectable()
export class ArticleReviewerService {
  private readonly logger = new Logger(ArticleReviewerService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.logger.log(`✅ ArticleReviewer | Key: ${GEMINI_KEY.slice(0, 8)}... | Model: ${GEMINI_MODEL}`);
    this.genAI = new GoogleGenerativeAI(GEMINI_KEY);
  }

  async reviewStream(article: string, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const model = this.genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: REVIEWER_SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.4, // Más bajo para mayor precisión académica
          maxOutputTokens: 65536,
        },
      });

      const prompt = buildReviewPrompt(article);
      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      this.logger.error('ArticleReviewer error:', error?.message);
      const msg = error?.message?.includes('429') || error?.message?.includes('quota')
        ? 'Cuota de Gemini agotada. Espera 1 minuto e intenta de nuevo.'
        : `Error: ${error?.message || 'desconocido'}`;
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    }
  }
}
