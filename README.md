# PickMe

> SaaS de gestión de salida escolar. Digitaliza y audita el proceso de retiro de alumnos en colegios.

---

## ¿Qué es PickMe?

PickMe es una plataforma multi-tenant (un **workspace por colegio**) que reemplaza los procesos manuales de retiro escolar por un flujo digital trazable. Cada colegio opera de forma completamente aislada. El sistema cubre:

- Apertura de jornadas de salida (manual o automática por horario).
- Anuncio del retiro por parte del apoderado (picker) vía WhatsApp o QR.
- Validación por personal de portería (staff) con OTP de 6 dígitos.
- Board de TV en tiempo real con estado de alumnos.
- Registro forense de cada jornada (log .txt + SHA-256).

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 · CSS Modules (sin Tailwind) |
| Lenguaje | TypeScript (strict) |
| Auth | NextAuth v5 · JWT · Google OAuth |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL (Neon) |
| Tiempo real | Polling cada 5 s (sin WebSockets) |
| Deploy | Vercel + Neon |

---

## Roles y control de acceso

| Rol | Descripción | Acceso |
|---|---|---|
| `SCHOOL_ADMIN` | Director / dueño del workspace | `/admin/*` |
| `STAFF` | Personal de portería | `/staff` |
| Anónimo | Picker (apoderado) | `/retirar`, `/board` |

- El middleware y `auth.ts` redirigen a `STAFF` fuera de `/admin` → `/staff`.
- `/staff` está protegido con guard en Server Component (requiere sesión activa y estado `ACTIVE`).
- Cuentas de staff con estado `PENDING` son redirigidas automáticamente a `/staff/join?pending=1`.
- El admin invita staff desde `/admin/staff` mediante registro directo o generación de enlaces de invitación con token temporal (`/staff/join?token=...`).

---

## Rutas principales

### Públicas
| Ruta | Descripción |
|---|---|
| `/` | Landing / home |
| `/auth/login` | Inicio de sesión (NextAuth) |
| `/onboarding` | Selección de rol inicial (Director o Personal de Portón) |
| `/staff/join` | Portal de vinculación o aceptación de invitación con token |
| `/retirar` | Picker anuncia retiro y recibe OTP |
| `/board` | Smart TV Board (lista viva de custodia) |
| `/board/[sessionId]` | Board de jornada específica con QR de acceso directo |

### Admin (`/admin`)
| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard principal |
| `/admin/cursos` | Gestión de nómina y asistencia diaria |
| `/admin/staff` | Gestión de personal de portería |
| `/admin/auditoria` | Registro forense de jornadas |
| `/admin/simulador` | Simulador de jornada (feature secundaria) |

### Staff
| Ruta | Descripción |
|---|---|
| `/staff` | Cola de retiros en tiempo real |

### APIs
| Endpoint | Descripción |
|---|---|
| `GET /api/board/[sessionId]` | Estado de sesión para el Board |
| `POST /api/pickup/lookup` | Busca alumno por nombre/código |
| `POST /api/pickup/solicitar` | Picker solicita retiro → genera OTP |
| `POST /api/pickup/verificar-handover` | Staff valida OTP → IN_TRANSIT |
| `GET /api/staff/queue` | Cola de retiros (polling 5 s) |
| `GET /api/admin/schedule` | Configuración de horario automático |
| `GET /api/cron/auto-open-sessions` | Cron: abre jornadas a la hora configurada |

---

## Setup local

### Requisitos
- Node.js ≥ 20
- PostgreSQL (o cuenta Neon)
- Cuenta Google Cloud con OAuth 2.0 configurado

### Pasos

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd pickme
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con los valores reales

# 3. Aplicar schema a la base de datos
npx prisma db push

# 4. (Opcional) Seed inicial
npx prisma db seed

# 5. Arrancar en desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL (Neon o local) |
| `NEXTAUTH_SECRET` | Secret para firmar JWTs de NextAuth |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID de Google Cloud |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret de Google Cloud |
| `CRON_SECRET` | Bearer token para autorizar el endpoint de cron |

---

## Evaluación / Demo

La cuenta de demostración es **`sofia@sanmartin.edu`** con rol `SCHOOL_ADMIN`, registrada en la base de datos del entorno de staging. No existe ninguna cuenta hardcodeada en el código fuente.

Para acceder en staging, iniciar sesión con Google usando esa dirección de correo.

---

## Documentación adicional

- [PRD — Product Requirements Document](docs/PRD.md)
- [SDD — Software Design Document](docs/SDD.md)
