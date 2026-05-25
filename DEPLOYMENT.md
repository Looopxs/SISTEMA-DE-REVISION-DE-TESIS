# 🚀 Guía de Despliegue — JORANA IA

Repositorio: **https://github.com/Looopxs/LAB01_HLJA**

---

## 📋 Estrategia Recomendada

| Componente | Plataforma | Plan | URL |
|------------|-----------|------|-----|
| **Backend** (NestJS) | Render | Free Web Service | `jorana-ia-api.onrender.com` |
| **Frontend** (Next.js) | Vercel | Free Hobby | `jorana-ia.vercel.app` |
| **Base de Datos** | Neon (PostgreSQL) | Free | — |
| **Redis** | Upstash | Free | — |

---

## PASO 1 — Subir código a GitHub

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
# Inicializar repositorio local
git init

# Agregar todos los archivos (respetando .gitignore)
git add .

# Primer commit
git commit -m "feat: initial commit — JORANA IA LAB01_HLJA"

# Conectar con tu repositorio en GitHub
git remote add origin https://github.com/Looopxs/LAB01_HLJA.git

# Subir al repositorio
git branch -M main
git push -u origin main
```

> ⚠️ **Importante:** Crea el repositorio vacío en GitHub primero:
> 1. Ve a https://github.com/new
> 2. Nombre: `LAB01_HLJA`
> 3. Visibilidad: **Public** (para planes gratis)
> 4. **NO** inicialices con README ni .gitignore (ya los tienes)

---

## PASO 2 — Base de Datos: Neon (PostgreSQL gratis)

1. Ve a https://neon.tech y crea una cuenta gratuita
2. Crea un proyecto nuevo: `jorana-ia`
3. Copia la **Connection String** (formato `postgresql://...`)
4. Guárdala como `DATABASE_URL`

---

## PASO 3 — Redis: Upstash (gratis)

1. Ve a https://upstash.com
2. Crea una base Redis: `jorana-redis`
3. Copia la **REDIS_URL**

---

## PASO 4 — Backend en Render

1. Ve a https://render.com → **New** → **Web Service**
2. Conecta tu cuenta de GitHub
3. Selecciona el repositorio **Looopxs/LAB01_HLJA**
4. Configuración:
   - **Name:** `jorana-ia-api`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Build Command:** `npm install && cd apps/api && npx nest build`
   - **Start Command:** `node apps/api/dist/main.js`
   - **Plan:** Free
5. En **Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `API_PORT` | `3001` |
| `DATABASE_URL` | Tu URL de Neon |
| `REDIS_URL` | Tu URL de Upstash |
| `JWT_SECRET` | Un string aleatorio largo (ej: genera en https://generate-secret.now.sh/64) |
| `OPENAI_API_KEY` | Tu API key de OpenAI |
| `FRONTEND_URL` | `https://jorana-ia.vercel.app` (actualizar tras deploy) |

6. Haz clic en **Create Web Service**
7. Espera que compile (~3-5 min). Anota la URL: `https://jorana-ia-api.onrender.com`

> 📝 **Nota:** En el plan gratuito de Render, el servidor se "duerme" tras 15 min de inactividad.
> La primera petición después de eso tarda ~30 seg en "despertar".

---

## PASO 5 — Frontend en Vercel

1. Ve a https://vercel.com → **Add New** → **Project**
2. Conecta GitHub y selecciona **Looopxs/LAB01_HLJA**
3. Configuración del proyecto:
   - **Framework Preset:** Next.js (detectado automático)
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build` (usa el de `apps/web`)
   - **Output Directory:** `.next`
4. En **Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://jorana-ia-api.onrender.com/api` |

5. Haz clic en **Deploy**
6. Vercel te dará una URL como `https://jorana-ia.vercel.app`

---

## PASO 6 — Actualizar CORS del backend

Vuelve a Render y actualiza la variable:
- `FRONTEND_URL` → `https://jorana-ia.vercel.app` (tu URL de Vercel)

Luego en Render: **Manual Deploy** para que tome el cambio.

---

## PASO 7 — Ejecutar migraciones de BD

Desde tu máquina local, con la `DATABASE_URL` de Neon:

```bash
# En la raíz del proyecto
cd packages/database

# Aplicar schema
DATABASE_URL="postgresql://..." npx prisma db push

# Cargar datos iniciales
DATABASE_URL="postgresql://..." npx tsx seed.ts
```

---

## ✅ Verificación Final

| Check | URL |
|-------|-----|
| API Health | `https://jorana-ia-api.onrender.com/api/docs` |
| Frontend | `https://jorana-ia.vercel.app` |
| Login | admin@kimy.edu / Kimy2026! |

---

## 🔄 Deploy Continuo (automático)

Una vez configurado, **cada `git push` a `main` desplegará automáticamente**:
- Vercel detecta cambios en `apps/web` y redespliega el frontend
- Render detecta cambios y reconstruye el backend

```bash
# Workflow normal de desarrollo
git add .
git commit -m "fix: descripción del cambio"
git push origin main
# → CI/CD se ejecuta automáticamente 🚀
```
