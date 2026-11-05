# Guía de Despliegue en Vercel — PickMe MVP

Esta guía detalla los pasos exactos para publicar **PickMe** en Vercel con base de datos PostgreSQL remota (Neon o Supabase) y Google OAuth activo para tu caso de estudio / portafolio.

---

## 1. Requisitos Previos

1. Cuenta en [Vercel](https://vercel.com).
2. Base de datos PostgreSQL remota. **Recomendación:** [Neon.tech](https://neon.tech) (gratis, serverless, pooling nativo) o [Supabase](https://supabase.com).
3. Proyecto en [Google Cloud Console](https://console.cloud.google.com/) para OAuth 2.0 (opcional para el demo, ya que el sistema incluye bypass de evaluador).

---

## 2. Preparar Base de Datos Remota (Neon / Supabase)

1. Crea un proyecto en Neon o Supabase llamado `pickme-db`.
2. Obtén la cadena de conexión con **Connection Pooling**:
   * **Neon:** Usa la URL del pooler (terminada en `-pooler`).
   * **Supabase:** Usa el puerto `6543` (Transaction Pooler).
3. Ejecuta las migraciones y la siembra de datos desde tu terminal local hacia la base remota:
   ```bash
   DATABASE_URL="postgresql://usuario:pass@host-pooler.neon.tech/pickme_db?sslmode=require" npx prisma migrate deploy
   DATABASE_URL="postgresql://usuario:pass@host-pooler.neon.tech/pickme_db?sslmode=require" npm run db:seed
   ```

---

## 3. Variables de Entorno en Vercel Dashboard

Ve a **Settings > Environment Variables** en tu proyecto de Vercel y añade:

| Variable | Valor / Ejemplo | Obligatoria |
|---|---|:---:|
| `DATABASE_URL` | `postgresql://...neon.tech/pickme_db?sslmode=require` | **SÍ** |
| `AUTH_SECRET` | Genera una clave segura de 32+ caracteres (`openssl rand -base64 32`) | **SÍ** |
| `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` | **SÍ** |
| `NEXT_PUBLIC_APP_URL` | `https://tu-proyecto.vercel.app` | **SÍ** |
| `GOOGLE_CLIENT_ID` | Obtenido de Google Cloud Console | Opcional (Demo activo) |
| `GOOGLE_CLIENT_SECRET` | Obtenido de Google Cloud Console | Opcional (Demo activo) |
| `NEXT_PUBLIC_PUSHER_KEY` | `mock_pusher_key` (o credencial Pusher real) | Opcional |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `us2` | Opcional |

---

## 4. Configuración de Google OAuth (Google Cloud Console)

Si activas Google OAuth oficial:
1. En Google Cloud Console > **APIs & Services > Credentials**.
2. En tu **OAuth 2.0 Client ID**, añade a **Authorized redirect URIs**:
   * `https://tu-proyecto.vercel.app/api/auth/callback/google`
   * `http://localhost:3000/api/auth/callback/google` (para dev)

---

## 5. Build & Optimización Serverless (Ya configurados en el repo)

El repositorio ya cuenta con las configuraciones necesarias:
* `package.json` incluye `"postinstall": "prisma generate"` para compilar el cliente Prisma automáticamente en los servidores de Vercel.
* `src/lib/db.ts` cuenta con límites de conexión configurados para funciones serverless (`max: 5` en producción) para evitar saturar el pool de PostgreSQL.
* `src/middleware.ts` protege las rutas `/admin/*` y redirige a `/auth/login`.
