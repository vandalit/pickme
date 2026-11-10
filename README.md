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
| Framework | Next.js 16 (App Router) |
| UI | React 19 · CSS Modules (sin Tailwind) |
| Lenguaje | TypeScript (strict) |
| Auth | NextAuth v5 · JWT · Google OAuth |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL 16 en Docker local · Neon PostgreSQL para Vercel |
| Tiempo real | Polling cada 5 s (sin WebSockets) |
| Deploy | Vercel + Neon (remoto) |

### Entornos y datos

- **Desarrollo local:** PostgreSQL del servicio `db` en Docker. `npm run dev` usa `LOCAL_DATABASE_URL`; no usa Neon aunque `DATABASE_URL` esté presente en `.env`.
- **Vercel:** usa `DATABASE_URL` configurada en Vercel, apuntando a Neon. Production y Preview deben tener destinos separados; no se debe validar con datos de producción.
- **No se sincronizan automáticamente los datos entre local y Neon.** Antes de importar, restaurar o migrar datos se debe confirmar el origen de verdad y contar con respaldo.
- Las migraciones Prisma usan la base local por defecto. Para una operación remota hay que indicar explícitamente `PICKME_DATABASE_TARGET=remote`.
- El seed actual elimina los datos de las tablas antes de crear datos demo. Está bloqueado para destinos remotos y exige `PICKME_SEED_RESET=true`; no ejecutarlo en Vercel ni en una base con datos que se quieran conservar.
- La arquitectura, estado de configuración y decisiones pendientes se registran en [DECISIONES_ARQUITECTURA.md](docs/DECISIONES_ARQUITECTURA.md).

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
| `GET /api/pickup/lookup` | Busca alumnos autorizados por teléfono y jornada |
| `POST /api/pickup/solicitar` | Picker solicita retiro → genera OTP |
| `POST /api/pickup/verificar-handover` | Staff valida OTP → IN_TRANSIT |
| `GET /api/staff/queue` | Cola de retiros (polling 5 s) |
| `GET /api/admin/schedule` | Configuración de horario automático |
| `GET /api/cron/auto-open-sessions` | Cron: abre jornadas a la hora configurada |

---

## Setup local

### Requisitos
- Node.js ≥ 20
- Docker con PostgreSQL 16 (servicio local de desarrollo)
- Cuenta Google Cloud con OAuth 2.0 configurado

### Pasos

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd pickme
npm install

# 2. Configurar variables locales
cp .env.example .env.local
# Mantener LOCAL_DATABASE_URL apuntando a localhost:5432.
# Configurar credenciales OAuth locales si se van a probar en localhost.

# 3. Iniciar PostgreSQL local
docker compose up -d db

# 4. Aplicar migraciones solo a la base local
npx prisma migrate deploy

# 5. Arrancar la aplicación
npm run dev
```

La app queda disponible en `http://localhost:3000`.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `LOCAL_DATABASE_URL` | Connection string del PostgreSQL local Docker |
| `DATABASE_URL` | Connection string remoto; Vercel la proporciona en sus entornos |
| `PICKME_DATABASE_TARGET` | `local` por defecto; usar `remote` solo para una operación remota explícita |
| `NEXTAUTH_SECRET` | Secret para firmar JWTs de NextAuth |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID de Google Cloud |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret de Google Cloud |
| `CRON_SECRET` | Bearer token para autorizar el endpoint de cron |

---

## Evaluación / Demo

Las cuentas demo descritas en planes históricos no están confirmadas como existentes ni deben recrearse en Neon/Production. Confirmar primero el entorno en la matriz del [checklist](docs/CHECKLIST_VALIDACION_MVP.md).

---

## Documentación adicional

- [PRD — Product Requirements Document](docs/PRD.md)
- [SDD — Software Design Document](docs/SDD.md)
- [Checklist operativo de validación del MVP](docs/CHECKLIST_VALIDACION_MVP.md)
- [Plan de validación y tests](docs/PLAN_DE_VALIDACION_Y_TESTS.md)
- [Arquitectura de entornos y decisiones pendientes](docs/DECISIONES_ARQUITECTURA.md)
