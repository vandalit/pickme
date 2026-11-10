# SDD — Software Design Document: PickMe

**Versión:** 2.5  
**Estado:** En desarrollo activo y preparación de QA  
**Documento de producto relacionado:** [PRD.md](PRD.md)

> **Estado documental:** contiene decisiones y modelos históricos que no reflejan por completo el código actual. Para entornos y base de datos, usar [DECISIONES_ARQUITECTURA.md](DECISIONES_ARQUITECTURA.md) y README. Resolver las discrepancias pendientes una por una.

---

## 1. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js 16 (App Router)              │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────────┐  │
│  │  App Router │   │  API Routes │   │  Middleware       │  │
│  │  (RSC/SC)   │   │  (/api/*)   │   │  (Lightweight)   │  │
│  └──────┬──────┘   └──────┬──────┘   └──────────────────┘  │
│         │                 │                   │             │
│         │          ┌──────▼──────┐     ┌──────▼──────────┐ │
│         │          │   auth.ts   │     │  auth.config.ts │ │
│         │          │ (Providers) │     │  (Session/Edge) │ │
│         │          └──────┬──────┘     └─────────────────┘ │
│         │                 │                                 │
│         └────────┬────────┘                                 │
│                  │                                          │
│           ┌──────▼──────┐                                   │
│           │   Prisma 7  │                                   │
│           │ (pg Adapter)│                                   │
│           └──────┬──────┘                                   │
└──────────────────┼──────────────────────────────────────────┘
                   │ TLS 1.3 / connection pooling
           ┌───────▼───────┐
           │  PostgreSQL   │
           │    (Neon)     │
           └───────────────┘

Actores externos y canales:
  - Google Workspace OAuth 2.0 (Directores y Staff)
  - Smart TV Patio (Capa 0: Avatares anónimos y QR de sesión)
  - PWA Móvil / WhatsApp Webhook (Apoderados y Transportistas)
  - Cron Scheduler (/api/cron/auto-open-sessions)
```

### Decisiones de Arquitectura Clave
1. **Separación de `auth.config.ts` y `auth.ts`**: El middleware de Next.js corre sobre `auth.config.ts` (liviano, sin dependencias nativas de Node ni Prisma), evitando errores de Edge Runtime y garantizando que el routing hacia rutas públicas (como `/simulador`) nunca se bloquee.
2. **Persistencia por entorno**: Vercel usa el PostgreSQL remoto configurado en `DATABASE_URL` (Neon); desarrollo local usa PostgreSQL Docker mediante `LOCAL_DATABASE_URL`. Los mocks del simulador son independientes de ambas bases.
3. **Multi-tenant Estricto**: Todo modelo escolar (`Classroom`, `Student`, `PickupSession`, `Invitation`, `TransportService`) contiene clave foránea obligatoria `schoolId`. Las consultas siempre filtran por el `schoolId` verificado del JWT del usuario.
4. **Cadena de Custodia con Verificación Cruzada**: El personal de portón no puede entregar un alumno sin que exista un match previo entre la identidad autorizada (pase o furgón) y el `sessionCode` activo proyectado en el patio.

---

## 2. Schema de Base de Datos (Prisma)

```prisma
model School {
  id                String             @id @default(cuid())
  name              String
  address           String?
  emergencyPhone    String?
  qrRefreshSecs     Int                @default(300)
  defaultExitTime   String?            // "HH:MM" en timezone local
  timezone          String             @default("America/Santiago")
  pinLength         Int                @default(6) // 2, 3 o 6 dígitos
  users             User[]
  classrooms        Classroom[]
  sessions          PickupSession[]
  invitations       Invitation[]
  transports        TransportService[]
  dailyPasses       DailyPass[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

enum Role {
  SUPERADMIN
  SCHOOL_ADMIN
  STAFF
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

model User {
  id        String     @id @default(cuid())
  schoolId  String?    // Nullable antes de completar onboarding
  email     String     @unique
  name      String?
  role      Role       @default(SCHOOL_ADMIN)
  status    UserStatus @default(ACTIVE)
  googleId  String?    @unique
  avatarUrl String?
  school    School?    @relation(fields: [schoolId], references: [id], onDelete: SetNull)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Invitation {
  id         String    @id @default(uuid())
  schoolId   String
  email      String
  role       Role      @default(STAFF)
  token      String    @unique // UUID para /staff/join?token=xxxx
  expiresAt  DateTime  // 48h / 7d
  acceptedAt DateTime?
  school     School    @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  createdAt  DateTime  @default(now())
}

model TransportService {
  id          String   @id @default(cuid())
  schoolId    String
  name        String   // ej: "Furgón Tío Pedro"
  driverName  String
  driverPhone String
  plateNumber String?
  token       String   @unique @default(uuid())
  tokenExpiry DateTime
  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  students    StudentTransport[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DailyPass {
  id          String    @id @default(cuid())
  schoolId    String
  studentId   String
  token       String    @unique @default(uuid())
  pickerName  String
  pickerPhone String
  pinCode     String    // Hash o PIN según pinLength (2/3/6 dígitos)
  validDate   DateTime
  usedAt      DateTime?
  revokedAt   DateTime?
  school      School    @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student     Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
}

enum EventStatus {
  WAITING           // En colegio
  IN_PROCESS        // Picker en camino
  VALIDATED         // Match exitoso (Ticket verde en portería)
  HANDOVER          // Entregado físicamente (cooldown 10 min en Smart TV)
  IN_TRANSIT        // En furgón o transporte
  ARRIVED           // En casa
  BYPASS_DELIVERED  // Entregado bajo bypass directo de Dirección
  ALERT             // Incidencia
}
```

---

## 3. Matriz de Rutas y Control de Acceso

| Ruta | Protección / Matcher | Propósito Técnico |
|---|---|---|
| `/` | Pública | Landing page institucional con llamado a acción comercial. |
| `/simulador` y `/admin/simulador` | Pública (Excluido de auth) | Sandbox didáctico en memoria para prospectos y clientes. |
| `/auth/login` | Pública | Portal de acceso con Google Workspace OAuth y Credenciales. |
| `/onboarding` | Autenticada | Selector bifurcado de rol inicial: Director o Staff. |
| `/admin/onboarding` | Autenticada (`SCHOOL_ADMIN`) | Formulario de alta de nuevo establecimiento escolar. |
| `/admin` | Autenticada (`SCHOOL_ADMIN`, `schoolId != null`) | Consola general de supervisión y bypass asistido. |
| `/admin/cursos` | Autenticada (`SCHOOL_ADMIN`) | Gestión de nóminas, asistencia diaria y botón "Send". |
| `/admin/staff` | Autenticada (`SCHOOL_ADMIN`) | Administración y generación de invitaciones para porteros. |
| `/admin/auditoria` | Autenticada (`SCHOOL_ADMIN`) | Descarga de bitácoras forenses selladas con SHA-256. |
| `/board` y `/board/[sessionId]` | Pública / PIN de sesión | Smart TV de patio escolar (Capa 0). Microestados y cooldown de 10 min. |
| `/staff` | Autenticada (`STAFF`) | Consola de portón con escáner, cola en vivo y ticket verde. |
| `/staff/join` | Pública con token | Enrolamiento y aceptación de invitación para portería. |
| `/pase/[token]` | Pública con PIN | Pase digital de emergencia con PIN de 2, 3 o 6 dígitos. |
| `/retirar` | Pública / SessionCode | Web app para que el retirador anuncie llegada y haga match con el patio. |

---

## 4. Flujo de Autenticación con Google Workspace

1. **Petición OAuth:**
   - El usuario hace clic en *"Continuar con Google Workspace"* en `/auth/login`.
   - `signIn("google", { redirectTo: "/admin" })` redirige al servidor de Google Cloud Console.
2. **Callback e Identificación (`jwt` callback):**
   - Al retornar a `/api/auth/callback/google`, NextAuth valida los tokens de Google.
   - El sistema consulta `User` en la base del entorno actual: PostgreSQL Docker local o Neon configurado en Vercel.
   - **Si el usuario no existe en la base de datos:** se ejecuta `prisma.user.create()` con `role = "SCHOOL_ADMIN"`, `status = "ACTIVE"`, `schoolId = null`.
   - Se inyecta `role`, `schoolId` y `status` en el token JWT y la sesión.
3. **Resolución de Establecimiento (`resolveUserSchool`):**
   - El usuario redirigido a `/admin` es evaluado por `resolveUserSchool(email)`.
   - Al detectar `schoolId: null`, el guard lo envía limpiamente a `/admin/onboarding` para fundar su colegio.
   - Una vez completado el onboarding, `schoolId` queda vinculado en la base de datos y accede permanentemente al panel directivo.

---

## 5. Algoritmos Core

### Asignación de Avatares (200 combinaciones deterministas)
- Algoritmo que combina 20 animales y 10 colores de alto contraste:
  `20 animales × 10 colores = 200 alumnos por curso sin ninguna colisión`.
- Asignación incremental automática al matricular cada alumno.

### Cooldown de 10 minutos en Monitor de Patio
- Al marcarse `HANDOVER` o `BYPASS_DELIVERED`, el frontend de `/board/[sessionId]` registra el timestamp del evento.
- El animalito se renderiza con un indicador de checkmark verde y un contador descendente.
- Al cumplirse 10 minutos, el elemento desaparece del DOM de la pantalla de patio para proteger el anonimato.

### Bypass de Entrega Asistida por Dirección
- Acción: `adminBypassDeliverStudentAction({ eventId, reason })`.
- Verifica que el ejecutor sea `SCHOOL_ADMIN` del colegio propietario del evento.
- Transiciona el evento a `BYPASS_DELIVERED`, guarda la firma del usuario responsable en la base de datos y cierra el ciclo de custodia en el Smart TV Board.
