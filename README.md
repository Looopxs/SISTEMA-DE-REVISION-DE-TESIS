Sistema de Revisión Inteligente de Tesis

Sistema web completo para la gestión, revisión y evaluación automatizada de avances de tesis universitarias con inteligencia artificial.

## Características

- **Análisis IA con GPT-4o**: Evaluación automática de estructura, contenido, forma y originalidad
- **Dashboard con KPIs**: Vista general con métricas en tiempo real
- **Retroalimentación accionable**: Hallazgos con instrucciones de corrección y ejemplos de mejora
- **Detección de plagio**: Comparación de embeddings con pgvector (similitud coseno)
- **Validación de citas**: Verificación automática de referencias con CrossRef API
- **Fine-tuning continuo**: Aprendizaje del feedback humano para mejorar el modelo
- **Integración ORCID**: Vinculación de perfiles académicos de asesores
- **App móvil (Expo)**: Visualización de hallazgos para estudiantes
- **Reportes PDF**: Actas de revisión con evaluación IA + ajustes humanos

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend Web | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | NestJS 11, TypeScript |
| Base de Datos | PostgreSQL 16 + pgvector |
| ORM | Prisma 6 |
| Almacenamiento | MinIO (S3-compatible) |
| Colas | BullMQ + Redis |
| IA | OpenAI GPT-4o + LangChain.js |
| Embeddings | text-embedding-3-large |
| Mobile | Expo SDK 52, React Native |
| Contenedores | Docker Compose |

## Estructura del Proyecto

```
kimy/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   ├── api/          # NestJS backend
│   └── mobile/       # Expo React Native (futuro)
├── packages/
│   ├── database/     # Prisma schema + seed
│   ├── ai-engine/    # Pipeline de análisis IA
│   └── shared-types/ # TypeScript types compartidos
├── docker-compose.yml
├── turbo.json
└── .env.example
```

## Instalación y Ejecución

### Prerequisitos
- Node.js >= 20
- Docker + Docker Compose
- API Key de OpenAI (opcional para IA)

### 1. Clonar y configurar

```bash
cd LAB01_HLJA
cp .env.example .env
# Editar .env con tus credenciales (especialmente OPENAI_API_KEY)
```

### 2. Levantar infraestructura

```bash
docker compose up -d
```

Esto levanta:
- **PostgreSQL 16** con pgvector en puerto 5432
- **Redis 7** en puerto 6379
- **MinIO** en puertos 9000/9001

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar base de datos

```bash
cd packages/database
npx prisma db push
npx tsx seed.ts
```

### 5. Iniciar en desarrollo

```bash
# Desde la raíz del proyecto
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api/docs
- MinIO Console: http://localhost:9001

### Credenciales de prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@kimy.edu | Kimy2026! | Administrador |
| coordinador@kimy.edu | Kimy2026! | Coordinador |
| asesor1@kimy.edu | Kimy2026! | Asesor |
| estudiante1@kimy.edu | Kimy2026! | Estudiante |

## Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Next.js 15  │────▶│  NestJS API  │────▶│ PostgreSQL   │
│  Frontend    │     │  Backend     │     │ + pgvector   │
└─────────────┐     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────┴───────┐
                    │   Workers    │
                    │  (BullMQ)    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌────────┐  ┌────────┐
         │ OpenAI │  │CrossRef│  │  MinIO  │
         │ GPT-4o │  │  API   │  │   S3    │
         └────────┘  └────────┘  └────────┘
```

## Pipeline de IA

1. **Extracción**: mammoth.js (DOCX) / pdf-parse (PDF)
2. **Chunking**: RecursiveCharacterTextSplitter (1500 tokens)
3. **Embeddings**: text-embedding-3-large → pgvector
4. **Análisis**: GPT-4o con prompt especializado en evaluación académica
5. **Output**: Scores por dimensión + hallazgos con correcciones + nota

## Módulos

1. **Autenticación**: JWT + roles (Student, Advisor, Coordinator, Admin)
2. **Documentos Patrón**: Carga y versionado de templates institucionales
3. **Avances**: Upload, versionado, previsualización
4. **Análisis IA**: Pipeline automatizado de evaluación
5. **Revisión**: Panel lado a lado con feedback humano
6. **Fine-tuning**: Recolección de pares para mejora continua
7. **Plagio**: Detección por embeddings coseno con pgvector
8. **Referencias**: Validación con CrossRef API
9. **ORCID**: OAuth 2.0 para perfiles de asesores
10. **Reportes**: Generación de actas en HTML/PDF
11. **Dashboard**: KPIs y estadísticas
12. **Notificaciones**: In-app y push (Expo)

## Licencia

Proyecto académico — LAB01 HLJA
