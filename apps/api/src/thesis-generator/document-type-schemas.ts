/**
 * Schemas por tipo de documento académico.
 * Cada función retorna un array de secciones con label y prompt
 * que la IA generará secuencialmente.
 */

// ── PROYECTO DE TESIS (Plan / Anteproyecto) ───────────────────────────────────
export const buildProyectoSections = (topic: string, vars: string, ctx: string) => [
  {
    label: 'SECCIÓN 1 - Datos Generales y Planteamiento del Problema',
    prompt: `Genera la primera parte del PROYECTO DE TESIS (Plan de Tesis / Anteproyecto) sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}
${ctx ? `Contexto: ${ctx}` : ''}

IMPORTANTE: Este es un PROYECTO DE TESIS (plan), NO una tesis final. Es el documento que el estudiante presenta ANTES de ejecutar la investigación. Redacta en FUTURO ("se realizará", "se aplicará").

Incluye COMPLETO y EXTENSO:

# I. GENERALIDADES

## 1.1. Título del Proyecto
(Título completo, claro, preciso, con variables y contexto. ≤20 palabras)

## 1.2. Autor
(Datos del autor)

## 1.3. Asesor
(Datos del asesor)

## 1.4. Tipo de Investigación
(Según finalidad, nivel, diseño y enfoque. Justifica cada elección con autores metodológicos)

## 1.5. Régimen de Investigación
(Libre / Orientada)

## 1.6. Localidad e Institución donde se realizará el Proyecto
(Nombre de la institución, dirección, localidad)

## 1.7. Duración del Proyecto
(Fecha de inicio y fin estimadas, duración en meses)

## 1.8. Cronograma tentativo
(Lista de actividades principales con semanas estimadas)

---

# II. PLAN DE INVESTIGACIÓN

## 2.1. Realidad Problemática
(Mínimo 2000 palabras. Contexto global, latinoamericano, nacional peruano y local. Estadísticas reales de UNESCO, BM, INEI. Describe con detalle el problema. Genera un diagrama de Ishikawa usando \`\`\`mermaid\`\`\`)

## 2.2. Antecedentes
(Mínimo 2500 palabras. Al menos 12 antecedentes: 4 internacionales, 4 nacionales, 2 locales, 2 tesis posgrado. Cada uno con párrafo completo: autores, año, título, objetivo, método, resultados, conclusión, relación con la investigación. Formato APA 7)`
  },
  {
    label: 'SECCIÓN 2 - Marco Teórico, Justificación y Formulación',
    prompt: `Continúa el PROYECTO DE TESIS sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}

Recuerda: Esto es un PROYECTO (plan), redacta en FUTURO. Mínimo 4000 palabras en esta sección.

## 2.3. Marco Teórico
(Mínimo 2500 palabras. 4 pilares teóricos:
- Pilar 1: Variable independiente (definición, evolución, componentes, modelos, 600+ palabras)
- Pilar 2: Variable dependiente (misma estructura, 600+ palabras)
- Pilar 3: Marco tecnológico/metodológico (herramientas, frameworks, 500+ palabras)
- Pilar 4: Marco normativo (leyes peruanas, normas ISO/IEEE, 400+ palabras))

## 2.4. Justificación del Estudio
(Mínimo 600 palabras total:
- Justificación teórica (200+ palabras)
- Justificación práctica (200+ palabras)
- Justificación metodológica (200+ palabras))

## 2.5. Formulación del Problema
(Pregunta de investigación principal clara y específica)

## 2.6. Hipótesis
- Hipótesis general (enunciado declarativo)
- Hipótesis operacional (con Vi, Vd y relación)

## 2.7. Objetivos
- Objetivo General (verbo en infinitivo, Vi, Vd, contexto)
- Objetivos Específicos (5 objetivos SMART con verbos distintos)

## 2.8. Limitaciones de la Investigación
(Mínimo 5 limitaciones justificadas)`
  },
  {
    label: 'SECCIÓN 3 - Metodología Propuesta',
    prompt: `Continúa el PROYECTO DE TESIS sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}

Recuerda: Esto es un PROYECTO, redacta como PLAN a futuro ("se utilizará", "se aplicará"). Mínimo 3000 palabras.

# III. METODOLOGÍA PROPUESTA

## 3.1. Tipo y Nivel de Investigación
(Justifica detalladamente con autores como Hernández-Sampieri, Bernal)

## 3.2. Diseño de Investigación
(Diseño específico con esquema simbólico. Justificación con autores)

## 3.3. Población, Muestra y Muestreo
(Población con criterios de inclusión/exclusión. Fórmula estadística con cálculo paso a paso)

## 3.4. Variables y Operacionalización
(Tabla markdown COMPLETA: Variable | Dimensión | Indicador | Escala | Instrumento — mínimo 8 filas)

## 3.5. Técnicas e Instrumentos de Recolección de Datos
(Tabla: N° | Técnica | Instrumento | Fuente | Propósito)

## 3.6. Procedimiento y Método de Análisis de Datos
(Software, estadística descriptiva e inferencial, pruebas específicas)

## 3.7. Consideraciones Éticas
(Consentimiento informado, confidencialidad, Ley 29733, Helsinki, CONCYTEC)`
  },
  {
    label: 'SECCIÓN 4 - Aspectos Administrativos y Referencias',
    prompt: `Continúa el PROYECTO DE TESIS sobre: "${topic}".

Genera las secciones finales del proyecto. Mínimo 2000 palabras con tablas detalladas.

# IV. ASPECTOS ADMINISTRATIVOS

## 4.1. Recursos (Personal, Bienes, Servicios, Tecnológicos — tablas detalladas)
## 4.2. Presupuesto (tablas por rubro con montos en S/ y resumen consolidado)
## 4.3. Financiamiento (fuentes con porcentajes)
## 4.4. Cronograma de Actividades (tabla Gantt con 15+ actividades en 24 semanas)

---

# V. REFERENCIAS BIBLIOGRÁFICAS

Lista COMPLETA de mínimo 30 referencias en formato APA 7.a edición ESTRICTO, ordenadas ALFABÉTICAMENTE.
DISTRIBUCIÓN: 12 artículos de revistas indexadas con DOI, 6 en inglés, 5 libros/capítulos, 4 tesis posgrado, 3 reportes de organismos internacionales.
Una referencia por línea. Línea en blanco entre cada una.

---

# VI. ANEXOS
## Anexo A: Matriz de Consistencia (tabla completa)
## Anexo B: Instrumento de Recolección (cuestionario con 15+ ítems Likert)
## Anexo C: Declaración Jurada de Originalidad`
  },
];

// ── ARTÍCULO DE INVESTIGACIÓN ────────────────────────────────────────────────
export const buildArticuloSections = (topic: string, vars: string, ctx: string) => [
  {
    label: 'SECCIÓN 1 - Título, Resumen e Introducción',
    prompt: `Genera la primera parte de un ARTÍCULO DE INVESTIGACIÓN CIENTÍFICA sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}
${ctx ? `Contexto: ${ctx}` : ''}

IMPORTANTE: Este es un ARTÍCULO CIENTÍFICO para publicación en revista indexada. Debe ser CONCISO pero RIGUROSO. Formato IMRaD (Introduction, Methods, Results, Discussion).

IMPORTANTE: NO generes el título, autores ni datos institucionales. Esos datos ya se agregan automáticamente al documento final. Comienza directamente con el resumen.

Genera:

## RESUMEN
(Estrictamente 4 párrafos:
Párrafo 1: Objetivo o hipótesis de la investigación.
Párrafo 2: Metodología utilizada y diseño.
Párrafo 3: Síntesis de resultados (tasas, porcentajes, proporciones).
Párrafo 4: Conclusiones principales del estudio.
Sin citas bibliográficas ni abreviaturas no definidas)
**Palabras clave:** (Mínimo 3 y máximo 5 palabras, que ayuden a ubicar el tema principal)

## ABSTRACT
(OBLIGATORIO: ESTA SECCIÓN DEBE ESTAR ESCRITA COMPLETAMENTE EN IDIOMA INGLÉS. Traducción fiel al inglés del resumen, misma extensión y estructura en 4 párrafos)
**Keywords:** (Traducción fiel de las palabras clave al inglés)

---

## 1. INTRODUCCIÓN
(Debe ser EXTENSA, PROFUNDA y responder con alto rigor académico a las siguientes preguntas: ¿Qué se conoce y cree del problema? ¿Cuál es el problema no resuelto o la pregunta de investigación? ¿Cuál es la hipótesis, la meta y los objetivos? La introducción tiene como fin presentar al lector el porqué se realizó el estudio y animarlo a leer el resto del artículo. Desarrolla ampliamente el marco teórico, el estado del arte y la revisión de literatura. Debe escribirse en tiempo PRESENTE y extenderse por un MÍNIMO DE 8 a 12 PÁRRAFOS LARGOS. Integra múltiples citas en el texto con formato APA 7.
IMPORTANTE: Solo incluye las citas dentro del texto. PROHIBIDO generar la lista de referencias o bibliografía al final de esta sección. Solo incluye el texto de la introducción.)`
  },
  {
    label: 'SECCIÓN 2 - Materiales y Métodos',
    prompt: `Continúa el ARTÍCULO DE INVESTIGACIÓN sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}

Mínimo 1500 palabras. Debe ser lo suficientemente detallado para que otro investigador pueda replicar el estudio.

## 2. MATERIALES Y MÉTODOS (o METODOLOGÍA)

### 2.1. Diseño del estudio
(Tipo de investigación, enfoque, diseño específico con justificación)

### 2.2. Participantes / Población y muestra
(Criterios de selección, tamaño muestral con fórmula, técnica de muestreo)

### 2.3. Instrumentos de recolección de datos
(Descripción detallada de cada instrumento, validez y confiabilidad con coeficientes)

### 2.4. Procedimiento
(Pasos detallados de recolección de datos, consideraciones éticas)

### 2.5. Análisis de datos
(Software utilizado, pruebas estadísticas específicas con justificación, nivel de significancia)`
  },
  {
    label: 'SECCIÓN 3 - Resultados y Discusión',
    prompt: `Continúa el ARTÍCULO DE INVESTIGACIÓN sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}

## 3. RESULTADOS
(Reportan los datos esencialmente numéricos obtenidos. Presentan tablas y figuras autoexplicativas que dan sensación de orden y disciplina. Son lo más importante del manuscrito. Menciona las pruebas estadísticas utilizadas y los resultados que fueron estadísticamente significativos para responder la hipótesis y al final, aquellos resultados negativos o no acordes a lo que se esperaba. NO INTERPRETES, SOLO REPORTA.)

## 4. DISCUSIÓN
(Argumenta los resultados en relación con los objetivos originales y los estudios previos similares; plantea las limitaciones y las fortalezas del estudio, y la necesidad de futuras investigaciones. Se deben evitar las conjeturas, generalizar, inferir y extrapolar de manera injustificada teorías sin fundamento. Contrasta con los antecedentes.)`
  },
  {
    label: 'SECCIÓN 4 - Conclusiones, Agradecimientos y Referencias',
    prompt: `Continúa el ARTÍCULO DE INVESTIGACIÓN sobre: "${topic}".

## 5. CONCLUSIONES
(Interpretan en un nivel de abstracción más alto los resultados deducibles, sin repetirlos. No se debe confundir con el resumen ni la introducción. Dan lugar a consideraciones finales del estudio para la comunidad científica.)

## 6. AGRADECIMIENTOS
(Mencionan aquellas instituciones o personas naturales que, sin ser autores, ayudaron en la construcción, revisión o redacción del manuscrito o la investigación.)

## 7. CONFLICTO DE INTERESES
(Declaración de ausencia o presencia de conflictos)

## 8. CONTRIBUCIÓN DE AUTORES
(Roles según taxonomía CRediT: Conceptualización, Metodología, Análisis, Redacción, etc.)

---

## REFERENCIAS
(Debe presentarse según las recomendaciones de las revistas. Usa formato APA 7 ESTRICTO o Vancouver, según proceda. Los descriptores de las referencias deben coincidir con los del título del artículo. Mínimo 30 referencias ordenadas.
DISTRIBUCIÓN OBLIGATORIA:
- 15 artículos de revistas indexadas (Scopus, WoS, SciELO) con DOI — últimos 5 años preferentemente
- 8 artículos en inglés de revistas internacionales con DOI
- 4 libros o capítulos académicos
- 3 reportes de organismos internacionales
Una referencia por línea con línea en blanco entre cada una.)`
  },
];

// ── ARTÍCULO DE INVESTIGACIÓN (TARAPOTO - TERCERA UNIDAD) ────────────────────
export const buildArticuloTarapotoIntroSections = (topic: string, vars: string, ctx: string) => [
  {
    label: 'SECCIÓN 1 - Título, Autores, Resumen y Abstract',
    prompt: `Genera la primera parte del ARTÍCULO CIENTÍFICO para la Revista de Ingeniería de Sistemas de Tarapoto sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}
${ctx ? `Contexto: ${ctx}` : ''}

IMPORTANTE: El formato debe seguir ESTRICTAMENTE las directrices de la Revista de Ingeniería de Sistemas de Tarapoto.

IMPORTANTE: NO generes el título, autores ni datos institucionales. Esos datos ya se agregan automáticamente al documento final. Comienza directamente con el resumen.

Genera:

## Resumen
(Debe contener entre 150 y 200 palabras, redactado en un solo párrafo, en tiempo pasado. Debe incluir: justificación, objetivo, materiales y métodos, resultados y conclusiones).

**Palabras clave:** (Tres a cinco palabras clave, en orden alfabético y separadas por comas).

## Abstract
(Traducción fiel del resumen al inglés).

**Keywords:** (Traducción fiel de las palabras clave al inglés).`
  },
  {
    label: 'SECCIÓN 2 - Introducción',
    prompt: `Continúa el ARTÍCULO CIENTÍFICO para la Revista de Ingeniería de Sistemas de Tarapoto sobre: "${topic}".
${vars ? `Variables: ${vars}` : ''}

IMPORTANTE: Esta sección es estrictamente la introducción. No generes subtítulos.

## Introducción
(Desarrolla el problema de investigación, su relevancia/justificación, breve revisión de literatura actual y/o teorías que la sustentan, el vacío científico existente y el propósito de la investigación).

Reglas estrictas:
- Redactado en TIEMPO PRESENTE.
- La introducción debe ser EXTENSA y PROFUNDA (Mínimo de 8 a 15 párrafos largos).
- Desarrolla un marco teórico riguroso y estado del arte detallado.
- Respalda el problema con fuentes confiables (preferentemente artículos científicos de menos de 5 años de antigüedad en formato APA 7). Solo incluye las citas dentro del texto (ejemplo: Pérez, 2023).
- PROHIBIDO generar la lista de "Referencias" o "Bibliografía" al final. Solo incluye el texto de la introducción.
- NO uses subtítulos.`
  }
];
