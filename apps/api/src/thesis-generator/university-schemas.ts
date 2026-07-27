export const getUniversitySchema = (university: string, topic: string): Array<{label: string, prompt: string}> | null => {
  const uni = university.toUpperCase();

  if (uni === 'UNAM') {
    return [
      {
        label: 'SECCIÓN 1 - Portada y Preliminares',
        prompt: `Genera las secciones preliminares de la tesis sobre: "${topic}".
Incluye COMPLETO y EXTENSO:

# UNIVERSIDAD NACIONAL AUTÓNOMA DE MÉXICO
## FACULTAD DE [Facultad afín al tema]

---
# [TÍTULO DE TESIS — específico, ≤20 palabras]
**TESIS**
**QUE PARA OBTENER EL TÍTULO DE:** [Título profesional afín]
**PRESENTA:** [Nombre Apellido]
**DIRECTOR DE TESIS:** [Nombre Apellido]
**CIUDAD DE MÉXICO — 2026**

---
## ÍNDICE
(índice completo con capítulos, subcapítulos y páginas estimadas)

## RESUMEN
(mínimo 250 palabras: planteamiento, método, resultados, conclusiones, palabras clave)

## ABSTRACT
(traducción al inglés del resumen)`
      },
      {
        label: 'SECCIÓN 2 - Capítulo 1: Planteamiento del Problema',
        prompt: `Genera el CAPÍTULO 1 completo de la tesis UNAM sobre: "${topic}".

# CAPÍTULO 1. PLANTEAMIENTO DEL PROBLEMA

Desarrolla de forma MUY EXTENSA y académica (mínimo 3000 palabras):
1.1. Antecedentes del problema (contexto nacional en México e internacional, estado del arte).
1.2. Planteamiento del problema (descripción detallada, datos estadísticos recientes de INEGI, CONAHCYT, etc.).
1.3. Preguntas de investigación (general y específicas).
1.4. Objetivos (general y específicos).
1.5. Justificación (teórica, metodológica y social/práctica).
1.6. Hipótesis o Supuestos (si aplica).

Escribe en formato APA 7, sin usar emojis. Cada sección debe tener múltiples párrafos densos.`
      },
      {
        label: 'SECCIÓN 3 - Capítulo 2: Marco Teórico',
        prompt: `Genera el CAPÍTULO 2 de la tesis UNAM sobre: "${topic}".

# CAPÍTULO 2. MARCO TEÓRICO Y CONCEPTUAL

Desarrolla de forma MUY EXTENSA (mínimo 4000 palabras):
- Revisión teórica exhaustiva de las variables de estudio.
- Principales teorías que sustentan la investigación.
- Marco conceptual (definiciones clave con citas APA 7).
- Marco legal o normativo (si aplica al tema en México).

Debes integrar citas en el texto bajo norma APA 7. Usa lenguaje formal, tercera persona.`
      },
      {
        label: 'SECCIÓN 4 - Capítulo 3: Metodología',
        prompt: `Genera el CAPÍTULO 3 de la tesis UNAM sobre: "${topic}".

# CAPÍTULO 3. METODOLOGÍA

Desarrolla de forma MUY EXTENSA (mínimo 3000 palabras):
3.1. Enfoque y diseño de la investigación.
3.2. Población y muestra (criterios de selección).
3.3. Técnicas e instrumentos de recolección de datos (validez y confiabilidad).
3.4. Procedimiento de recolección.
3.5. Estrategia de análisis de datos.
3.6. Consideraciones éticas.

Asegúrate de justificar metodológicamente cada elección citando a autores reconocidos (ej. Hernández-Sampieri, Creswell).`
      },
      {
        label: 'SECCIÓN 5 - Referencias y Anexos',
        prompt: `Genera las secciones finales de la tesis UNAM sobre: "${topic}".

# REFERENCIAS

Lista completa de mínimo 35 referencias en formato APA 7.a edición ESTRICTO, ordenadas alfabéticamente.
Incluye autores, año, título, fuente, DOI. Separa cada referencia con un salto de línea.
Usa fuentes mexicanas (Scielo México, Redalyc, UNAM) e internacionales de alto impacto.

---
# ANEXOS
- Matriz de congruencia (tabla completa).
- Instrumento de medición (ej. cuestionario o guía de entrevista).`
      }
    ];
  }

  if (uni === 'PUCP') {
    return [
      {
        label: 'SECCIÓN 1 - Título, Planteamiento y Estado de la Cuestión',
        prompt: `Genera la primera parte del Plan de Tesis PUCP sobre: "${topic}".

# PONTIFICIA UNIVERSIDAD CATÓLICA DEL PERÚ
## FACULTAD DE CIENCIAS Y ARTES DE LA COMUNICACIÓN

---
# 1. Título de la investigación
(Debe señalar con precisión el estudio que pretende realizar. Provisional y sujeto a modificación).

# 2. Planteamiento, justificación y delimitación del tema de investigación
(Presentar el tema precisando la problemática. Identificar el proceso comunicativo y actores involucrados. Precisar el enfoque. Justificar las razones de la elección. Delimitar el caso espacial y temporalmente. Extensión mínima: 1500 palabras).

# 3. Estado de la cuestión
(Presentar principales autores y sus ideas tras indagar quiénes han estudiado el campo. Extensión mínima: 1500 palabras).

# 4. Pregunta de investigación e hipótesis
(Formular la pregunta principal de conocimiento. Dar una respuesta provisional / hipótesis breve, clara y concisa).`
      },
      {
        label: 'SECCIÓN 2 - Objetivos y Marco Teórico',
        prompt: `Genera la segunda parte del Plan de Tesis PUCP sobre: "${topic}".

# 5. Objetivos de la investigación
(Presentar los objetivos principales claros y precisos que desea alcanzar con la tesis).

# 6. Avance del marco teórico
(Desarrollar el marco conceptual. Precisar y definir los principales conceptos que guían el estudio. Coherente con el enfoque elegido. Apoyarse en publicaciones académicas. Citar según Normas APA. Desarrollar una argumentación, no solo un listado. Extensión mínima: 2000 palabras).`
      },
      {
        label: 'SECCIÓN 3 - Metodología e Índice',
        prompt: `Genera la tercera parte del Plan de Tesis PUCP sobre: "${topic}".

# 7. Diseño metodológico
(En concordancia con el enfoque, presentar metodología/herramientas. Explicitar criterio para recoger información, constitución de corpus y técnicas adecuadas. Extensión mínima: 1000 palabras).

# 8. Tabla de contenidos provisional de la tesis
(Índice tentativo enumerando cada capítulo y subdivisión: 1., 1.1., 1.2., etc., mostrando distinción de temas y subtemas).`
      },
      {
        label: 'SECCIÓN 4 - Cronograma y Bibliografía',
        prompt: `Genera la última parte del Plan de Tesis PUCP sobre: "${topic}".

# 9. Plan de trabajo y cronograma
(Cuadro que muestre las etapas del trabajo en 6 meses: elaboración de marco teórico, trabajo de campo/corpus, descripción/análisis, redacción, corrección final).

# 10. Bibliografía
(Bibliografía del proyecto tomando en consideración autores importantes y líneas de especialidad, siguiendo rigurosamente las Normas APA. Lista cada fuente en una línea separada).`
      }
    ];
  }

  if (uni === 'UBA') {
    return [
      {
        label: 'SECCIÓN 1 - Carátula e Introducción',
        prompt: `Genera la primera parte de la tesis UBA sobre: "${topic}".

# UNIVERSIDAD DE BUENOS AIRES
## FACULTAD DE [Facultad afín]

# [TÍTULO DE TESIS]
**Trabajo de Tesis de Grado/Posgrado**
**Tesista:** [Nombre Apellido]
**Director:** [Nombre Apellido]
**Buenos Aires, Argentina — 2026**

---
# INTRODUCCIÓN

Extensión mínima: 3000 palabras.
- Presentación del tema y área temática.
- Relevancia y justificación en el contexto argentino y latinoamericano.
- Formulación del problema de investigación.
- Objetivos generales y específicos.
- Hipótesis o conjeturas.
- Estructura de la tesis.`
      },
      {
        label: 'SECCIÓN 2 - Marco Teórico / Estado del Arte',
        prompt: `Genera el MARCO TEÓRICO de la tesis UBA sobre: "${topic}".

# MARCO TEÓRICO Y ESTADO DEL ARTE

Extensión mínima: 4000 palabras.
- Revisión bibliográfica exhaustiva (nacional e internacional).
- Discusión de los principales paradigmas teóricos sobre el tema.
- Marco conceptual operativo.
Usa citas en formato APA 7. Lenguaje académico formal y reflexivo, típico de la academia argentina.`
      },
      {
        label: 'SECCIÓN 3 - Diseño Metodológico',
        prompt: `Genera la METODOLOGÍA de la tesis UBA sobre: "${topic}".

# DISEÑO METODOLÓGICO

Extensión mínima: 3000 palabras.
- Estrategia metodológica (cualitativa, cuantitativa o mixta).
- Universo, población y selección de la muestra/casos.
- Técnicas de recolección de datos.
- Técnicas de procesamiento y análisis.
- Reflexividad metodológica y consideraciones éticas.`
      },
      {
        label: 'SECCIÓN 4 - Bibliografía y Anexos',
        prompt: `Genera las secciones finales de la tesis UBA sobre: "${topic}".

# BIBLIOGRAFÍA
Lista completa de mínimo 35 fuentes en formato APA 7.a edición.

# ANEXOS
- Cuadros estadísticos, matrices de datos, guías de pautas, etc.`
      }
    ];
  }

  if (uni === 'UCM') {
    return [
      {
        label: 'SECCIÓN 1 - Portada y Resumen',
        prompt: `Genera las preliminares de la tesis UCM sobre: "${topic}".

# UNIVERSIDAD COMPLUTENSE DE MADRID
## FACULTAD DE [Facultad afín]

# [TÍTULO DE LA TESIS]
**Memoria para optar al grado de [Doctor/Grado/Máster]**
**Presentada por:** [Nombre Apellido]
**Dirigida por:** [Nombre Apellido]
**Madrid, España — 2026**

---
## RESUMEN / ABSTRACT
(Resumen en español y en inglés, mínimo 350 palabras, detallando objeto de estudio, metodología y conclusiones principales).
## ÍNDICE DE CONTENIDOS`
      },
      {
        label: 'SECCIÓN 2 - Capítulo I: Introducción y Estado de la Cuestión',
        prompt: `Genera el CAPÍTULO I de la tesis UCM sobre: "${topic}".

# CAPÍTULO I. INTRODUCCIÓN Y ESTADO DE LA CUESTIÓN

Extensión mínima: 4000 palabras.
1.1. Justificación y motivación de la investigación.
1.2. Objetivos e Hipótesis de partida.
1.3. Estado de la cuestión (revisión crítica de la literatura en España, Europa e internacional).
1.4. Marco teórico y conceptual.

Usa citas APA 7. Estilo académico riguroso europeo.`
      },
      {
        label: 'SECCIÓN 3 - Capítulo II: Metodología',
        prompt: `Genera el CAPÍTULO II de la tesis UCM sobre: "${topic}".

# CAPÍTULO II. METODOLOGÍA

Extensión mínima: 3000 palabras.
2.1. Diseño de la investigación.
2.2. Ámbito temporal y espacial.
2.3. Muestra y fuentes de información.
2.4. Instrumentos y técnicas de recogida de datos.
2.5. Métodos de análisis de datos.`
      },
      {
        label: 'SECCIÓN 4 - Bibliografía',
        prompt: `Genera las secciones finales de la tesis UCM sobre: "${topic}".

# BIBLIOGRAFÍA
Lista exhaustiva (mínimo 35 referencias) en APA 7.

# ANEXOS
- Tablas adicionales, gráficos y cuestionarios.`
      }
    ];
  }

  if (uni === 'INTERNACIONAL') {
    return [
      {
        label: 'SECCIÓN 1 - Title Page & Abstract',
        prompt: `Genera las preliminares de la tesis (formato Internacional Harvard/MIT en español) sobre: "${topic}".

# [INSTITUTION NAME]

# [RESEARCH TITLE]
**A Thesis Submitted to the Faculty in Partial Fulfillment of the Requirements for the Degree**
**By:** [Author Name]
**Advisor:** [Advisor Name]
**2026**

---
## ABSTRACT
(Resumen estructurado: Background, Objective, Methods, Expected Results, Conclusion. Mínimo 350 palabras).
## TABLE OF CONTENTS`
      },
      {
        label: 'SECCIÓN 2 - Chapter 1: Introduction & Literature Review',
        prompt: `Genera el CAPÍTULO 1 (Introducción y Revisión de Literatura) sobre: "${topic}".

# CHAPTER 1: INTRODUCTION AND LITERATURE REVIEW

Extensión mínima: 4000 palabras. (Escribe el contenido en ESPAÑOL pero con la estructura internacional).
1.1. Background of the Study.
1.2. Problem Statement.
1.3. Research Questions & Objectives.
1.4. Significance of the Study.
1.5. Literature Review (Thematic review of current state-of-the-art).
1.6. Theoretical Framework.`
      },
      {
        label: 'SECCIÓN 3 - Chapter 2: Methodology',
        prompt: `Genera el CAPÍTULO 2 (Metodología) sobre: "${topic}".

# CHAPTER 2: METHODOLOGY

Extensión mínima: 3000 palabras. (Contenido en español).
2.1. Research Design.
2.2. Participants and Sampling.
2.3. Instrumentation.
2.4. Data Collection Procedures.
2.5. Data Analysis Plan.
2.6. Ethical Considerations.`
      },
      {
        label: 'SECCIÓN 4 - References & Appendices',
        prompt: `Genera las secciones finales sobre: "${topic}".

# REFERENCES
APA 7 format (mínimo 35 referencias).

# APPENDICES
Appendix A: Consistency Matrix.
Appendix B: Survey Instruments.`
      }
    ];
  }

  // Si no coincide, retorna null para que el servicio use el default o el dinámico
  return null;
};
