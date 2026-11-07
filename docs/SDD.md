# SDD — Software Design Document: PickMe

**Versión:** 2.0  
**Estado:** En desarrollo activo (commit base: 82eb1f2)  
**Documento de producto relacionado:** [PRD.md](PRD.md)

---

## 1. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel (Edge/Serverless)              │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────────┐  │
│  │  App Router │   │  API Routes │   │  Middleware       │  │
│  │  (RSC/SC)   │   │  (/api/*)   │   │  (auth guard)    │  │
│  └──────┬──────┘   └──────┬──────┘   └──────────────────┘  │
│         │                 │                                  │
│         └────────┬────────┘                                  │
│                  │                                           │
│           ┌──────▼──────┐                                   │
│           │   Prisma 7  │                                   │
│           │   Client    │                                   │
│           └──────┬──────┘                                   │
└──────────────────┼──────────────────────────────────────────┘
                   │ TLS / connection pooling
           ┌───────▼───────┐
           │  PostgreSQL   │
           │  (Neon)       │
           └───────────────┘

Actores externos:
  - Browser (picker, staff, admin, TV board)
  - Google OAuth 2.0
  - Cron scheduler (Vercel Cron / externo)
```

**Decisiones de arquitectura clave:**
- **Sin WebSockets**: polling de 5 s desde el cliente. Simplicidad operativa en serverless.
- **Multi-tenant por `schoolId`**: cada query a entidades escolares incluye `schoolId` extraído de la sesión JWT. No existe routing de base de datos por tenant; es filtrado en capa de aplicación.
- **Server Components por defecto**: solo se usan Client Components donde se necesita interactividad o hooks de React.

---

## 2. Schema de base de datos

### Schema actual (Prisma)

```prisma
model School {
  id                String    @id @default(cuid())
  name              String
  address           String?
  emergencyPhone    String?
  qrRefreshSecs     Int       @default(30)
  defaultExitTime   String?   // "HH:MM" en timezone local del colegio
  timezone          String    @default("America/Santiago")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

enum Role {
  SCHOOL_ADMIN
  STAFF
  SUPERADMIN
}

model User {
  id        String   @id @default(cuid())
  schoolId  String
  email     String   @unique
  name      String?
  role      Role
  googleId  String?  @unique
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Classroom {
  id        String   @id @default(cuid())
  schoolId  String
  grade     String
  section   String
  createdAt DateTime @default(now())
}

enum StudentStatus {
  ACTIVE
  ABSENT
  WITHDRAWN
}

model Student {
  id          String        @id @default(cuid())
  classroomId String
  fullName    String
  initials    String
  animalId    String
  colorId     String
  status      StudentStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
}

model Guardian {
  id              String   @id @default(cuid())
  whatsappNumber  String
  fullName        String
  idDocumentHash  String
  createdAt       DateTime @default(now())
}

model StudentGuardian {
  studentId  String
  guardianId String
  isPrimary  Boolean @default(false)
  @@id([studentId, guardianId])
}

model Picker {
  id             String   @id @default(cuid())
  whatsappNumber String
  fullName       String
  relationship   String?
  idDocumentHash String
  createdAt      DateTime @default(now())
}

model Authorization {
  id          String    @id @default(cuid())
  studentId   String
  pickerId    String?
  guardianId  String?
  type        String
  status      String
  validFrom   DateTime?
  validUntil  DateTime?
  legalProof  String?
  createdAt   DateTime  @default(now())
}

enum SessionStatus {
  DRAFT
  OPEN
  CLOSED
}

model PickupSession {
  id          String        @id @default(cuid())
  schoolId    String
  sessionCode String
  status      SessionStatus @default(DRAFT)
  startedAt   DateTime?
  closedAt    DateTime?
  createdAt   DateTime      @default(now())
}

enum PickupEventStatus {
  WAITING
  IN_PROCESS
  HANDOVER
  IN_TRANSIT
  ARRIVED
  ALERT
}

model PickupEvent {
  id                 String            @id @default(cuid())
  sessionId          String
  studentId          String
  pickerId           String?
  staffId            String?
  status             PickupEventStatus @default(WAITING)
  handoverCode       String?
  handoverExpiry     DateTime?
  pickerScannedAt    DateTime?
  staffConfirmedAt   DateTime?
  inTransitAt        DateTime?
  arrivedAt          DateTime?
  alertTriggeredAt   DateTime?
  notes              String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
}

model Incident {
  id             String    @id @default(cuid())
  eventId        String
  type           String
  description    String
  resolvedAt     DateTime?
  resolutionNote String?
  createdAt      DateTime  @default(now())
}
```

### Próximos cambios al schema (no implementados aún)

```prisma
// Gestión de estado de usuario
enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

// Añadir a model User:
// status UserStatus @default(ACTIVE)

// Invitaciones de staff por token
model Invitation {
  id         String    @id @default(cuid())
  schoolId   String
  email      String
  role       Role
  token      String    @unique
  expiresAt  DateTime
  acceptedAt DateTime?
  createdAt  DateTime  @default(now())
}
```

> **Nota:** `School.timezone` ya está en el schema actual con `@default("America/Santiago")`.

---

## 3. Control de acceso y autenticación

### NextAuth v5 — Configuración

- **Provider Credentials**: `prisma.user.findUnique({ where: { email } })`. Verifica que el usuario exista en BD y tenga rol válido. No se almacenan contraseñas.
- **Provider Google OAuth**: al autenticar con Google, se hace `prisma.user.findUnique({ where: { googleId } })` o por email para resolver el rol real desde BD.
- **JWT callback**: el JWT incluye `{ id, schoolId, role }` extraídos del usuario en BD.
- **Session callback**: la sesión expone `{ id, schoolId, role }` al cliente.

### Middleware (`middleware.ts`)

```
/admin/*  → requiere role === SCHOOL_ADMIN
            si role === STAFF → redirect /staff
            si no autenticado → redirect /auth/login

/staff    → requiere autenticación
            guard adicional en Server Component
```

Rutas públicas que el middleware no intercepta: `/`, `/auth/login`, `/retirar`, `/board`, `/board/*`.

### Tabla de acceso por ruta

| Ruta | Acceso |
|---|---|
| `/` | Público |
| `/auth/login` | Público |
| `/retirar` | Público (anónimo) |
| `/board` | Público |
| `/board/[sessionId]` | Público |
| `/admin` y subrutas | `SCHOOL_ADMIN` |
| `/staff` | `STAFF` (autenticado) |
| `/api/staff/queue` | `STAFF` (sesión JWT) |
| `/api/pickup/*` | Público (validación interna por OTP) |
| `/api/admin/*` | `SCHOOL_ADMIN` (sesión JWT) |
| `/api/cron/auto-open-sessions` | Bearer `CRON_SECRET` |

---

## 4. Rutas y estructura de páginas

```
app/
├── page.tsx                        → Landing
├── auth/
│   └── login/page.tsx              → Pantalla de login (NextAuth)
├── retirar/
│   └── page.tsx                    → Picker: anunciar retiro
├── board/
│   ├── page.tsx                    → Board general
│   └── [sessionId]/page.tsx        → Board de sesión específica
├── admin/
│   ├── page.tsx                    → Dashboard admin
│   ├── cursos/page.tsx             → Nómina y asistencia
│   ├── staff/page.tsx              → Gestión de personal
│   ├── auditoria/page.tsx          → Registro forense
│   ├── onboarding/page.tsx         → Onboarding del colegio
│   └── simulador/page.tsx          → Simulador de jornada
├── staff/
│   └── page.tsx                    → Cola de retiros (staff)
│
│   [Próximas rutas]
├── onboarding/page.tsx             → Onboarding bifurcado (admin nuevo)
└── staff/join/page.tsx             → Staff: aceptar invitación con token
```

---

## 5. Flujos principales

### 5.1 Apertura de jornada (manual)

```
Admin → POST /api/admin/schedule (o acción de formulario en /admin)
  1. Verifica que no exista PickupSession OPEN para schoolId
  2. Crea PickupSession { schoolId, status: OPEN, startedAt: now() }
  3. Consulta Student donde classroomId.schoolId = schoolId AND status = ACTIVE
  4. Para cada alumno:
       Crea PickupEvent { sessionId, studentId, status: WAITING }
  5. Responde con sessionId
```

### 5.2 Apertura automática (cron)

```
Vercel Cron / scheduler externo → GET /api/cron/auto-open-sessions
  Header: Authorization: Bearer CRON_SECRET

  1. Valida bearer token
  2. Consulta todos los School con defaultExitTime definido
  3. Para cada School:
       Convierte now() a timezone del colegio
       Si hora local == defaultExitTime (±1 min):
         Si no hay PickupSession OPEN → ejecuta flujo de apertura (5.1)
```

### 5.3 Picker solicita retiro (OTP)

```
Picker → POST /api/pickup/solicitar { studentId, pickerId? }
  1. Busca PickupEvent WAITING para studentId en sesión OPEN
  2. Genera handoverCode (6 dígitos), handoverExpiry (now + N min)
  3. Actualiza PickupEvent { status: IN_PROCESS, handoverCode, handoverExpiry }
  4. Retorna { handoverCode }
```

### 5.4 Staff valida OTP (handover)

```
Staff → POST /api/pickup/verificar-handover { handoverCode, eventId }
  1. Busca PickupEvent por eventId
  2. Verifica handoverCode y que handoverExpiry > now()
  3. Actualiza PickupEvent { status: IN_TRANSIT, staffId, inTransitAt: now() }
  4. Retorna { ok: true }
```

### 5.5 Cierre de jornada y log forense

```
Admin → acción de cierre en /admin
  1. Actualiza PickupSession { status: CLOSED, closedAt: now() }
  2. Consulta todos los PickupEvent de la sesión con sus relaciones
  3. Genera log .txt estructurado:
       - Cabecera: schoolId, sessionId, sessionCode, closedAt
       - Por evento: studentId, pickerId, staffId, status, timestamps
  4. Calcula SHA-256 del log
  5. Persiste o retorna el log para descarga
```

### 5.6 Polling del Board y cola de Staff

```
Cliente (Browser) → GET /api/board/[sessionId]   (cada 5 s)
  Retorna estado actual de todos los PickupEvent de la sesión

Cliente (Staff) → GET /api/staff/queue            (cada 5 s)
  Retorna PickupEvent en estados IN_PROCESS / HANDOVER para schoolId del staff
```

---

## 6. Stack tecnológico detallado

| Área | Tecnología | Versión | Notas |
|---|---|---|---|
| Framework | Next.js | 15 | App Router; RSC por defecto |
| Runtime UI | React | 19 | — |
| Lenguaje | TypeScript | 5.x | strict mode |
| Estilos | CSS Modules | — | Sin frameworks CSS externos |
| Auth | NextAuth | v5 (beta) | JWT strategy |
| ORM | Prisma | 7 | — |
| BD | PostgreSQL | 16 | Neon (serverless) |
| Deploy | Vercel | — | Edge middleware, Serverless Functions |
| Tiempo real | Polling | — | 5 s intervalo; sin WebSockets |

---

## 7. Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (Neon) | Sí |
| `NEXTAUTH_SECRET` | Secret para firmar JWTs | Sí |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | Sí |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | Sí |
| `CRON_SECRET` | Bearer token para endpoint de cron | Sí |

---

## 8. Estrategia de despliegue

### Producción
- **Frontend + API Routes:** Vercel (Serverless Functions en Node.js runtime).
- **Base de datos:** Neon PostgreSQL. Connection pooling via `DATABASE_URL` con `pgbouncer=true` en modo serverless.
- **Cron:** Vercel Cron Jobs o servicio externo tipo cron-job.org con el endpoint `GET /api/cron/auto-open-sessions`.
- **Variables de entorno:** configuradas en Vercel Dashboard (no en repositorio).

### Local / Desarrollo
- `npm run dev` con Next.js en modo desarrollo.
- PostgreSQL local o Neon branch de desarrollo.
- `npx prisma db push` para sincronizar el schema.
- `npx prisma studio` para explorar datos.

### CI
- No hay pipeline de CI configurado actualmente.
- Se recomienda: lint (`eslint`), type-check (`tsc --noEmit`), y tests e2e antes de merge a `main`.

---

## 9. Qué NO está implementado aún

| Funcionalidad | Estado | Notas |
|---|---|---|
| `UserStatus` (PENDING/ACTIVE/SUSPENDED) | Próxima versión | Schema pendiente |
| Modelo `Invitation` con token | Próxima versión | Schema pendiente |
| Flujo `/staff/join` (invitation link) | Próxima versión | Depende de `Invitation` |
| Flujo `/onboarding` bifurcado | Próxima versión | Ruta existe, flujo incompleto |
| WebSockets / tiempo real push | No planeado | Polling 5 s es suficiente para MVP |
| Almacenamiento de contraseñas (`bcrypt`) | No planeado | Staff usa Google OAuth; auth sin contraseña |
| Llegadas tardías (picker post-cierre) | Próxima versión | Requiere lógica de sesión extendida |
| Autorizaciones delegadas (Guardian) | Parcialmente modelado | Schema existe; UI pendiente |

---

## 10. Decisiones de diseño relevantes

### Sin WebSockets
El polling cada 5 s es suficiente para la latencia aceptable en el flujo de salida escolar (handover de ~3 min). Evitar WebSockets elimina la necesidad de servicios externos de tiempo real y simplifica el despliegue serverless.

### Sin contraseñas
El personal de portería (STAFF) se autentica con Google OAuth. No se almacena ningún hash de contraseña. La próxima versión introducirá invitaciones por token de un solo uso que actúan como factor de autenticación, manteniendo el mismo principio.

### Multi-tenant por filtrado en aplicación
No se usa row-level security en PostgreSQL ni bases de datos separadas por tenant. El aislamiento se garantiza incluyendo `schoolId` (extraído del JWT de la sesión) en cada query relevante. Es responsabilidad del desarrollador incluir este filtro; se debe auditar en code review.

### CSS Modules
Decisión explícita para mantener el bundle mínimo, evitar purge de clases no utilizadas y tener estilos colocalizados con los componentes. No se acepta Tailwind ni styled-components en PRs.
