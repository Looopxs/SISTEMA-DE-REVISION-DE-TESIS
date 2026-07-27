# Guía de Despliegue — JORANA IA

## Arquitectura de producción

```
GitHub (código)
   ├── Backend  → Render.com (Web Service gratuito)
   ├── Frontend → Vercel (Static/Next.js gratuito)
   ├── Base de datos → Neon.tech (PostgreSQL gratuito)
   ├── Redis → Upstash.com (Redis gratuito)
   └── Archivos → Supabase Storage (gratuito 1GB)
```

---

## PASO 1 — Base de datos PostgreSQL en Neon (GRATIS)

1. Ve a [https://neon.tech](https://neon.tech) y crea cuenta con GitHub
2. Crea un nuevo proyecto: **jorana-ia**
3. Copia la **Connection String** que se ve así:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Guárdala — la necesitas para el siguiente paso

---

## PASO 2 — Redis en Upstash (GRATIS)

1. Ve a [https://upstash.com](https://upstash.com) y crea cuenta
2. Crea una base de datos Redis: **jorana-redis**, región **us-east-1**
3. Copia la **REDIS_URL** (formato `redis://default:xxx@xxx.upstash.io:xxxxx`)

---

## PASO 3 — Backend en Render.com (GRATIS)

1. Ve a [https://render.com](https://render.com) y crea cuenta con GitHub
2. Haz clic en **New > Web Service**
3. Conecta el repositorio: `Looopxs/SISTEMA-DE-REVISION-DE-TESIS`
4. Configura:
   - **Name**: `jorana-ia-api`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: dejar vacío
   - **Build Command**:
     ```
     npm install --legacy-peer-deps && npx prisma generate --schema=packages/database/prisma/schema.prisma && cd apps/api && npx nest build
     ```
   - **Start Command**:
     ```
     node apps/api/dist/main.js
     ```
   - **Plan**: Free

5. En la sección **Environment Variables**, agrega:

   | Variable | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(Connection string de Neon)* |
   | `REDIS_URL` | *(URL de Upstash)* |
   | `GEMINI_API_KEY` | *(Tu API key de Google AI Studio)* |
   | `JWT_SECRET` | *(String aleatorio de 64 chars)* |
   | `ENCRYPTION_KEY` | *(String hex de 64 chars)* |
   | `FRONTEND_URL` | `https://jorana-ia.vercel.app` *(actualizar después)* |
   | `PORT` | `10000` |

6. Haz clic en **Create Web Service**
7. Espera que el build termine (~5 min)
8. Copia la URL generada: `https://jorana-ia-api.onrender.com`

### Migrar la base de datos en Render

Después del primer deploy, en Render ve a tu servicio > **Shell** y ejecuta:
```bash
cd packages/database && npx prisma migrate deploy && npx ts-node prisma/seed.ts
```
O desde tu máquina local con la DATABASE_URL de Neon:
```bash
cd packages/database
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npx ts-node prisma/seed.ts
```

---

## PASO 4 — Frontend en Vercel (GRATIS)

1. Ve a [https://vercel.com](https://vercel.com) y crea cuenta con GitHub
2. Haz clic en **Add New > Project**
3. Importa el repositorio `SISTEMA-DE-REVISION-DE-TESIS`
4. Configura:
   - **Framework**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && npm install --legacy-peer-deps && npx turbo run build --filter=@kimy/web`
   - **Output Directory**: `.next`

5. En **Environment Variables** agrega:

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://jorana-ia-api.onrender.com` |

6. Haz clic en **Deploy**
7. Copia la URL: `https://jorana-ia.vercel.app`

8. **Actualiza** la variable `FRONTEND_URL` en Render con la URL de Vercel

---

## PASO 5 — Verificar que todo funciona

- **API Health**: `https://jorana-ia-api.onrender.com/api/health`
- **API Docs**: `https://jorana-ia-api.onrender.com/api/docs`
- **Frontend**: `https://jorana-ia.vercel.app`
- **Login**: admin@jorana.pe / admin123 (o el que creó el seed)

---

## Notas importantes

- **Cold start de Render**: El plan gratuito "duerme" el servicio después de 15 min de inactividad. La primera petición puede tardar ~30 segundos en despertar.
- **Límites gratuitos**: Neon (0.5 GB DB), Upstash (10k comandos/día), Render (750 h/mes), Vercel (100 GB bandwidth/mes) — suficiente para demostración académica.
- **Actualiza** `FRONTEND_URL` en Render cada vez que la URL de Vercel cambie.
