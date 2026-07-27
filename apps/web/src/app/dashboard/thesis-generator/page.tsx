'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Download, Trash2, Sparkles, Loader2, BookOpen, ChevronDown, FileCode, FileText, FileType, GraduationCap, StopCircle, Settings, Clock, Plus, MessageSquare, FileEdit, Mic, MicOff, Eye, X } from 'lucide-react';
import Cookies from 'js-cookie';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api';
import ubigeo from 'ubigeo-peru';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date | string;
  streaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}

const DOC_TYPES = [
  { id: 'tesis', label: 'Tesis', icon: '📄', description: 'Informe de tesis completo' },
  { id: 'proyecto', label: 'Proyecto de Tesis', icon: '📋', description: 'Plan / Anteproyecto' },
  { id: 'articulo', label: 'Artículo Científico', icon: '📰', description: 'Paper de investigación' },
] as const;

const QUICK_PROMPTS_BY_TYPE: Record<string, Array<{label: string, value: string}>> = {
  tesis: [
    { label: '📘 Tesis sobre IA en salud', value: 'Genera una tesis completa sobre el uso de inteligencia artificial para el diagnóstico médico en hospitales del Perú.' },
    { label: '🔐 Tesis de Ciberseguridad', value: 'Genera una tesis completa sobre implementación de un sistema de detección de intrusiones usando machine learning para PYMES peruanas.' },
    { label: '📊 Tesis de Big Data', value: 'Genera una tesis completa sobre análisis de Big Data para la predicción del rendimiento académico universitario en la UNT.' },
    { label: '💡 Propuesta de título', value: 'Dame 5 propuestas de título de tesis para el área de ciberseguridad con sus variables y objetivo general.' },
  ],
  proyecto: [
    { label: '📋 Proyecto sobre ML', value: 'Genera un proyecto de tesis sobre implementación de un modelo de machine learning para la detección temprana de plagas en cultivos de la región La Libertad.' },
    { label: '📋 Proyecto sobre IoT', value: 'Genera un proyecto de tesis sobre un sistema IoT para monitoreo ambiental en tiempo real en zonas urbanas de Trujillo.' },
    { label: '📋 Proyecto sobre Blockchain', value: 'Genera un proyecto de tesis sobre uso de blockchain para la trazabilidad de productos agrícolas en la cadena de suministro peruana.' },
    { label: '💡 Ideas de proyecto', value: 'Dame 5 propuestas de proyecto de tesis para el área de inteligencia artificial aplicada a la educación, con variables y objetivo general.' },
  ],
  articulo: [
    { label: '📰 Artículo sobre Deep Learning', value: 'Genera un artículo de investigación sobre aplicación de deep learning para el procesamiento de imágenes médicas en el diagnóstico de cáncer.' },
    { label: '📰 Artículo sobre NLP', value: 'Genera un artículo de investigación sobre procesamiento de lenguaje natural para el análisis de sentimientos en redes sociales peruanas.' },
    { label: '📰 Artículo sobre Cloud Computing', value: 'Genera un artículo de investigación sobre migración a cloud computing y su impacto en la productividad de PYMES peruanas.' },
    { label: '💡 Ideas de artículo', value: 'Dame 5 propuestas de títulos para artículos de investigación en el área de ciberseguridad con sus variables.' },
  ],
};

export default function ThesisGeneratorPage() {
  const getWelcomeMessage = (docType: string) => {
    if (docType === 'proyecto') return `# Bienvenido al Asistente JORANA AI\n\nEste sistema está configurado para estructurar **proyectos de tesis (anteproyectos)** en estricto cumplimiento con la normativa y los esquemas específicos de su institución académica.\n\n### Capacidades del Sistema:\n\n- **Estructuración Integral:** Generación completa del proyecto (generalidades, plan de investigación, metodología propuesta y aspectos administrativos).\n- **Asesoría Académica:** Propuesta formal de títulos y definición de variables de investigación.\n- **Revisión Metodológica:** Análisis y mejora de secciones específicas del documento.\n- **Gestión Documental:** Sugerencia de referencias bibliográficas indexadas.\n\n### Instrucciones de Uso:\n> Ingrese un comando formal, por ejemplo: _"Estructura un proyecto de tesis enfocado en [tema de investigación]"_, o seleccione una de las acciones rápidas sugeridas.`;
    if (docType === 'articulo') return `# Bienvenido al Asistente JORANA AI\n\nEste sistema ha sido diseñado para la redacción de **artículos de investigación científica** adaptándose al formato requerido (como IMRaD) y a las normativas de revistas indexadas.\n\n### Capacidades del Sistema:\n\n- **Redacción Académica:** Desarrollo completo del artículo científico, desde el título bilingüe hasta las referencias.\n- **Asesoría Especializada:** Formulación de títulos orientados a publicación y variables.\n- **Revisión Crítica:** Evaluación y mejora de secciones analíticas.\n- **Soporte de Fuentes:** Sugerencia de referencias bibliográficas de bases de datos indexadas.\n\n### Instrucciones de Uso:\n> Ingrese su solicitud, por ejemplo: _"Redacta un artículo de investigación sobre [tema de estudio]"_, o emplee una de las acciones predefinidas.`;
    return `# Bienvenido al Asistente JORANA AI\n\nEl sistema se encuentra especializado en la generación y revisión de **informes de tesis completos**, operando bajo las directrices institucionales y esquemas específicos de su universidad.\n\n### Capacidades del Sistema:\n\n- **Generación Documental:** Redacción integral de la tesis, desde la cubierta hasta los anexos.\n- **Diseño Metodológico:** Formulación de títulos de investigación y estructuración de variables.\n- **Corrección de Estilo:** Revisión técnica y refinamiento de apartados específicos.\n- **Respaldo Bibliográfico:** Búsqueda y sugerencia de referencias académicas reales.\n\n### Instrucciones de Uso:\n> Para iniciar el proceso, describa su requerimiento: _"Genera una tesis sobre [tema de investigación]"_, o utilice los accesos directos disponibles.`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'model',
      content: getWelcomeMessage('tesis'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showSchemaMenu, setShowSchemaMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'preview'>('chat');
  const [university, setUniversity] = useState<string[]>(['UNT']);
  const [documentType, setDocumentType] = useState('tesis');
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [authors, setAuthors] = useState([{ name: 'Nombre del Autor', orcid: '0000-0000-0000-0000', email: 'correo@institucion.edu.pe' }]);
  const [advisorName, setAdvisorName] = useState('Nombre del Asesor');
  const [selectedRegion, setSelectedRegion] = useState('13'); // La Libertad
  const [selectedProvince, setSelectedProvince] = useState('01'); // Trujillo
  const [selectedDistrict, setSelectedDistrict] = useState('01'); // Trujillo
  const [year, setYear] = useState('2026');
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const schemaMenuRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [interimInput, setInterimInput] = useState('');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [thesisTitle, setThesisTitle] = useState('');
  const [faculty, setFaculty] = useState('Facultad de Ingeniería');
  const [school, setSchool] = useState('Escuela de Ingeniería de Sistemas');

  const PERUVIAN_UNIVERSITIES = [
    "Universidad Nacional de Trujillo (UNT)",
    "Universidad Nacional Mayor de San Marcos (UNMSM)",
    "Universidad Nacional de Ingeniería (UNI)",
    "Universidad de Lima (ULIMA)",
    "Pontificia Universidad Católica del Perú (PUCP)",
    "Universidad Peruana Cayetano Heredia (UPCH)",
    "Universidad Nacional de San Agustín (UNSA)",
    "Universidad Nacional de San Antonio Abad del Cusco (UNSAAC)",
    "Universidad del Pacífico (UP)",
    "Universidad Privada Antenor Orrego (UPAO)",
    "Universidad Privada del Norte (UPN)",
    "Universidad César Vallejo (UCV)",
    "Universidad Tecnológica del Perú (UTP)",
    "Universidad Peruana de Ciencias Aplicadas (UPC)",
    "Universidad Científica del Sur (UCSUR)",
    "Universidad de Piura (UDEP)",
    "Universidad Nacional de Piura (UNP)",
    "Universidad Nacional del Altiplano (UNAP)",
    "Universidad Nacional de San Martín (UNSM)",
    "Universidad Nacional de Cajamarca (UNC)",
    "Universidad de San Martín de Porres (USMP)",
    "Universidad Ricardo Palma (URP)",
    "Universidad Nacional Federico Villarreal (UNFV)",
    "Universidad Nacional del Callao (UNAC)",
    "Universidad Nacional Agraria La Molina (UNALM)",
    "Otra Universidad..."
  ];
  const [selectedUniversity, setSelectedUniversity] = useState(PERUVIAN_UNIVERSITIES[0]);

  const RESEARCH_LINES: Record<string, string[]> = {
    "Ingeniería de Sistemas / Informática": [
      "Desarrollo de Sistemas Web y Aplicaciones Móviles",
      "Tecnologías de la Información y Comunicación (TIC)",
      "Inteligencia Artificial y Ciencia de Datos",
      "Ingeniería de Software y Sistemas de Información",
      "Ciberseguridad y Auditoría Informática",
      "Redes y Telecomunicaciones"
    ],
    "Ingeniería Civil / Arquitectura": [
      "Diseño Sísmico y Estructural",
      "Geotecnia y Mecánica de Suelos",
      "Ingeniería de Transportes y Vías",
      "Hidráulica y Recursos Hídricos",
      "Urbanismo y Planificación Territorial"
    ],
    "Ingeniería Industrial": [
      "Gestión de Operaciones y Logística",
      "Seguridad y Salud Ocupacional",
      "Gestión de la Calidad",
      "Ergonomía y Diseño del Trabajo"
    ],
    "Medicina y Ciencias de la Salud": [
      "Salud Pública y Epidemiología",
      "Enfermedades Infecciosas y Tropicales",
      "Enfermedades Crónicas No Transmisibles",
      "Salud Materno-Infantil",
      "Nutrición y Dietética"
    ],
    "Derecho y Ciencias Políticas": [
      "Derecho Constitucional y Derechos Humanos",
      "Derecho Penal y Criminología",
      "Derecho Civil y Corporativo",
      "Derecho Laboral y Seguridad Social"
    ],
    "Administración y Contabilidad": [
      "Gestión Empresarial y Emprendimiento",
      "Finanzas y Mercados de Capitales",
      "Marketing y Comportamiento del Consumidor",
      "Auditoría y Tributación"
    ],
    "Educación y Psicología": [
      "Innovación y Tecnología Educativa",
      "Psicología Clínica y de la Salud",
      "Psicología Organizacional",
      "Educación Inclusiva y Diversidad"
    ],
    "Ciencias Sociales y Humanidades": [
      "Sociología y Antropología",
      "Comunicación y Medios",
      "Historia y Patrimonio Cultural"
    ]
  };
  const [researchLine, setResearchLine] = useState(RESEARCH_LINES["Ingeniería de Sistemas / Informática"][0]);

  const regions = ubigeo.reniec.filter((u: any) => u.provincia === '00' && u.distrito === '00');
  const provinces = ubigeo.reniec.filter((u: any) => u.departamento === selectedRegion && u.provincia !== '00' && u.distrito === '00');
  const districts = ubigeo.reniec.filter((u: any) => u.departamento === selectedRegion && u.provincia === selectedProvince && u.distrito !== '00');

  const locationString = (() => {
    const province = provinces.find((p: any) => p.provincia === selectedProvince)?.nombre || '';
    return province ? `${province.toUpperCase()}   PERÚ` : 'PERÚ';
  })();

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newReg = e.target.value;
    setSelectedRegion(newReg);
    const newProvs = ubigeo.reniec.filter((u: any) => u.departamento === newReg && u.provincia !== '00' && u.distrito === '00');
    const firstProv = newProvs[0]?.provincia || '01';
    setSelectedProvince(firstProv);
    const newDists = ubigeo.reniec.filter((u: any) => u.departamento === newReg && u.provincia === firstProv && u.distrito !== '00');
    setSelectedDistrict(newDists[0]?.distrito || '01');
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProv = e.target.value;
    setSelectedProvince(newProv);
    const newDists = ubigeo.reniec.filter((u: any) => u.departamento === selectedRegion && u.provincia === newProv && u.distrito !== '00');
    setSelectedDistrict(newDists[0]?.distrito || '01');
  };

  const addAuthor = () => setAuthors([...authors, { name: '', orcid: '', email: '' }]);
  const removeAuthor = (index: number) => setAuthors(authors.filter((_, i) => i !== index));
  const updateAuthor = (index: number, field: keyof typeof authors[0], value: string) => {
    const newAuthors = [...authors];
    newAuthors[index][field] = value;
    setAuthors(newAuthors);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-PE';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setInput((prev) => prev + finalTranscript);
        }
        setInterimInput(interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Error in speech recognition:', event.error);
        setIsRecording(false);
        setInterimInput('');
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setInterimInput('');
      };
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecordingFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processAudioWithGemini(audioBlob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e) {
      console.error('Microphone access denied or error:', e);
      alert('Por favor, permite el acceso al micrófono en tu navegador para usar esta función.');
    }
  };

  const stopRecordingFallback = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioWithGemini = async (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    setInterimInput('Procesando audio...');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const res = await api.post('/audio/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.text) {
        setInput(prev => prev + (prev.endsWith(' ') || !prev ? '' : ' ') + res.data.text + ' ');
      }
    } catch (error) {
      console.error('Error transcribing audio with Gemini:', error);
    } finally {
      setIsProcessingAudio(false);
      setInterimInput('');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      } else {
        stopRecordingFallback();
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error('Error starting SpeechRecognition:', e);
        }
      } else {
        startRecordingFallback();
      }
    }
  };

  // Update welcome message when document type changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === '0') {
        return [{ ...prev[0], content: getWelcomeMessage(documentType) }];
      }
      return prev;
    });
    setShowQuick(true);
  }, [documentType]);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kimy_thesis_sessions');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
      if (schemaMenuRef.current && !schemaMenuRef.current.contains(e.target as Node)) {
        setShowSchemaMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    api.get('/templates')
      .then(res => setCustomTemplates(res.data))
      .catch(console.error);
  }, []);

  const getToken = () => Cookies.get('kimy_token') || '';

  const sendMessage = async (text?: string) => {
    const content = text || (input + interimInput).trim();
    if (!content || isStreaming) return;

    setInput('');
    setInterimInput('');
    setShowQuick(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: 'model',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = Date.now().toString();
      setCurrentSessionId(activeSessionId);
      setSessions(prev => [
        { id: activeSessionId!, title: content.slice(0, 40) + '...', updatedAt: Date.now(), messages: [...messages, userMsg, assistantMsg] },
        ...prev
      ]);
    } else {
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, updatedAt: Date.now(), messages: [...messages, userMsg, assistantMsg] } : s
      ));
    }

    // Construir historial para enviar (excluye el msg inicial de bienvenida y el actual vacío)
    const history = messages
      .filter((m) => m.id !== '0')
      .map((m) => ({ role: m.role, parts: m.content }));

    try {
      abortControllerRef.current = new AbortController();
      // Usa el proxy interno de Next.js para evitar problemas de CORS/env vars
      const response = await fetch('/api/thesis-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          message: content,
          university,
          documentType,
          history,
          authors: authors.map(a => a.name),
          advisorName,
          thesisTitle,
          faculty,
          school,
          selectedUniversity: selectedUniversity.replace(/\s*\(.*?\)/g, '').trim(),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Error en el servidor');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulated += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: accumulated, streaming: true }
                      : m,
                  ),
                );
              }
              if (data.done || data.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: data.error ? `❌ ${data.error}` : accumulated, streaming: false }
                      : m,
                  ),
                );
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + '\n\n*(Generación detenida por el usuario)*', streaming: false }
              : m,
          ),
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: '❌ Error de conexión. Verifica que la API esté corriendo y la GEMINI_API_KEY esté configurada.', streaming: false }
              : m,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      setMessages(currentMessages => {
        setSessions(prev => {
          const newSessions = prev.map(s => 
            s.id === activeSessionId ? { ...s, messages: currentMessages, updatedAt: Date.now() } : s
          );
          localStorage.setItem('kimy_thesis_sessions', JSON.stringify(newSessions));
          return newSessions;
        });
        return currentMessages;
      });
      
      // Auto-trigger PDF preview if a large document was generated
      setTimeout(() => {
        const lastContent = getLastContent();
        // If the AI generated more than 500 characters, it's likely a thesis or large section
        if (lastContent && lastContent.length > 500) {
          downloadPDF();
        }
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getLastContent = () =>
    [...messages].reverse().find((m) => m.role === 'model' && m.content.length > 500)?.content || '';

  // Elimina emojis del texto
  const stripEmojis = (text: string): string =>
    text.replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, '')
        .replace(/[★☆✓✗✘►◄▶◀→←↑↓]/g, '')
        .replace(/ {2,}/g, ' ').trim();

  // Convierte Markdown a HTML con estilos APA 7 para Word
  const markdownToWordHtml = (md: string): string => {
    // 1. Limpiar prefijos de sistema y emojis
    const clean = stripEmojis(md)
      .replace(/^---\n## SECCIÓ?N \d+ - .+$/gm, '')
      .replace(/^(##?) SECCIÓ?N \d+ - /gm, '$1 ')
      .replace(/^---\n/gm, '');

    // Pre-proceso: separar referencias APA en líneas individuales
    // Detecta bloques de referencias (después de "# REFERENCIAS") y los separa
    const processedMd = clean.replace(
      /(# REFERENCIAS[\s\S]*?)(?=\n# |$)/gi,
      (block) => {
        // Dentro del bloque de referencias, cada referencia APA en su propio párrafo
        return block.replace(
          /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,\s+[A-Z][\s\S]+?)(?=\n[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,\s+[A-Z]|\n#|\n---|\n\n\n|$)/g,
          (ref) => '\n\n' + ref.trim()
        );
      }
    );

    // Convertir bloques Mermaid a imágenes (Mermaid Ink API)
    let processedMdWithMermaid = processedMd.replace(
      /```mermaid\s*\n([\s\S]*?)```/g,
      (_, mermaidCode) => {
        try {
          const base64 = btoa(unescape(encodeURIComponent(mermaidCode.trim())));
          return `\n\n<p style="text-align: center;"><img src="https://mermaid.ink/img/${base64}" alt="Diagrama" width="600" style="max-width: 100%; height: auto; margin: 20px 0;" /></p>\n\n`;
        } catch (e) {
          return ''; // Si falla la codificación, no renderizar
        }
      }
    );

    let html = processedMdWithMermaid
      // Imágenes Markdown -> HTML
      .replace(/!\[([^\]]*)\]\((.*?)\)/g, '<img src="$2" alt="$1" width="600" style="max-width: 100%; height: auto; margin: 20px 0;" />')
      // Headings → etiquetas HTML (primero, antes de otros reemplazos)
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Negritas e itálicas
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Separador horizontal
      .replace(/^---+$/gm, '<hr/>')
      // Listas
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]+?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      // Tablas Markdown → HTML
      .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm, (_, header, rows) => {
        const ths = header.split('|').filter((c: string) => c.trim())
          .map((c: string) => `<th>${c.trim()}</th>`).join('');
        const trs = rows.trim().split('\n').map((row: string) =>
          `<tr>${row.split('|').filter((c: string) => c.trim())
            .map((c: string) => `<td>${c.trim()}</td>`).join('')}</tr>`
        ).join('');
        return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
      })
      // Párrafos: doble salto = nuevo párrafo
      .replace(/\n\n/g, '</p><p class="body-text">')
      // Simple salto dentro del mismo párrafo
      .replace(/\n/g, '<br/>');

    // Envolver en párrafo base
    html = `<p class="body-text">${html}</p>`;

    // Limpiar párrafos vacíos
    html = html.replace(/<p[^>]*>\s*<\/p>/g, '');

    return html;
  };


  // ── Funciones de descarga ──────────────────────────────────────────────────
  const downloadMarkdown = () => {
    const content = getLastContent();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `TESIS_KIMY_${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const downloadTxt = () => {
    const content = getLastContent();
    if (!content) return;
    const plain = content
      .replace(/^#{1,6} /gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^> /gm, '  ')
      .replace(/^- /gm, '  • ')
      .replace(/^\|.+\|$/gm, '')
      .replace(/^---$/gm, '─'.repeat(60));
    const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `TESIS_KIMY_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const downloadPDF = () => {
    const raw = getLastContent();
    if (!raw) return;
    setShowDownloadMenu(false);

    const docTypeLabel = documentType === 'tesis' ? 'INFORME DE TESIS' : documentType === 'articulo' ? 'ARTÍCULO CIENTÍFICO' : 'INFORME DE PROYECTO DE TESIS';
    const docTypeSubLabel = documentType === 'articulo' ? 'Para publicación en revista científica' : 'Para optar el Título Profesional';
    const cleanUniversity = selectedUniversity.replace(/\s*\(.*?\)/g, '').trim().toUpperCase();

    // 1. Limpiar marcadores de sección internos del sistema
    const rawNoSystem = raw
      .replace(/^> 🎓.*?$/gm, '')
      .replace(/^> ⏳.*?$/gm, '')
      .replace(/^> Procesando.*?$/gm, '')
      .replace(/^> ⚠️.*?$/gm, '')
      .replace(/^> ❌.*?$/gm, '')
      .replace(/^✅ \*\*.*?$/gm, '')
      .replace(/✅ \*\*.*?generad[oa]\.\*\* Usa el botón \*\*Descargar\*\* para guardar el documento\./gi, '')
      .replace(/---\n*✅ \*\*.*?generad[oa]\.\*\* Usa el botón \*\*Descargar\*\* para guardar el documento\./gi, '');

    const clean = stripEmojis(rawNoSystem)
      .replace(/^---\n## SECCIÓ?N \d+ - .+$/gm, '')
      .replace(/^(##?) SECCIÓ?N \d+ - /gm, '$1 ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n*---\s*$/g, ''); // Eliminar separador final sobrante

    // 1.5 Extraer bloques Mermaid y reemplazar Markdown de imágenes
    let mermaidBlocks: string[] = [];
    let processedMdWithImages = clean.replace(
      /```mermaid\s*\n([\s\S]*?)```/g,
      (_, mermaidCode) => {
        mermaidBlocks.push(mermaidCode.trim());
        return `\n\n__MERMAID_BLOCK_${mermaidBlocks.length - 1}__\n\n`;
      }
    ).replace(/!\[([^\]]*)\]\((.*?)\)/g, '\n\n<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 20px 0; display: block; margin-left: auto; margin-right: auto;" />\n\n');

    // 2. Convertir Markdown a HTML limpio para PDF
    const toHtml = (md: string) => {
      const fmt = (t: string) => t
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>');

      const lines = md.split('\n');
      const out: string[] = [];
      let tableRows: string[] = [];
      let listItems: string[] = [];
      let inList = false;

      const flushTable = () => {
        if (!tableRows.length) return;
        const [hdr, , ...body] = tableRows;
        const ths = hdr.split('|').map(c => c.trim()).filter(Boolean).map(c => `<th>${c}</th>`).join('');
        const trs = body.map(r => `<tr>${r.split('|').map(c => c.trim()).filter(Boolean).map(c => `<td>${fmt(c)}</td>`).join('')}</tr>`).join('');
        out.push(`<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`);
        tableRows = [];
      };

      const flushList = () => {
        if (!listItems.length) return;
        out.push(`<ul>${listItems.map(i => `<li>${i}</li>`).join('')}</ul>`);
        listItems = []; inList = false;
      };

      for (const raw of lines) {
        const line = raw.trimEnd();
        if (line.startsWith('|')) { flushList(); tableRows.push(line); continue; }
        if (tableRows.length && !line.startsWith('|')) flushTable();
        if (!line.trim()) { flushList(); continue; }
        if (/^<img /.test(line.trim())) { flushList(); out.push(line.trim()); continue; }
        if (/^__MERMAID_BLOCK_/.test(line.trim())) { flushList(); out.push(line.trim()); continue; }
        if (/^#{1} /.test(line)) { flushList(); out.push(`<h1>${fmt(line.replace(/^# /, ''))}</h1>`); continue; }
        if (/^#{2} /.test(line)) { flushList(); out.push(`<h2>${fmt(line.replace(/^## /, ''))}</h2>`); continue; }
        if (/^#{3} /.test(line)) { flushList(); out.push(`<h3>${fmt(line.replace(/^### /, ''))}</h3>`); continue; }
        if (/^#{4} /.test(line)) { flushList(); out.push(`<h4>${fmt(line.replace(/^#### /, ''))}</h4>`); continue; }
        if (/^[-*] /.test(line)) { inList = true; listItems.push(fmt(line.replace(/^[-*] /, ''))); continue; }
        if (/^\d+\. /.test(line)) { inList = true; listItems.push(fmt(line.replace(/^\d+\. /, ''))); continue; }
        if (/^---+$/.test(line)) { flushList(); out.push('<hr>'); continue; }
        // Referencia APA: línea que empieza con Apellido, I.
        if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,\s+[A-Z]/.test(line.trim())) {
          flushList();
          out.push(`<p class="ref">${fmt(line.trim())}</p>`);
          continue;
        }
        flushList();
        out.push(`<p>${fmt(line.trim())}</p>`);
      }
      flushTable(); flushList();
      return out.join('\n');
    };

    let bodyHtml = toHtml(processedMdWithImages);

    // Restaurar bloques Mermaid
    mermaidBlocks.forEach((code, i) => {
      // Escapamos los caracteres especiales para evitar que el navegador los interprete mal
      const safeCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      bodyHtml = bodyHtml.replace(
        new RegExp(`<p>__MERMAID_BLOCK_${i}__</p>|__MERMAID_BLOCK_${i}__`, 'g'),
        `<div class="mermaid" style="display: flex; justify-content: center; margin: 20px 0;">\n${safeCode}\n</div>`
      );
    });

    const printHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Informe de Tesis — JORANA AI</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  @page {
    size: A4 portrait;
    margin: 2.54cm 2.54cm 2.54cm 3.0cm;
  }

  body {
    font-family: Arial, 'Arial Narrow', sans-serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
  }

  /* ── Portada — primera página centrada verticalmente ── */
  .portada {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 22cm;
    text-align: center;
    page-break-after: always;
  }
  .portada-logo {
    font-size: 11pt;
    font-weight: bold;
    letter-spacing: 1pt;
    text-transform: uppercase;
    margin-bottom: 6pt;
  }
  .portada-uni   { font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-bottom: 3pt; }
  .portada-fac   { font-size: 12pt; font-weight: bold; margin-bottom: 3pt; }
  .portada-esc   { font-size: 11pt; margin-bottom: 24pt; }
  .portada-escudo { font-size: 48pt; margin-bottom: 18pt; }
  .portada-titulo {
    font-size: 14pt; font-weight: bold;
    text-transform: uppercase;
    border-top: 2pt solid #000;
    border-bottom: 2pt solid #000;
    padding: 10pt 20pt;
    margin: 0 10pt 18pt;
    line-height: 1.4;
  }
  .portada-tipo  { font-size: 11pt; font-style: italic; margin-bottom: 16pt; }
  .portada-meta  { font-size: 11pt; text-align: left; line-height: 1.8; }
  .portada-meta strong { font-weight: bold; }
  .portada-year  { font-size: 12pt; font-weight: bold; margin-top: 20pt; }

  /* ── Contenido ── */
  h1 {
    font-size: 14pt; font-weight: bold;
    text-align: center; text-transform: uppercase;
    letter-spacing: 0.5pt;
    margin: 0 0 18pt 0;
    padding-top: 12pt;
    border-bottom: 1pt solid #000;
    padding-bottom: 8pt;
  }
  h2 { font-size: 13pt; font-weight: bold; text-align: left; margin: 18pt 0 8pt; }
  h3 { font-size: 12pt; font-weight: bold; text-align: left; margin: 12pt 0 5pt; }
  h4 { font-size: 12pt; font-weight: bold; font-style: italic; margin: 10pt 0 4pt; }

  p {
    font-size: 12pt; text-align: justify;
    text-indent: 1.27cm; margin: 0 0 8pt 0;
    orphans: 3; widows: 3;
  }
  p.no-indent { text-indent: 0; }

  /* Referencias APA 7 — sangría francesa */
  p.ref {
    text-indent: -1.27cm;
    padding-left: 1.27cm;
    margin: 0 0 8pt 1.27cm;
    text-align: left;
  }

  ul, ol { margin: 6pt 0 10pt 2cm; }
  li { font-size: 12pt; line-height: 1.5; margin: 2pt 0; text-align: justify; }

  table {
    width: 100%; border-collapse: collapse;
    margin: 12pt 0; font-size: 10pt;
    page-break-inside: avoid;
  }
  thead { display: table-header-group; }
  th {
    background: #D9D9D9; font-weight: bold;
    text-align: center; border: 1pt solid #000;
    padding: 5pt 7pt;
  }
  td {
    border: 1pt solid #000; padding: 4pt 7pt;
    vertical-align: top; text-align: left;
  }
  tr:nth-child(even) td { background: #F5F5F5; }

  hr { border: none; border-top: 1pt solid #000; margin: 16pt 0; }
  code { font-family: 'Courier New', monospace; font-size: 10pt; }
  strong { font-weight: bold; }
  em { font-style: italic; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h1:not(:first-of-type) { page-break-before: always; }
    h2, h3 { page-break-after: avoid; }
    table, figure { page-break-inside: avoid; }
  }

  /* Asegurar proporciones de diagramas Mermaid y que las imágenes carguen bien */
  .mermaid svg {
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 20px auto;
  }
  img {
    max-width: 100%;
    height: auto;
  }
</style>
</head>
<body>

${documentType === 'articulo' ? `
<!-- ══ ENCABEZADO ARTÍCULO ══════════════════════════════════════════════ -->
<div style="text-align: center; margin-top: 20pt; margin-bottom: 20pt;">
  <h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 15pt; border-bottom: none; page-break-before: avoid; padding-bottom: 0;">${thesisTitle ? thesisTitle : 'TÍTULO DEL ARTÍCULO'}</h1>
  ${authors.map((a, i) => `<p style="font-size: 12pt; margin: 5pt 0; text-align: center; text-indent: 0;"><strong>Autor${authors.length > 1 ? ` ${i + 1}` : ''}:</strong> ${a.name || 'Nombre del Autor'}, ${a.orcid || '0000-0000-0000-0000'}, ${a.email || 'correo@institucion.edu.pe'}</p>`).join('')}
  <p style="font-size: 12pt; margin: 5pt 0; text-align: center; text-indent: 0;">${cleanUniversity} &mdash; Afiliación Institucional</p>
</div>
<hr style="border: none; border-top: 1.5pt solid black; margin-bottom: 20pt;" />
` : `
<!-- ══ PORTADA AUTOMÁTICA ══════════════════════════════════════════════ -->
<div class="portada">
  <div class="portada-uni">${cleanUniversity}</div>
  <div class="portada-fac">${faculty || 'Facultad / Escuela Académica'}</div>
  <div class="portada-esc">${school || 'Programa de Estudios'}</div>
  <div class="portada-escudo">
    ${customLogo 
      ? `<img src="${customLogo}" alt="Logo de la Universidad" style="width: 150px; height: 150px; object-fit: contain; margin: 20px 0;" />`
      : `<div style="width: 150px; height: 150px; border: 1px dashed gray; margin: 20px auto; display: flex; align-items: center; justify-content: center;"><span style="font-size: 10pt; color: gray;">[Agrega aquí tu logo]</span></div>`
    }
  </div>
  <div class="portada-titulo" id="titulo-portada">
    ${thesisTitle ? thesisTitle : `${docTypeLabel}<br/><small style="font-size:11pt;font-weight:normal;font-style:italic;">(El título completo aparece en el contenido generado)</small>`}
  </div>
  <div class="portada-tipo">${docTypeLabel}<br/>${docTypeSubLabel}</div>
  <div class="portada-meta">
    <strong>Autor(es):</strong><br/>
    ${authors.map(a => `Br. ${a.name || '[Nombre del Autor]'}`).join('<br/>')}<br/>
    <strong>Asesor:</strong> Dr. ${advisorName || '[Nombre del Asesor]'}<br/>
    <strong>Línea de investigación:</strong> ${researchLine}
  </div>
  <div class="portada-year">${locationString}   ${year || '2026'}</div>
</div>

<!-- ══ ÍNDICE AUTOMÁTICO ═══════════════════════════════════════════════ -->
<div style="page-break-after: always; padding: 2cm 0;">
  <h1 style="text-align: center; font-size: 16pt; margin-bottom: 20pt; border-bottom: none; page-break-before: auto;">ÍNDICE</h1>
  <div id="indice-container" style="font-size: 12pt; line-height: 1.8;"></div>
</div>
`}

<!-- ══ CONTENIDO GENERADO ═══════════════════════════════════════════════ -->
<div id="contenido">
${bodyHtml}
</div>

<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: false, theme: 'default' });

window.onload = async function() {
  // Generar índice
  var headings = document.querySelectorAll('#contenido h1, #contenido h2');
  var indice = document.getElementById('indice-container');
  if (headings.length > 0 && indice) {
    var html = '';
    for(var i=0; i<headings.length; i++) {
      var h = headings[i];
      var text = h.innerText;
      var indent = h.tagName.toLowerCase() === 'h2' ? 'margin-left: 20px;' : 'font-weight: bold; margin-top: 10px;';
      html += '<div style="' + indent + '">' + text + '</div>';
    }
    indice.innerHTML = html;
  }

  // Renderizar gráficos Mermaid
  try {
    await mermaid.run({
      querySelector: '.mermaid'
    });
  } catch(e) {
    console.error('Error renderizando mermaid:', e);
  }

  // Esperar a que las imágenes normales carguen
  var images = document.getElementsByTagName('img');
  var loaded = 0;
  if (images.length === 0) {
    setTimeout(function() { window.print(); }, 800);
    return;
  }
  function checkDone() {
    loaded++;
    if (loaded === images.length) setTimeout(function() { window.print(); }, 800);
  }
  for (var i = 0; i < images.length; i++) {
    if (images[i].complete) {
      checkDone();
    } else {
      images[i].addEventListener('load', checkDone);
      images[i].addEventListener('error', checkDone);
    }
  }
};
</script>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(printHtml);
      iframe.contentWindow.document.close();
      
      // The print is triggered by the window.onload inside printHtml, 
      // but we need to clean up the iframe after a while
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 10000); // give it 10 seconds to print
    }
  };



  const downloadWord = () => {
    const raw = getLastContent();
    if (!raw) return;

    const docTypeLabel = documentType === 'tesis' ? 'INFORME DE TESIS' : documentType === 'articulo' ? 'ARTÍCULO CIENTÍFICO' : 'INFORME DE PROYECTO DE TESIS';
    const docTypeSubLabel = documentType === 'articulo' ? 'Para publicación en revista científica' : 'Para optar el Título Profesional';
    const cleanUniversity = selectedUniversity.replace(/\s*\(.*?\)/g, '').trim().toUpperCase();

    // Limpiar mensajes del sistema antes de convertir a Word
    const rawNoSystem = raw
      .replace(/^> 🎓.*?$/gm, '')
      .replace(/^> ⏳.*?$/gm, '')
      .replace(/^> Procesando.*?$/gm, '')
      .replace(/^> ⚠️.*?$/gm, '')
      .replace(/^> ❌.*?$/gm, '')
      .replace(/^✅ \*\*.*?$/gm, '')
      .replace(/✅ \*\*.*?generad[oa]\.\*\* Usa el botón \*\*Descargar\*\* para guardar el documento\./gi, '')
      .replace(/---\n*✅ \*\*.*?generad[oa]\.\*\* Usa el botón \*\*Descargar\*\* para guardar el documento\./gi, '')
      .replace(/\n*---\s*$/g, '');

    const bodyHtml = markdownToWordHtml(rawNoSystem);
    const wordDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Informe de Tesis — JORANA AI</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument>
    <w:View>Print</w:View><w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument></xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 21.0cm 29.7cm;
      margin: 2.54cm 2.54cm 2.54cm 3.0cm;
      mso-header-margin: 1.25cm;
      mso-footer-margin: 1.25cm;
    }
    div.Section1 { page: Section1; }

    body {
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-size: 12.0pt;
      line-height: 1.5;
      color: #000000;
      mso-fareast-font-family: 'Times New Roman';
    }

    /* ── Portada (h1 sin page-break y sin sangría) ── */
    h1.portada {
      font-size: 14.0pt; font-weight: bold;
      text-align: center; margin: 6pt 0;
      text-transform: uppercase;
      mso-style-next: Normal;
    }

    /* ── Capítulos (h1 con salto de página) ── */
    h1 {
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-size: 14.0pt; font-weight: bold;
      text-align: center; text-transform: uppercase;
      margin: 18pt 0 10pt;
      mso-style-next: Normal;
      page-break-before: always;
    }
    h2 {
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-size: 13.0pt; font-weight: bold;
      text-align: left; margin: 14pt 0 6pt;
      mso-style-next: Normal;
    }
    h3 {
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-size: 12.0pt; font-weight: bold;
      text-align: left; margin: 10pt 0 4pt;
    }
    h4 {
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-size: 12.0pt; font-weight: bold; font-style: italic;
      text-align: left; margin: 8pt 0 3pt;
    }

    /* ── Párrafos cuerpo de texto ── */
    p, p.body-text {
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-size: 12.0pt; line-height: 1.5;
      text-align: justify;
      text-indent: 1.27cm;
      margin: 0 0 6pt 0;
    }
    p.centered {
      text-align: center; text-indent: 0;
    }
    p.no-indent {
      text-indent: 0;
    }

    /* ── Referencias APA 7 — Sangría francesa ── */
    p.referencia {
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-size: 12.0pt; line-height: 1.5;
      text-align: left;
      text-indent: -1.27cm;
      padding-left: 1.27cm;
      margin: 0 0 6pt 1.27cm;
    }

    /* ── Listas ── */
    ul, ol {
      margin: 4pt 0 4pt 1.5cm;
      padding-left: 0.5cm;
    }
    li {
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-size: 12.0pt; line-height: 1.5;
      text-align: justify; margin: 2pt 0;
    }

    /* ── Tablas ── */
    table {
      border-collapse: collapse;
      width: 100%; margin: 10pt 0;
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-size: 10.0pt;
    }
    td, th {
      border: 1pt solid #000000;
      padding: 4pt 6pt;
      vertical-align: middle;
      text-align: left;
    }
    th {
      background-color: #D9D9D9;
      font-weight: bold; text-align: center;
    }
    tr:nth-child(even) td { background-color: #F5F5F5; }

    hr {
      border: none; border-top: 1.5pt solid #000000;
      margin: 16pt 0;
    }
    code {
      font-family: 'Courier New', monospace;
      font-size: 10.0pt;
    }
    strong { font-weight: bold; }
    em { font-style: italic; }
  </style>
</head>
<body>
<div class="Section1">

${documentType === 'articulo' ? `
<!-- ══ ENCABEZADO ARTÍCULO ══════════════════════════════════════════════ -->
<div style="text-align: center; margin-top: 20pt; margin-bottom: 20pt;">
  <h1 style="font-size: 16.0pt; font-weight: bold; margin-bottom: 15pt; text-align: center;">${thesisTitle ? thesisTitle : 'TÍTULO DEL ARTÍCULO'}</h1>
  ${authors.map((a, i) => `<p style="text-align: center; font-size: 12.0pt; margin: 5pt 0;"><strong>Autor${authors.length > 1 ? ` ${i + 1}` : ''}:</strong> ${a.name || 'Nombre del Autor'}, ${a.orcid || '0000-0000-0000-0000'}, ${a.email || 'correo@institucion.edu.pe'}</p>`).join('')}
  <p style="text-align: center; font-size: 12.0pt; margin: 5pt 0;">${cleanUniversity} &mdash; Afiliación Institucional</p>
</div>
<hr style="border: none; border-top: 1.5pt solid black; margin-bottom: 20pt;" />
` : `
<!-- ══ PORTADA AUTOMÁTICA ══════════════════════════════════════════════ -->
<div style="text-align: center; margin-bottom: 30pt;">
  <h1 class="portada" style="font-size: 14.0pt; margin-bottom: 0; text-transform: uppercase;">${cleanUniversity}</h1>
  <h2 style="font-size: 12.0pt; margin-top: 4pt; text-align: center;">${faculty || 'Facultad / Escuela Académica'}</h2>
  <h3 style="font-size: 11.0pt; margin-top: 4pt; margin-bottom: 24pt; font-weight: normal; text-align: center;">${school || 'Programa de Estudios'}</h3>
  
  <p style="text-align: center; margin: 20pt 0;">
    ${customLogo 
      ? `<img src="${customLogo}" width="130" height="130" style="object-fit: contain;" alt="Logo de la Universidad" />` 
      : `<div style="width: 130px; height: 130px; border: 1px dashed gray; margin: 0 auto; display: flex; align-items: center; justify-content: center; padding: 10px;"><span style="font-size: 10pt; color: gray;">[Agrega aquí tu logo de la universidad]</span></div>`
    }
  </p>
  <h1 class="portada" style="font-size: 14.0pt; margin-top: 30pt; border-top: 1.5pt solid black; border-bottom: 1.5pt solid black; padding: 10pt 0;">${thesisTitle ? thesisTitle.toUpperCase() : docTypeLabel}</h1>
  <h3 style="font-size: 11.0pt; text-align: center; font-style: italic; margin-bottom: 30pt; font-weight: normal;">${docTypeSubLabel}</h3>
  <p style="text-align: center; font-size: 12.0pt; margin-top: 20pt; line-height: 1.8;">
    <strong>Autor(es):</strong><br/>
    ${authors.map(a => `Br. ${a.name || '[Nombre del Autor]'}`).join('<br/>')}<br/>
    <strong>Asesor:</strong> Dr. ${advisorName || '[Nombre del Asesor]'}<br/>
    <strong>Línea de investigación:</strong> ${researchLine}
  </p>
  
  <p style="text-align: center; font-size: 12.0pt; margin-top: 60pt; font-weight: bold;">
    ${locationString}   ${year || '2026'}
  </p>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always" />

<!-- ══ ÍNDICE AUTOMÁTICO ═══════════════════════════════════════════════ -->
<h1 class="portada" style="font-size: 14.0pt; margin-bottom: 20pt;">ÍNDICE</h1>
<p style="text-align: center; font-style: italic; font-size: 10.0pt; color: gray;">
  (Para generar el índice en Word: Haz clic derecho sobre este texto, selecciona "Actualizar campos" y luego "Actualizar toda la tabla")
</p>
<!--[if supportFields]>
<p class="MsoNormal"><span style='mso-element:field-begin'></span>TOC \\o "1-3" \\h \\z \\u <span style='mso-element:field-separator'></span></p>
<![endif]-->
<p style="text-align: left; margin-bottom: 0;">Índice General ................................................................................ Generar con Word</p>
<!--[if supportFields]>
<p class="MsoNormal"><span style='mso-element:field-end'></span></p>
<![endif]-->

<br clear="all" style="mso-special-character:line-break;page-break-before:always" />
`}

${bodyHtml}
</div>
</body>
</html>`;
    const blob = new Blob([wordDoc], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TESIS_JORANA_${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const startNewChat = () => {
    setMessages([{
      id: '0',
      role: 'model',
      content: `# Bienvenido al Asistente JORANA AI\n\nEl sistema se encuentra especializado en la generación y revisión de **informes de tesis completos**, operando bajo las directrices institucionales y esquemas específicos de su universidad.\n\n### Capacidades del Sistema:\n\n- **Generación Documental:** Redacción integral de la tesis, desde la cubierta hasta los anexos.\n- **Diseño Metodológico:** Formulación de títulos de investigación y estructuración de variables.\n- **Corrección de Estilo:** Revisión técnica y refinamiento de apartados específicos.\n- **Respaldo Bibliográfico:** Búsqueda y sugerencia de referencias académicas reales.\n\n### Instrucciones de Uso:\n> Para iniciar el proceso, describa su requerimiento: _"Genera una tesis sobre [tema de investigación]"_, o utilice los accesos directos disponibles.`,
      timestamp: new Date(),
    }]);
    setCurrentSessionId(null);
    setShowQuick(true);
    if (window.innerWidth < 768) setShowHistory(false);
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      setShowQuick(false);
      if (window.innerWidth < 768) setShowHistory(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('kimy_thesis_sessions', JSON.stringify(updated));
    if (currentSessionId === id) {
      startNewChat();
    }
  };

  return (
    <div className="flex h-full relative overflow-hidden">

      {/* History Sidebar */}
      <div className={`absolute md:relative z-40 h-full bg-[var(--sidebar-bg)] border-r border-[var(--topbar-border)] transition-all duration-300 flex flex-col shadow-2xl md:shadow-none ${showHistory ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none'}`}>
        {showHistory && (
          <>
            <div className="p-4 border-b border-[var(--topbar-border)] flex-shrink-0">
              <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors text-sm shadow-lg shadow-violet-500/20">
                <Plus className="w-4 h-4" />
                Nueva Tesis
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-xs font-semibold text-[var(--sidebar-text)] uppercase tracking-wider mb-3 px-2 mt-2">Recientes</div>
              {sessions.length === 0 ? (
                <div className="text-center text-[var(--sidebar-text)] text-xs py-8">No hay historial aún</div>
              ) : (
                [...sessions].sort((a,b) => b.updatedAt - a.updatedAt).map(s => (
                  <div key={s.id} onClick={() => loadSession(s.id)} className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all overflow-hidden ${currentSessionId === s.id ? 'bg-gradient-to-r from-violet-500/10 to-transparent border border-violet-500/20 shadow-sm shadow-violet-500/5' : 'border border-transparent hover:bg-[var(--sidebar-hover-bg)]'}`}>
                    {currentSessionId === s.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                    )}
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${currentSessionId === s.id ? 'text-violet-600 dark:text-violet-400' : 'text-[var(--sidebar-text)] group-hover:text-[var(--sidebar-text-hover)]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate transition-colors ${currentSessionId === s.id ? 'text-violet-700 dark:text-violet-300' : 'text-[var(--sidebar-text-hover)]'}`}>{s.title}</p>
                      <p className="text-[10px] text-[var(--sidebar-text)] mt-0.5 transition-colors">{new Date(s.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={(e) => deleteSession(e, s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all absolute right-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg)] min-w-0">

        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-violet-500/20 text-violet-600 dark:text-violet-400' : 'bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500/20'}`}>
              <Clock className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[var(--text-primary)]">
                {documentType === 'proyecto' ? 'Generador de Proyectos de Tesis' : documentType === 'articulo' ? 'Generador de Artículos Científicos' : 'Generador de Tesis IA'}
              </h1>
              <p className="text-xs text-[var(--text-muted)] hidden sm:block">
                Potenciado por Gemini · {
                  university.map(u => 
                    u.startsWith('custom_') 
                      ? (customTemplates.find(t => t.id === u.replace('custom_', ''))?.name || 'Esquema Personalizado')
                      : `Normativa ${u}`
                  ).join(' + ') || 'Normativa UNT'
                } · APA 7.ª
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Document Type Selector */}
            <div className="flex items-center rounded-lg border border-[var(--topbar-border)] overflow-hidden">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => setDocumentType(dt.id)}
                  title={dt.description}
                  className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
                    documentType === dt.id
                      ? 'bg-violet-500 text-white shadow-inner'
                      : 'bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-violet-500/10 hover:text-violet-500'
                  }`}
                >
                  <span className="text-sm">{dt.icon}</span>
                  <span className="hidden sm:inline">{dt.label}</span>
                </button>
              ))}
            </div>

            <div className="relative" ref={schemaMenuRef}>
              <button
                onClick={() => setShowSchemaMenu(!showSchemaMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--topbar-border)] bg-[var(--bg)] text-[var(--text-primary)] hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span className="truncate max-w-[150px]">
                  {university.length === 1 ? (
                    university[0].startsWith('custom_') 
                      ? (customTemplates.find(t => t.id === university[0].replace('custom_', ''))?.name || 'Esquema Personalizado')
                      : `Normativa ${university[0]}`
                  ) : `${university.length} esquemas seleccionados`}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showSchemaMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showSchemaMenu && (
                <div className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-[var(--topbar-border)] bg-[var(--topbar-bg)] shadow-xl z-50 p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-1">Oficiales</div>
                  {[
                    { id: 'UNT', label: 'UNT (Perú)' },
                    { id: 'PUCP', label: 'PUCP (Perú)' },
                    { id: 'UNAM', label: 'UNAM (México)' },
                    { id: 'UBA', label: 'UBA (Argentina)' },
                    { id: 'UCM', label: 'UCM (España)' },
                    { id: 'INTERNACIONAL', label: 'Formato Internacional' },
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--sidebar-hover-bg)] rounded-lg cursor-pointer transition-colors text-xs text-[var(--text-primary)]">
                      <input 
                        type="checkbox" 
                        className="rounded text-violet-500 focus:ring-violet-500/40 bg-[var(--bg)] border-gray-600"
                        checked={university.includes(opt.id)}
                        onChange={(e) => {
                          if (e.target.checked) setUniversity([...university, opt.id]);
                          else {
                            const filtered = university.filter(u => u !== opt.id);
                            setUniversity(filtered.length ? filtered : ['UNT']);
                          }
                        }}
                      />
                      {opt.label}
                    </label>
                  ))}
                  
                  {customTemplates.length > 0 && (
                    <>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-3 pt-2 border-t border-[var(--topbar-border)]">Mis Esquemas</div>
                      {customTemplates.map(t => (
                        <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--sidebar-hover-bg)] rounded-lg cursor-pointer transition-colors text-xs text-[var(--text-primary)]">
                          <input 
                            type="checkbox" 
                            className="rounded text-violet-500 focus:ring-violet-500/40 bg-[var(--bg)] border-gray-600"
                            checked={university.includes(`custom_${t.id}`)}
                            onChange={(e) => {
                              if (e.target.checked) setUniversity([...university, `custom_${t.id}`]);
                              else {
                                const filtered = university.filter(u => u !== `custom_${t.id}`);
                                setUniversity(filtered.length ? filtered : ['UNT']);
                              }
                            }}
                          />
                          {t.name}
                        </label>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Portada Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border border-gray-500/20 transition-all mr-2"
              >
                <Settings className="w-3.5 h-3.5" />
                Portada
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-[var(--topbar-border)] bg-[var(--topbar-bg)] shadow-xl z-50 p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Datos de Portada</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-500 mb-1">Universidad / Institución de Afiliación</label>
                      <select value={selectedUniversity} onChange={e => setSelectedUniversity(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500 truncate">
                        {PERUVIAN_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    {documentType !== 'articulo' && (
                      <>
                        <div>
                          <label className="block text-gray-500 mb-1">Facultad</label>
                          <input type="text" value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="Ej: Facultad de Ingeniería" className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500" />
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-1">Escuela / Programa</label>
                          <input type="text" value={school} onChange={e => setSchool(e.target.value)} placeholder="Ej: Escuela de Ingeniería de Sistemas" className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500" />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-gray-500 mb-1">{documentType === 'articulo' ? 'Título del Artículo' : 'Título de la Tesis'}</label>
                      <input type="text" value={thesisTitle} onChange={e => setThesisTitle(e.target.value)} placeholder={documentType === 'articulo' ? "Ej: Impacto de la Inteligencia Artificial..." : "Ej: Implementación de un Sistema Web para..."} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-gray-500 font-medium">Autor(es)</label>
                        <button onClick={addAuthor} className="text-[10px] bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 px-2 py-1 rounded transition-colors flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Añadir autor
                        </button>
                      </div>
                      <div className="space-y-3">
                        {authors.map((author, index) => (
                          <div key={index} className="p-3 border border-gray-700/50 bg-gray-800/30 rounded-xl relative group">
                            {authors.length > 1 && (
                              <button onClick={() => removeAuthor(index)} className="absolute top-2 right-2 text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <div className="space-y-2">
                              <input type="text" value={author.name} onChange={e => updateAuthor(index, 'name', e.target.value)} placeholder="Nombre del Autor" className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500" />
                              {documentType === 'articulo' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <input type="text" value={author.orcid} onChange={e => updateAuthor(index, 'orcid', e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500" placeholder="ORCID: 0000-0000" />
                                  <input type="email" value={author.email} onChange={e => updateAuthor(index, 'email', e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500" placeholder="Correo" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {documentType !== 'articulo' && (
                      <>
                        <div>
                          <label className="block text-gray-500 mb-1">Asesor</label>
                          <input type="text" value={advisorName} onChange={e => setAdvisorName(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500" />
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-1">Línea de Investigación</label>
                          <select value={researchLine} onChange={e => setResearchLine(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500 text-xs">
                            {Object.entries(RESEARCH_LINES).map(([carrera, lineas]) => (
                              <optgroup key={carrera} label={carrera}>
                                {lineas.map(linea => (
                                  <option key={linea} value={linea} title={linea}>
                                    {linea.length > 40 ? linea.slice(0, 40) + '...' : linea}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-gray-500 mb-1">Lugar (Región / Provincia / Distrito)</label>
                          <div className="flex flex-col gap-2">
                            <select value={selectedRegion} onChange={handleRegionChange} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500 text-xs truncate">
                              {regions.map((r: any) => <option key={r.departamento} value={r.departamento}>{r.nombre}</option>)}
                            </select>
                            <select value={selectedProvince} onChange={handleProvinceChange} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500 text-xs truncate">
                              {provinces.map((p: any) => <option key={p.provincia} value={p.provincia}>{p.nombre}</option>)}
                            </select>
                            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500 text-xs truncate">
                              {districts.map((d: any) => <option key={d.distrito} value={d.distrito}>{d.nombre}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-gray-500 mb-1 mt-2">Año</label>
                            <input type="text" value={year} onChange={e => setYear(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--topbar-border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-violet-500" />
                          </div>
                          <div>
                            <label className="block text-gray-500 mb-1 mt-2">Logo de la Universidad</label>
                            <div className="flex items-center gap-2">
                              {customLogo && <img src={customLogo} alt="Logo" className="w-8 h-8 object-contain rounded bg-white/10" />}
                              <input type="file" accept="image/png, image/jpeg" onChange={handleLogoUpload} className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-violet-500/10 file:text-violet-500 hover:file:bg-violet-500/20 text-gray-400" />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Sube el logo de tu universidad (PNG/JPG) antes de descargar.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Download dropdown */}
            <div className="relative" ref={downloadMenuRef}>
              {/* Preview button */}
              <button
                onClick={() => { setViewMode(viewMode === 'chat' ? 'preview' : 'chat'); setShowDownloadMenu(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all mr-2 border ${
                  viewMode === 'preview'
                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                }`}
                title={viewMode === 'preview' ? "Volver al Chat" : "Vista previa del documento"}
              >
                {viewMode === 'preview' ? <MessageSquare className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {viewMode === 'preview' ? 'Volver al Chat' : 'Vista Previa'}
              </button>
            </div>

            <div className="relative" ref={downloadMenuRef}>
              <button
                onClick={() => setShowDownloadMenu((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
                <ChevronDown className={`w-3 h-3 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
              </button>
              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-[var(--topbar-border)] bg-[var(--topbar-bg)] shadow-xl z-50 overflow-hidden">
                  <button onClick={downloadMarkdown} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-violet-500/10 text-[var(--text-primary)] transition-colors">
                    <FileCode className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Markdown (.md)</div>
                      <div className="text-gray-500">Visual Studio Code</div>
                    </div>
                  </button>
                  <button onClick={downloadTxt} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-blue-500/10 text-[var(--text-primary)] transition-colors">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Texto plano (.txt)</div>
                      <div className="text-gray-500">Bloc de notas</div>
                    </div>
                  </button>
                  <button onClick={downloadWord} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-sky-500/10 text-[var(--text-primary)] transition-colors border-t border-[var(--topbar-border)]">
                    <FileType className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Word (.doc)</div>
                      <div className="text-gray-500">Microsoft Word — Formato UNT</div>
                    </div>
                  </button>
                  <button onClick={downloadPDF} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-red-500/10 text-[var(--text-primary)] transition-colors border-t border-[var(--topbar-border)]">
                    <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium">PDF (.pdf)</div>
                      <div className="text-gray-500">Guardar como PDF</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area (Chat or Preview) */}
        {viewMode === 'preview' ? (
          <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-black/40 py-8 px-4 flex justify-center items-start">
            {(() => {
              const raw = getLastContent();
              if (!raw) return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                  <FileText className="w-12 h-12 opacity-20" />
                  <p>Aún no hay ningún documento generado.</p>
                </div>
              );

              const cleanUniv = selectedUniversity.replace(/\s*\(.*?\)/g, '').trim().toUpperCase();
              const dtLabel = documentType === 'tesis' ? 'INFORME DE TESIS' : documentType === 'articulo' ? 'ARTÍCULO CIENTÍFICO' : 'INFORME DE PROYECTO DE TESIS';
              const dtSub = documentType === 'articulo' ? 'Para publicación en revista científica' : 'Para optar el Título Profesional';

              // Clean system messages and convert mermaid blocks to images
              const cleaned = raw
                .replace(/^> 🎓.*?$/gm, '').replace(/^> ⏳.*?$/gm, '').replace(/^> Procesando.*?$/gm, '')
                .replace(/^> ⚠️.*?$/gm, '').replace(/^> ❌.*?$/gm, '').replace(/^✅ \*\*.*?$/gm, '')
                .replace(/✅ \*\*.*?generad[oa]\.\*\* Usa el botón \*\*Descargar\*\* para guardar el documento\./gi, '')
                .replace(/---\n*✅ \*\*.*?generad[oa]\.\*\* Usa el botón \*\*Descargar\*\* para guardar el documento\./gi, '')
                .replace(/^---\n## SECCIÓ?N \d+ - .+$/gm, '').replace(/^(##?) SECCIÓ?N \d+ - /gm, '$1 ')
                .replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, code) => {
                  try {
                    return `\n<img src="https://mermaid.ink/img/${btoa(unescape(encodeURIComponent(code.trim())))}" alt="Diagrama" style="max-width:100%; height:auto; margin:20px auto; display:block;" />\n`;
                  } catch { return ''; }
                })
                .replace(/!\[([^\]]*)\]\((.*?)\)/g, '\n<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 20px auto; display: block;" />\n')
                .replace(/\n{3,}/g, '\n\n').replace(/\n*---\s*$/g, '');

              // Simple markdown to HTML
              const fmt = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>');
              const lines = cleaned.split('\n');
              const htmlParts: string[] = [];
              let tblRows: string[] = [];
              let liItems: string[] = [];

              const flushT = () => { if (!tblRows.length) return; const [h,,  ...b] = tblRows; const ths = h.split('|').map(c=>c.trim()).filter(Boolean).map(c=>`<th>${c}</th>`).join(''); const trs = b.map(r=>`<tr>${r.split('|').map(c=>c.trim()).filter(Boolean).map(c=>`<td>${fmt(c)}</td>`).join('')}</tr>`).join(''); htmlParts.push(`<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`); tblRows=[]; };
              const flushL = () => { if (!liItems.length) return; htmlParts.push(`<ul>${liItems.map(i=>`<li>${i}</li>`).join('')}</ul>`); liItems=[]; };

              for (const raw2 of lines) {
                const ln = raw2.trimEnd();
                if (ln.startsWith('|')) { flushL(); tblRows.push(ln); continue; }
                if (tblRows.length && !ln.startsWith('|')) flushT();
                if (!ln.trim()) { flushL(); continue; }
                if (/^#{1} /.test(ln)) { flushL(); htmlParts.push(`<h1>${fmt(ln.replace(/^# /,''))}</h1>`); continue; }
                if (/^#{2} /.test(ln)) { flushL(); htmlParts.push(`<h2>${fmt(ln.replace(/^## /,''))}</h2>`); continue; }
                if (/^#{3} /.test(ln)) { flushL(); htmlParts.push(`<h3>${fmt(ln.replace(/^### /,''))}</h3>`); continue; }
                if (/^#{4} /.test(ln)) { flushL(); htmlParts.push(`<h4>${fmt(ln.replace(/^#### /,''))}</h4>`); continue; }
                if (/^[-*] /.test(ln)) { liItems.push(fmt(ln.replace(/^[-*] /,''))); continue; }
                if (/^\d+\. /.test(ln)) { liItems.push(fmt(ln.replace(/^\d+\. /,''))); continue; }
                if (/^---+$/.test(ln)) { flushL(); htmlParts.push('<hr>'); continue; }
                if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,\s+[A-Z]/.test(ln.trim())) { flushL(); htmlParts.push(`<p class="ref">${fmt(ln.trim())}</p>`); continue; }
                flushL();
                htmlParts.push(`<p>${fmt(ln.trim())}</p>`);
              }
              flushT(); flushL();

              const bodyContent = htmlParts.join('\n');

              const coverHtml = documentType === 'articulo'
                ? `<div style="text-align:center;margin:30pt 0 20pt;"><h1 style="font-size:16pt;font-weight:bold;margin-bottom:15pt;border:none;">${thesisTitle||'TÍTULO DEL ARTÍCULO'}</h1>${authors.map((a, i) => `<p style="font-size:12pt;margin:5pt 0;text-indent:0;text-align:center;"><strong>Autor${authors.length > 1 ? ` ${i + 1}` : ''}:</strong> ${a.name||'Nombre del Autor'}, ${a.orcid||'0000-0000-0000-0000'}, ${a.email||'correo@institucion.edu.pe'}</p>`).join('')}<p style="font-size:12pt;margin:5pt 0;text-indent:0;text-align:center;">${cleanUniv} — Afiliación Institucional</p></div><hr style="border:none;border-top:1.5pt solid black;margin-bottom:20pt;"/>`
                : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:680px;text-align:center;border-bottom:2px solid #e5e7eb;margin-bottom:30px;padding-bottom:20px;"><div style="font-size:13pt;font-weight:bold;text-transform:uppercase;margin-bottom:3pt;">${cleanUniv}</div><div style="font-size:12pt;font-weight:bold;margin-bottom:3pt;">${faculty||'Facultad / Escuela'}</div><div style="font-size:11pt;margin-bottom:24pt;">${school||'Programa de Estudios'}</div>${customLogo?`<img src="${customLogo}" alt="Logo" style="width:120px;height:120px;object-fit:contain;margin:15px 0;"/>`:'<div style="width:120px;height:120px;border:1px dashed #ccc;margin:15px auto;display:flex;align-items:center;justify-content:center;border-radius:8px;"><span style="font-size:9pt;color:#999;">[Logo]</span></div>'}<div style="font-size:14pt;font-weight:bold;text-transform:uppercase;border-top:2pt solid #000;border-bottom:2pt solid #000;padding:10pt 20pt;margin:0 10pt 18pt;line-height:1.4;">${thesisTitle||dtLabel}</div><div style="font-size:11pt;font-style:italic;margin-bottom:16pt;">${dtLabel}<br/>${dtSub}</div><div style="font-size:11pt;text-align:left;line-height:1.8;"><strong>Autor(es):</strong><br/>${authors.map(a => `Br. ${a.name || '[Nombre del Autor]'}`).join('<br/>')}<br/><br/><strong>Asesor:</strong> Dr. ${advisorName||'[Nombre del Asesor]'}<br/><strong>Línea de investigación:</strong> ${researchLine}</div><div style="font-size:12pt;font-weight:bold;margin-top:20pt;">${locationString}   ${year||'2026'}</div></div>`;

              return (
                <div
                  className="bg-white shadow-2xl rounded-sm transition-all"
                  style={{ width: '210mm', maxWidth: '100%', minHeight: '297mm', padding: '2.54cm 2.54cm 2.54cm 3cm', fontFamily: 'Arial, sans-serif', fontSize: '12pt', lineHeight: 1.5, color: '#000' }}
                  dangerouslySetInnerHTML={{ __html: `
                    <style>
                      .preview-doc h1 { font-size:14pt; font-weight:bold; text-align:center; text-transform:uppercase; letter-spacing:0.5pt; margin:24pt 0 18pt; padding-top:12pt; border-bottom:1pt solid #000; padding-bottom:8pt; }
                      .preview-doc h2 { font-size:13pt; font-weight:bold; text-align:left; margin:18pt 0 8pt; }
                      .preview-doc h3 { font-size:12pt; font-weight:bold; text-align:left; margin:12pt 0 5pt; }
                      .preview-doc h4 { font-size:12pt; font-weight:bold; font-style:italic; margin:10pt 0 4pt; }
                      .preview-doc p { font-size:12pt; text-align:justify; text-indent:1.27cm; margin:0 0 8pt 0; }
                      .preview-doc p.ref { text-indent:-1.27cm; padding-left:1.27cm; margin:0 0 8pt 1.27cm; text-align:left; }
                      .preview-doc ul, .preview-doc ol { margin:6pt 0 10pt 2cm; }
                      .preview-doc li { font-size:12pt; line-height:1.5; margin:2pt 0; text-align:justify; }
                      .preview-doc table { width:100%; border-collapse:collapse; margin:12pt 0; font-size:10pt; }
                      .preview-doc th { background:#D9D9D9; font-weight:bold; text-align:center; border:1pt solid #000; padding:5pt 7pt; }
                      .preview-doc td { border:1pt solid #000; padding:4pt 7pt; vertical-align:top; text-align:left; }
                      .preview-doc tr:nth-child(even) td { background:#F5F5F5; }
                      .preview-doc hr { border:none; border-top:1pt solid #000; margin:16pt 0; }
                      .preview-doc code { font-family:'Courier New',monospace; font-size:10pt; }
                      .preview-doc strong { font-weight:bold; }
                      .preview-doc em { font-style:italic; }
                    </style>
                    <div class="preview-doc">
                      ${coverHtml}
                      ${bodyContent}
                    </div>
                  `}}
                />
              );
            })()}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-primary-500/20'
                      : 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="w-4 h-4 text-primary-400" />
                      : <Bot className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-tr-sm'
                      : 'bg-[var(--card-bg)] border border-[var(--topbar-border)] rounded-tl-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-primary)]
                        prose-headings:text-[var(--text-primary)] prose-headings:font-bold
                        prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                        prose-table:text-xs prose-td:py-1 prose-th:py-1
                        prose-code:text-xs prose-pre:text-xs
                        prose-blockquote:border-l-violet-500 prose-blockquote:text-gray-400">
                        <ReactMarkdown>{(msg.content || ' ').replace(/```mermaid\n([\s\S]*?)\n```/g, (_, code) => {
                          try {
                            return `\n\n![Diagrama](https://mermaid.ink/img/${btoa(unescape(encodeURIComponent(code.trim())))})\n\n`;
                          } catch { return ''; }
                        })}</ReactMarkdown>
                        {msg.streaming && (
                          <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse rounded-sm ml-1 align-middle" />
                        )}
                      </div>
                    )}
                    <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Quick prompts */}
              {showQuick && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Accesos rápidos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(QUICK_PROMPTS_BY_TYPE[documentType] || QUICK_PROMPTS_BY_TYPE.tesis).map((q) => (
                      <button
                        key={q.label}
                        onClick={() => sendMessage(q.value)}
                        disabled={isStreaming}
                        className="px-3 py-1.5 text-xs rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-400 hover:bg-violet-500/15 transition-all disabled:opacity-40"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 border-t border-[var(--topbar-border)] bg-[var(--topbar-bg)] p-4">
          <div className="max-w-4xl mx-auto">
            {isStreaming && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-violet-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gemini está generando tu tesis...
                </div>
                <button
                  onClick={() => abortControllerRef.current?.abort()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Detener Generación
                </button>
              </div>
            )}
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input + interimInput}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setInterimInput('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder='Ej: "Genera una tesis sobre blockchain para registro de títulos universitarios en la UNT"'
                  rows={2}
                  disabled={isStreaming}
                  className="w-full resize-none rounded-xl border border-[var(--topbar-border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder-gray-500 text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all disabled:opacity-50"
                />
              </div>
              <div className="flex gap-2 items-center flex-shrink-0">
                <button
                  onClick={toggleRecording}
                  disabled={isStreaming || isProcessingAudio}
                  title={isRecording ? "Detener grabación" : "Dictar por voz"}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 animate-pulse' 
                      : isProcessingAudio
                      ? 'bg-violet-500/10 text-violet-500 cursor-not-allowed'
                      : 'bg-[var(--bg)] border border-[var(--topbar-border)] text-[var(--text-secondary)] hover:text-violet-500 hover:border-violet-500/50'
                  }`}
                >
                  {isProcessingAudio ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : isRecording ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                </button>
                <button
                  onClick={() => sendMessage()}
                  disabled={isStreaming || !input.trim()}
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex-shrink-0"
                >
                  {isStreaming
                    ? <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                    : <Send className="w-4.5 h-4.5 text-white" />
                  }
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5 text-center">
              Enter para enviar · Shift+Enter para nueva línea
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
