# PickMe — System Design Document (SDD)

**Documento**: Especificación Técnica y Arquitectura del Sistema  
**Versión**: 1.0 — MVP  
**Estado**: Aprobado para Implementación  
**Autoría**: Equipo de Ingeniería y Diseño de Producto  
**Fecha**: Noviembre 2026  

---

## 1. Definición del Problema y Objetivos de Ingeniería

### 1.1 Contexto y Tensión Operativa
En escuelas primarias de ~300 alumnos (arquetipo *Sofía*, coordinadora escolar), la hora de salida diaria representa un cuello de botella crítico donde colisionan cuatro factores:
1. **Fricción Tecnológica**: Padres y apoderados rechazan sistemáticamente instalar aplicaciones móviles adicionales; cualquier solución que requiera descarga nativa (Play Store / App Store) está condenada al abandono.
2. **Vulnerabilidad de Privacidad Infantil**: Exponer nombres completos o fotografías de menores en carteleras, altavoces o pantallas del portón público expone a los niños ante cualquier transeúnte o actor malicioso.
3. **Incertidumbre en la Entrega Física**: El personal de portón (maestras y auxiliares) enfrenta situaciones de alta presión cuando se presentan personas desconocidas (choferes, familiares lejanos, cuidadores) alegando autorización verbal.
4. **Ausencia de Responsabilidad Legal**: Las autorizaciones informales en cuadernos o mensajes de texto carecen de validez jurídica, no proveen trazabilidad de custodia ni timestamps fehacientes en caso de incidente.

### 1.2 Declaración de Objetivos Técnicos
* **O1 — Zero-Install**: 100% de la funcionalidad para apoderados y pickers debe operar en navegador web estándar móvil y enlaces mágicos.
* **O2 — Privacy by Design (Layer 0)**: Anonimización total en el display público mediante el sistema de identidad visual *Animal + Color*.
* **O3 — Doble Validación Físico-Digital**: El traspaso físico se sella mediante un código de traspaso efímero (*Handover Code*) de 6 dígitos ingresado por el staff.
* **O4 — Modularidad Frontend y Alta Fidelidad UX**: Arquitectura de componentes desacoplados con tokens de diseño en CSS puro, permitiendo que la misma interfaz visual sirva para producción y para un simulador interactivo de demostración (*Sandbox*).
* **O5 — Entorno Dockerizado y Portable**: Todo el stack (aplicación Next.js fullstack + base de datos PostgreSQL) empaquetado y reproducible con un solo comando.

---

## 2. Criterios de Aceptación del MVP (Product Baseline)

* **CA-1 — Anonimato Público en Smart TV (Layer 0)**:
  La vista `/board/[sessionId]` desplegada en la pantalla del portón muestra exclusivamente cuadrículas de alumnos bajo el identificador único `Animal + Color` y un código QR firmado con expiración dinámica. En ningún escenario se renderizan nombres, fotos ni iniciales de los menores.
* **CA-2 — Solicitud de Retiro sin Instalación de Apps**:
  Cualquier persona autorizada (Picker) puede escanear el QR con su cámara, acceder a una interfaz web ligera en su teléfono móvil, identificarse mediante su número de WhatsApp/código y solicitar al alumno. El sistema valida en backend la vigencia de la autorización antes de notificar al staff.
* **CA-3 — Cierre de Traspaso con Handover Code**:
  La entrega física solo cambia al estado `PICKED_UP` / `IN_TRANSIT` cuando la maestra o auxiliar tipea en su dispositivo autenticado el código numérico de 6 dígitos que el teléfono del picker despliega en pantalla.
* **CA-4 — Cadena de Custodia Inmutable y Auditoría**:
  El sistema genera un registro auditable e inalterable por cada evento de retiro (`PickupEvent`), persistiendo timestamps exactos, identificadores de picker, staff responsable, alumno, apoderado autorizante y estado de resolución.
* **CA-5 — Onboarding Product-Led con Google Auth y Simulador Guiado**:
  Un administrador escolar puede registrarse con Google OAuth y experimentar en menos de 3 minutos el ciclo completo de retiro a través de un modo de prueba interactivo (*Sandbox*) que emula en pantalla dividida la vista del Smart TV, el teléfono del picker, la tablet del staff y una maqueta visual interactiva de WhatsApp.

---

## 3. Topología del Sistema y Arquitectura de Capas

PickMe está estructurado como un **monolito modular fullstack en Next.js 16**, dockerizado, con desacoplamiento entre componentes visuales puros y controladores de datos.

```
                             INTERFACES CLIENTE (Tier 1)
 ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐
 │  Smart TV Portón │  │  Teléfono Picker  │  │   Tablet Staff   │  │  Consola Sofía   │
 │   /board/[id]    │  │     /retirar      │  │      /staff      │  │      /admin      │
 └────────┬─────────┘  └─────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
          │                      │                     │                     │
          │ HTTPS (SSR/Client)   │ HTTPS (REST)        │ HTTPS (REST + Auth) │ HTTPS (Google OAuth)
          ▼                      ▼                     ▼                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   BACKEND RUNTIME EN DOCKER (Next.js 16 - Node.js Tier 2)               │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ App Router Handlers (/api/*)                                                   │   │
│   │  ├── /api/auth/*          ➔ Sesiones NextAuth (Google OAuth para Staff/Admin)  │   │
│   │  ├── /api/sessions/*      ➔ Creación, rotación de QR y cierre de sesiones      │   │
│   │  ├── /api/pickup/*        ➔ Solicitud de retiro, generación y validación de HC │   │
│   │  └── /api/custody/*       ➔ Confirmaciones de apoderado y logs de auditoría    │   │
│   └───────────────────────────────┬────────────────────────────────────────────────┘   │
│                                   │                                                    │
│   ┌───────────────────────────────┴────────────────────────────────────────────────┐   │
│   │ Servicios de Dominio & Criptografía                                            │   │
│   │  ├── QRService            ➔ Firma HMAC-SHA256 y rotación de tokens             │   │
│   │  ├── HandoverService      ➔ Generación de 6 dígitos criptográficamente seguros │   │
│   │  ├── NotificationService  ➔ Adaptador abstracto (MockSimulator vs Twilio API)  │   │
│   │  └── PusherBroadcaster    ➔ Emisión de eventos real-time a clientes            │   │
│   └───────────────────────────────┬────────────────────────────────────────────────┘   │
│                                   │                                                    │
│   ┌───────────────────────────────┴────────────────────────────────────────────────┐   │
│   │ Prisma ORM Client                                                              │   │
│   │  └── Type-safe queries, migraciones y conexión relacional                      │   │
│   └───────────────────────────────┬────────────────────────────────────────────────┘   │
└───────────────────────────────────┼────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                 │
           ▼                                                 ▼
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│       POSTGRESQL 16 (Tier 3A)        │          │      PUSHER CHANNELS (Tier 3B)       │
│  Contenedor persistente en Docker    │          │  WebSockets Gestionados en la Nube   │
│  • Alumnos, Familias y Pickers       │          │  • Latencia < 500ms hacia Smart TV   │
│  • Registro de Eventos e Incidentes  │          │  • Notificaciones instantáneas Staff │
└──────────────────────────────────────┘          └──────────────────────────────────────┘
```

---

## 4. Modelo de Datos Físico (Prisma Schema Definitivo)

El esquema prioriza la **integridad referencial** y la **inmutabilidad de eventos de custodia**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ── ROLES Y ESTADOS ────────────────────────────────────────────────────────

enum UserRole {
  SUPERADMIN
  SCHOOL_ADMIN
  STAFF
}

enum AuthorizationType {
  PERMANENT
  SINGLE_DAY
  DATE_RANGE
  EMERGENCY
}

enum AuthorizationStatus {
  ACTIVE
  EXPIRED
  REVOKED
}

enum SessionStatus {
  DRAFT
  OPEN
  CLOSED
}

enum CustodyStatus {
  WAITING       // Alumno esperando en patio/aula
  IN_PROCESS    // Picker validado en puerta, staff preparando entrega
  HANDOVER      // Código de 6 dígitos generado, traspaso en curso
  IN_TRANSIT    // Traspaso completado por staff, en viaje hacia hogar
  ARRIVED       // Apoderado confirmó llegada (Custodia cerrada)
  ALERT         // Retardo severo, intento denegado o problema reportado
}

// ── ESCUELAS Y USUARIOS ADMINISTRATIVOS ────────────────────────────────────

model School {
  id             String          @id @default(uuid())
  name           String
  address        String?
  emergencyPhone String?
  qrRefreshSecs  Int             @default(300) // 5 minutos por defecto
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  users          User[]
  classrooms     Classroom[]
  sessions       PickupSession[]

  @@map("schools")
}

model User {
  id            String       @id @default(uuid())
  schoolId      String
  email         String       @unique
  name          String
  role          UserRole     @default(STAFF)
  googleId      String?      @unique
  avatarUrl     String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  school        School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  verifiedEvents PickupEvent[] @relation("StaffEvents")

  @@index([schoolId])
  @@map("users")
}

// ── ALUMNOS Y SALONES ──────────────────────────────────────────────────────

model Classroom {
  id        String    @id @default(uuid())
  schoolId  String
  grade     String    // Ej: "1° Básico"
  section   String    // Ej: "A"
  createdAt DateTime  @default(now())

  school    School    @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  students  Student[]

  @@unique([schoolId, grade, section])
  @@map("classrooms")
}

model Student {
  id             String          @id @default(uuid())
  classroomId    String
  fullName       String          // Solo visible en Layer 2
  initials       String          // Ej: "S.M." para Layer 1
  animalId       String          // Ej: "cocodrilo"
  colorId        String          // Ej: "amarillo"
  avatarConfig   Json?           // Opciones de avatar humanizado si aplica
  homeAddress    String?         // Dirección de entrega
  homeLatitude   Float?
  homeLongitude  Float?
  createdAt      DateTime        @default(now())

  classroom      Classroom       @relation(fields: [classroomId], references: [id], onDelete: Cascade)
  guardians      StudentGuardian[]
  authorizations Authorization[]
  events         PickupEvent[]

  @@unique([classroomId, animalId, colorId]) // Garantiza combinación única por salón
  @@index([classroomId])
  @@map("students")
}

// ── APODERADOS, PICKERS Y AUTORIZACIONES ───────────────────────────────────

model Guardian {
  id             String            @id @default(uuid())
  whatsappNumber String            @unique
  fullName       String
  idDocumentHash String?
  createdAt      DateTime          @default(now())

  students       StudentGuardian[]
  authorizations Authorization[]

  @@map("guardians")
}

model StudentGuardian {
  studentId  String
  guardianId String
  isPrimary  Boolean  @default(false)

  student    Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  guardian   Guardian @relation(fields: [guardianId], references: [id], onDelete: Cascade)

  @@id([studentId, guardianId])
  @@map("student_guardians")
}

model Picker {
  id             String          @id @default(uuid())
  whatsappNumber String          @unique
  fullName       String
  relationship   String          // "Tío", "Chofer Transporte", "Vecina"
  idDocumentHash String?
  createdAt      DateTime        @default(now())

  authorizations Authorization[]
  events         PickupEvent[]

  @@map("pickers")
}

model Authorization {
  id          String              @id @default(uuid())
  studentId   String
  pickerId    String
  guardianId  String
  type        AuthorizationType   @default(PERMANENT)
  status      AuthorizationStatus @default(ACTIVE)
  validFrom   DateTime            @default(now())
  validUntil  DateTime?
  legalProof  Json?               // { method: "BUTTON" | "VIDEO", ip: "...", signature: "..." }
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  student     Student             @relation(fields: [studentId], references: [id], onDelete: Cascade)
  picker      Picker              @relation(fields: [pickerId], references: [id], onDelete: Cascade)
  guardian    Guardian            @relation(fields: [guardianId], references: [id], onDelete: Cascade)

  @@index([studentId, pickerId, status])
  @@map("authorizations")
}

// ── SESIONES Y EVENTOS DE CUSTODIA (AUDITORÍA) ─────────────────────────────

model PickupSession {
  id             String         @id @default(uuid())
  schoolId       String
  sessionCode    String         // Código alfanumérico visible: "K7-4X2"
  status         SessionStatus  @default(DRAFT)
  startedAt      DateTime?
  closedAt       DateTime?
  createdAt      DateTime       @default(now())

  school         School         @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  events         PickupEvent[]

  @@index([schoolId, status])
  @@map("pickup_sessions")
}

model PickupEvent {
  id             String         @id @default(uuid())
  sessionId      String
  studentId      String
  pickerId       String?
  staffId        String?
  status         CustodyStatus  @default(WAITING)
  handoverCode   String?        // Código de 6 dígitos generado
  handoverExpiry DateTime?

  // Timeline inmutable
  pickerScannedAt   DateTime?
  staffConfirmedAt  DateTime?
  inTransitAt       DateTime?
  arrivedAt         DateTime?
  alertTriggeredAt  DateTime?

  notes             String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  session        PickupSession  @relation(fields: [sessionId], references: [id], onDelete: Restrict)
  student        Student        @relation(fields: [studentId], references: [id], onDelete: Restrict)
  picker         Picker?        @relation(fields: [pickerId], references: [id], onDelete: SetNull)
  staff          User?          @relation("StaffEvents", fields: [staffId], references: [id], onDelete: SetNull)
  incidents      Incident[]

  @@index([sessionId, status])
  @@index([studentId])
  @@map("pickup_events")
}

model Incident {
  id            String       @id @default(uuid())
  eventId       String
  type          String       // "UNAUTHORIZED_ATTEMPT" | "DELAY_WARNING" | "GUARDIAN_REPORTED"
  description   String
  resolvedAt    DateTime?
  resolutionNote String?
  createdAt     DateTime     @default(now())

  event         PickupEvent  @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@map("incidents")
}
```

---

## 5. Máquina de Estados Finita (Custody FSM)

La custodia sigue un modelo determinista donde cada transición exige condiciones previas y detona efectos colaterales automáticos:

```
 [WAITING]
    │
    │  (Picker escanea QR & backend verifica autorización activa)
    ▼
 [IN_PROCESS]
    │
    │  (Staff pulsa "Llamar Alumno" en /staff)
    ▼
 [HANDOVER] ──(Genera Handover Code de 6 dígitos)
    │
    │  (Staff tipea Handover Code en /staff y coincide)
    ▼
 [IN_TRANSIT] ──(Dispara WhatsApp con aviso de retiro al Apoderado)
    │
    ├─── (Apoderado pulsa "Llegó bien ✓" o geocerca 100m) ───► [ARRIVED] (Sellado)
    │
    └─── (Timeout > 30 min / Apoderado reporta problema) ────► [ALERT] (Escalamiento)
```

### Matriz de Transiciones

| Estado Origen | Estado Destino | Actor / Trigger | Precondiciones | Side-effects Automáticos |
|---|---|---|---|---|
| `WAITING` | `IN_PROCESS` | **Picker**: Solicita alumno en `/retirar` | Sesión `OPEN`. Autorización activa para ese alumno. | Emite evento Pusher: alumno pasa a amarillo en Smart TV y aparece en lista staff. |
| `IN_PROCESS` | `HANDOVER` | **Staff**: Confirma preparación física | Personal autenticado en `/staff`. | Backend genera Handover Code (6 dígitos, TTL 10m). Picker lo ve en su pantalla. |
| `HANDOVER` | `IN_TRANSIT` | **Staff**: Ingresa Handover Code | Código ingresado coincide con el emitido y no expiró. | Smart TV cambia alumno a `Retirado ✓`. Emite mensaje al Apoderado (aviso de salida). |
| `IN_TRANSIT` | `ARRIVED` | **Apoderado**: Pulsa botón "Llegó" | Evento en estado `IN_TRANSIT`. | Custodia cerrada exitosamente. Alerta cancelada. Timestamp inmutable guardado. |
| *Cualquiera* | `ALERT` | **Sistema / Apoderado** | Timeout 30 min sin llegada o botón "Hay un problema". | Notificación urgente a Sofía en panel Admin. Log de incidente creado. |

---

## 6. Contratos de API REST (Next.js Route Handlers)

Todos los endpoints residen en `src/app/api/` y responden con formato JSON estándar:

### 6.1 `POST /api/sessions/create`
* **Acceso**: Staff / Admin autenticado con Google OAuth.
* **Payload**:
  ```json
  { "schoolId": "uuid", "gradeSections": ["1A", "2B"] }
  ```
* **Respuesta (201)**:
  ```json
  {
    "sessionId": "session-123",
    "sessionCode": "K7-4X2",
    "qrToken": "eyJhbGciOi...",
    "qrExpiresAt": "2026-11-04T19:30:00Z"
  }
  ```

### 6.2 `POST /api/pickup/solicitar`
* **Acceso**: Público (Picker en portón).
* **Payload**:
  ```json
  {
    "sessionToken": "string",
    "pickerPhone": "+5491158214920",
    "studentSearch": "Sofía Martínez" // o id directo
  }
  ```
* **Respuesta exitosa (200)**:
  ```json
  {
    "status": "IN_PROCESS",
    "studentPublicCode": "Cocodrilo Amarillo",
    "message": "Solicitud enviada al staff. Aguarda en el portón."
  }
  ```
* **Respuesta rechazo (403)**:
  ```json
  {
    "error": "UNAUTHORIZED_PICKER",
    "message": "No figuras en la lista de personas autorizadas por el apoderado."
  }
  ```

### 6.3 `POST /api/pickup/verificar-handover`
* **Acceso**: Staff autenticado.
* **Payload**:
  ```json
  {
    "eventId": "evt-789",
    "enteredCode": "842190"
  }
  ```
* **Respuesta (200)**:
  ```json
  {
    "success": true,
    "status": "IN_TRANSIT",
    "timestamp": "2026-11-04T19:35:12Z"
  }
  ```

---

## 7. Arquitectura de Eventos Real-Time (Pusher)

Para garantizar latencia inferior a 1 segundo en el Smart TV y la tablet del staff sin servidores con estado:

### 7.1 Nombres de Canales
* Canal Público del Tablero: `pickup-session-{sessionId}`
* Canal Privado de Personal: `private-school-{schoolId}-staff`

### 7.2 Eventos Emitidos
1. `student:status-changed`:
   ```json
   {
     "studentId": "s1",
     "animalId": "cocodrilo",
     "colorId": "amarillo",
     "newStatus": "in_process",
     "timestamp": "2026-11-04T19:32:00Z"
   }
   ```
2. `qr:rotated`:
   ```json
   {
     "newSessionCode": "M9-2P4",
     "qrUrl": "https://pickme.app/retirar?session=...&t=..."
   }
   ```
3. `staff:pickup-requested`:
   ```json
   {
     "eventId": "evt-789",
     "studentInitials": "S.M.",
     "pickerName": "Juan Pérez",
     "relationship": "Chofer Particular",
     "authorizedBy": "Elena Martínez (Madre)"
   }
   ```

---

## 8. Protocolos Criptográficos y de Seguridad

1. **Tokens QR Dinámicos**:
   * Cada QR contiene: `https://pickme.app/retirar?s={sessionId}&t={timestamp}&sig={signature}`.
   * `signature = HMAC_SHA256(sessionId + ":" + timestamp, SECRET_KEY)`.
   * El cliente rota el QR cada 5 minutos; el servidor rechaza peticiones con timestamps mayores a 10 minutos para prevenir ataques de fotos tomadas con anterioridad.
2. **Handover Code de 6 Dígitos**:
   * Generado con `crypto.randomInt(100000, 999999)`.
   * Tiempo de vida estricto de 10 minutos.
   * Máximo 3 intentos fallidos de tipeo por parte del staff antes de bloquear el código y exigir re-validación.
3. **Privacidad de Documentos**:
   * El documento de identidad (RUT/DNI) nunca se guarda en texto plano; se almacena `SHA-256(salt + docNumber)`.

---

## 9. Arquitectura Frontend & Sistema de Diseño Modular

Para garantizar una experiencia visual pulida, modular y reusable:

### 9.1 Árbol de Componentes
```
src/components/
├── ui/                     # Átomos puros de UI
│   ├── Button/             # Variantes: primary, secondary, alert, ghost
│   ├── Badge/              # Status badges (waiting, in_process, picked_up)
│   ├── Modal/              # Diálogo accesible con focus trap y escape
│   └── Input/              # Inputs de texto y teclado numérico para Handover
├── board/                  # Módulo Smart TV (Layer 0)
│   ├── BoardHeader.tsx     # Logo, fecha, reloj en vivo y pills de conteo
│   ├── StudentCard.tsx     # Card animada con glow de color y animal
│   └── QRPanel.tsx         # QR con countdown circular SVG
├── staff/                  # Módulo Entrega Portón (Layer 1)
│   ├── ValidationCard.tsx  # Datos del picker + iniciales del menor
│   └── HandoverKeypad.tsx  # Teclado táctil para tipeo rápido del código
└── simulator/              # Módulo Sandbox / Demostración Guiada
    ├── SimulatorShell.tsx  # Pantalla dividida interactiva
    ├── PhoneMockup.tsx     # Frame de teléfono para la vista picker
    └── WhatsAppMockup.tsx  # Renderizador interactivo de chat WhatsApp
```

### 9.2 Filosofía de Estilos
* **CSS Modules puros**: Aislamiento estricto de estilos sin fuga de cascada.
* **Tokens semánticos** en `globals.css`:
  * Espaciados en escala de 4px (`0.25rem`, `0.5rem`, `1rem`, `1.5rem`).
  * Curvas de transición elásticas (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
  * Paleta animal accesible con alto contraste sobre fondo oscuro (`#0D0D14`).

---

## 10. Modo Sandbox / Onboarding Interactivo ("Probar Dinámica")

Para cumplir con el **CA-5**, la plataforma no requiere configurar datos reales para demostrar su valor:

1. **Activación**: Al registrarse con Google o pulsar *"Probar Demo"*, se instancia una sesión en memoria con 8 alumnos simulados.
2. **Entorno de Simulación**:
   * **Mitad izquierda**: Vista en vivo del Smart TV.
   * **Mitad derecha**: Consola de control con pestañas para alternar entre:
     * *Vista Picker*: Simula el formulario del teléfono móvil.
     * *Vista Maestra*: Simula la tablet en el portón validando y tipeando el código.
     * *Simulador WhatsApp*: Renderiza el teléfono del apoderado recibiendo el aviso y permitiendo pulsar *"Confirmar llegada"*.
3. **Desacoplamiento**: Todos los componentes visuales son exactamente los mismos que se usan en el flujo real; solo cambia el proveedor de datos (`MockSessionProvider` vs `DatabaseApiProvider`).

---

## 11. Especificación de Docker e Infraestructura Local

### 11.1 `Dockerfile` (Multi-stage para Next.js Standalone)
* **Stage 1 (deps)**: Instalación limpia con `npm ci`.
* **Stage 2 (builder)**: Generación del Prisma Client y compilación con `npm run build` (`output: 'standalone'`).
* **Stage 3 (runner)**: Imagen basada en `node:20-alpine`, sin dependencias de desarrollo, ejecutando `node server.js` como usuario sin privilegios. Tamaño resultante < 160 MB.

### 11.2 `docker-compose.yml`
* Servicio **`web`**: App PickMe en puerto `3000`.
* Servicio **`db`**: `postgres:16-alpine` en puerto `5432`, con healthcheck y volumen montado en `pgdata`.
* Red interna compartida `pickme-network`.

---

## 12. Próximos Pasos de Ejecución Técnica

1. **Paso 1**: Crear `Dockerfile` y `docker-compose.yml` para levantar la infraestructura de contenedores.
2. **Paso 2**: Implementar el archivo `prisma/schema.prisma` con las migraciones iniciales.
3. **Paso 3**: Construir la capa de simulación y las rutas de API core (`/api/pickup/*`).
4. **Paso 4**: Montar el flujo del Picker (`/retirar`) y la consola de Staff (`/staff`).

