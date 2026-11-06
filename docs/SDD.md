# PickMe — Documento de Diseño de Sistemas (SDD)

**Versión**: 2.0 — Especificación Técnica Integral y Arquitectura de Sistemas  
**Estado**: Activo / Especificación Formal  
**Última actualización**: Noviembre 2026  
**Autor Principal**: Antigravity (Google DeepMind)  

---

## 1. Resumen Ejecutivo y Misión del Sistema

**PickMe** es una plataforma monolítica modular de alta disponibilidad y privacidad estricta diseñada para orquestar la salida diaria de estudiantes en colegios primarios e infantiles.

El sistema resuelve la vulnerabilidad física y legal del retiro escolar desacoplando radicalmente la **visibilidad pública en el portón** de la **identidad privada del menor**, articulando una **cadena de custodia digital inmutable** verificada con un protocolo de traspaso sellado por código numérico de un solo uso (*Handover Code*).

---

## 2. Criterios de Aceptación (CA) y Requisitos No Funcionales (NFR)

### 2.1 Criterios de Aceptación del Producto (CAs)
* **CA-1 — Anonimato Total en TV Pasiva (`/board/[sessionId]`)**:  
  La pantalla mural en patio no expone nombres completos, apellidos, cursos ni fotos. Identifica al menor exclusivamente por su par único **Animal + Color** asignado por salón (ej: *Zorro Naranja*).
* **CA-2 — Cero Fricción para el Retirador (`/retirar`)**:  
  Los apoderados y transportistas operan vía web móvil en cualquier navegador sin descargar apps de App Store / Play Store. El acceso se origina escaneando el código QR dinámico de portería o abriendo el enlace de la jornada.
* **CA-3 — Protocolo de Traspaso Físico Sellado (*Handover Code*)**:  
  La entrega física de un alumno en portería solo transiciona al estado `IN_TRANSIT` / `PICKED_UP` cuando el personal de portón tipea en su consola táctil (`/staff`) el código criptográfico de 6 dígitos con tiempo de vida (TTL) de 10 minutos generado en el móvil del picker.
* **CA-4 — Cadena de Custodia Inmutable en Base de Datos**:  
  Toda transición de estado (`WAITING` ➔ `IN_PROCESS` ➔ `HANDOVER` ➔ `IN_TRANSIT` ➔ `ARRIVED` ➔ `ALERT`) se persiste en PostgreSQL con sellado temporal UTC, identificadores foráneos inalterables, firmas de staff y hashes de integridad.
* **CA-5 — Consola Administrativa, Launchpad de Despacho y Modo Prueba**:  
  La dirección del colegio (Sofía) cuenta con una consola institucional para gobernar la institución (nómina de alumnos, asignación Animal+Color, apertura de jornada, distribución de URLs a pantallas y auditoría forense), complementado con un simulador interactivo para onboarding rápido.

### 2.2 Requisitos No Funcionales de Ingeniería (NFRs)
1. **Privacidad por Diseño (3 Capas de Exposición)**:
   * **Capa 0 (Público Pasivo)**: Datos anónimos (Animal + Color). Cero PII (Personally Identifiable Information).
   * **Capa 1 (Operativo Portón y Móvil)**: Iniciales del alumno, nombre del retirador autorizado, relación de parentesco y Handover Code.
   * **Capa 2 (Administración y Auditoría)**: Nombre completo, dirección particular, RUT/DNI hasheado, bitácora forense completa.
2. **Resiliencia Operativa & Tolerancia a Fallos**:
   * Si la base de datos experimenta latencia o caída temporal, los componentes de interfaz deben entrar en modo degradado elegante (*graceful degradation*) con caché local o datos precargados, evitando pantallas de error 500 no capturadas.
3. **Optimización Táctil (Touch-First Industrial)**:
   * Teclado numérico en `/staff` con botones táctiles de mínimo **64×64px** para operar bajo luz solar directa o con guantes.

---

## 3. Arquitectura del Sistema y Topología de Red

```
                                 INTERFACES DE USUARIO (Tier 1)
 ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
 │   Smart TV Patio      │   │  Web Móvil Picker     │   │   Consola Portón      │   │   Consola Sofía       │
 │   /board/[sessionId]  │   │  /retirar?session=... │   │   /staff              │   │   /admin/*            │
 │   (Capa 0 - Pasivo)   │   │  (Capa 1 - Sin login) │   │   (Capa 1 - Staff)    │   │   (Capa 2 - Admin)    │
 └───────────┬───────────┘   └───────────┬───────────┘   └───────────┬───────────┘   └───────────┬───────────┘
             │                           │                           │                           │
             │ HTTPS (SSR/Client)        │ HTTPS (REST)              │ HTTPS (NextAuth JWT)      │ HTTPS (NextAuth JWT)
             ▼                           ▼                           ▼                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 APP ROUTER — RUNTIME SERVERLESS / DOCKER                                 │
│                                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Middleware / Proxy Gate (Protección de rutas /admin/* vía NextAuth v5 JWT)                        │   │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                            │
│   ┌───────────────────────────────────┐    ┌───────────────────────────────────┐                           │
│   │ API Endpoints (/api/*)            │    │ Servicios de Dominio              │                           │
│   │  ├── /api/auth/* (NextAuth v5)    │    │  ├── SessionDispatcherService     │                           │
│   │  ├── /api/pickup/lookup           │    │  ├── HandoverSecurityEngine       │                           │
│   │  ├── /api/pickup/solicitar        │    │  ├── CustodyLedgerService         │                           │
│   │  ├── /api/pickup/verificar-handover│   │  └── QRRotationManager            │                           │
│   │  └── /api/staff/queue             │    └─────────────────┬─────────────────┘                           │
│   └─────────────────┬─────────────────┘                      │                                             │
└─────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────┘
                      │                                        │
                      ▼                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCIA & EVENTOS (Tier 3)                                                      │
│                                                                                                            │
│   ┌────────────────────────────────────────────────────┐   ┌───────────────────────────────────────────┐   │
│   │ PostgreSQL 16 (Neon Serverless / Docker Local)      │   │ Real-time Event Broker (Pusher / Polling)  │   │
│   │ Pooler Pgbouncer (max 5 lambdas en producción)     │   │ Canal privado: pickup-session-[sessionId] │   │
│   │ Driver: @prisma/adapter-pg + pg                    │   │ Eventos: student-waiting, handover-ready  │   │
│   └────────────────────────────────────────────────────┘   └───────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. El Centro de Mando Administrativo: Launchpad y Orquestación

El módulo administrativo no es una vitrina publicitaria; es el **motor de despacho operativo** que conecta todas las interfaces antes de iniciar la salida física.

### 4.1 Ciclo de Vida de una Jornada de Salida (`PickupSession`)
Una jornada escolar atraviesa 3 estados formales:
1. **`DRAFT` (Planificación)**: Creada por el sistema o la dirección previo a la salida. Se verifica nómina y personal asignado.
2. **`OPEN` (Jornada Activa)**: La sesión entra en ejecución. Se generan los enlaces activos de despacho y el Smart TV proyecta la cola en tiempo real.
3. **`CLOSED` (Jornada Sellada)**: Se cierran las puertas físicas. Todo alumno no retirado pasa a protocolo de guardia/retraso y se genera el acta forense inmutable.

### 4.2 Despacho Multi-Dispositivo (Launchpad Hub)
Al abrir la jornada `SAN-1024`, el Launchpad en `/admin` genera y distribuye los tres puntos de contacto:

```
[ Iniciar Jornada SAN-1024 ] ───► 1. Smart TV Patio:    https://app.pickme.cl/board/SAN-1024
                             ───► 2. Consola Portón:    https://app.pickme.cl/staff
                             ───► 3. Afiche / QR Tótem: https://app.pickme.cl/retirar?session=SAN-1024
```

---

## 5. Arquitectura de Autenticación y Gobernanza

### 5.1 Estrategia de Autenticación Unificada
El acceso a la plataforma escolar se centraliza en un único punto de entrada institucional [`/auth/login`](src/app/auth/login/page.tsx):
* **Credenciales Institucionales**: Correo corporativo escolar + Contraseña cifrada con `bcrypt` (mínimo 10 salt rounds).
* **Google Workspace OAuth 2.0**: Delegación mediante Google Cloud Console con dominios educativos autorizados (`@colegio.edu`).
* **Tokens de Sesión**: JWT firmado con `AUTH_SECRET` (256-bit SHA-256) emitido por NextAuth v5 en cookies HTTP-only, SameSite=Lax.

### 5.2 Onboarding de Nuevos Colegios
Cuando un director registra un nuevo colegio:
1. Se valida el token del usuario y se crea el registro `School`.
2. Se activa el **Wizard de Configuración Inicial**:
   * Sede y Parámetros (nombre, teléfono de emergencia, tolerancia horaria).
   * Creación de Cursos y Salones (ej. *1° Básico A*, *2° Básico B*).
   * Carga de nómina de alumnos con asignación algorítmica garantizada de **Animal + Color** único por aula.

---

## 6. Modelo de Datos Relacional y Taxonomía Institucional

```
[ School ] (Colegio San Martín)
    │
    ├── 1 ─── n [ User ] (Directora Sofía, Auxiliar Carlos)
    │
    ├── 1 ─── n [ Classroom ] (1° Básico A, 2° Básico B)
    │                │
    │                └── 1 ─── n [ Student ] (Vicente Toro: Cocodrilo Amarillo)
    │                                │
    │                                ├── n ─── n [ StudentGuardian ] ─── [ Guardian ]
    │                                │
    │                                └── 1 ─── n [ Authorization ] ──── [ Picker ] (Tío Ignacio)
    │
    └── 1 ─── n [ PickupSession ] (SAN-1024: Estado OPEN)
                     │
                     └── 1 ─── n [ PickupEvent ] (Cadena de Custodia)
                                      │
                                      └── 1 ─── n [ Incident ]
```

### 6.1 Matriz de Campos y Exposición por Capas

| Entidad | Campo | Capa 0 (Smart TV) | Capa 1 (Portón / Móvil) | Capa 2 (Admin Sofía) |
|---|---|:---:|:---:|:---:|
| **Student** | `animalId` + `colorId` | **Visible** (*Cocodrilo Amarillo*) | **Visible** | **Visible** |
| **Student** | `initials` | Oculto | **Visible** (*V.T.*) | **Visible** |
| **Student** | `fullName` | **Oculto** | Oculto | **Visible** (*Vicente Toro Morales*) |
| **Student** | `homeAddress` | **Oculto** | Oculto | **Visible** (Uso de transporte) |
| **Picker** | `fullName` + `relationship` | **Oculto** | **Visible** (*Ignacio H. · Tío*) | **Visible** |
| **Custody** | `handoverCode` | **Oculto** | **Visible** (Móvil Picker / Keypad) | **Visible en Logs** |
| **Custody** | `timestamps` UTC | Oculto | Oculto | **Visible en Bitácora Forense** |

---

## 7. Protocolo Criptográfico del Handover Code

1. **Generación**: Al solicitar retiro en `/retirar`, el servidor genera un número pseudoaleatorio seguro:
   $$\text{Code} = \text{randomInt}(100000, 999999)$$
2. **TTL (Time to Live)**: Se persiste `handoverExpiry = now() + 600\text{ segundos}` (10 minutos).
3. **Validación en Portón**: El auxiliar ingresa los 6 dígitos en el Keypad táctil de `/staff`.
4. **Verificación Transaccional**:
   * Si el código coincide y `now() < handoverExpiry`: el estado cambia atómicamente a `IN_TRANSIT`, registrando `staffId` y `staffConfirmedAt`.
   * Si falla 3 veces consecutivas: se bloquea el código y se genera un `Incident` tipo `UNAUTHORIZED_ATTEMPT` notificando de inmediato a la administración.

---

## 8. Estrategia de Despliegue e Infraestructura Serverless

* **Alojamiento**: Vercel Serverless Functions (Node.js 20.x, región `iad1`).
* **Base de Datos**: Neon Serverless PostgreSQL (región `iad1` con PgBouncer en puerto 5432).
* **Pool de Conexiones**: Límite estricto `max: 5` por función serverless para evitar la saturación del pool de Neon.
* **Build Pipeline**: Script `postinstall: "prisma generate"` que compila el motor Prisma durante la fase de instalación de Vercel.
