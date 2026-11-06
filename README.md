<p align="center">
  <img src="docs/assets/banner.png" alt="PickMe — Smart School Pickup & Digital Custody" style="width: 100%; max-height: 360px; object-fit: cover; object-position: center; border-radius: 12px; box-shadow: 0 16px 36px rgba(0,0,0,0.5);" />
</p>

# 🏫 PickMe — Digital School Pickup & Custody

> **Caso de Estudio UX & Arquitectura de Software**: Sistema digital de gestión de salida escolar con anonimato público, verificación de identidad sin descarga de apps y cadena de custodia digital inmutable.  
> Diseñado para colegios primarios, auxiliares de portón y familias.

---

## 📑 Tabla de Contenidos

1. [Problema y Oportunidad UX](#-el-problema-y-oportunidad-ux)
2. [Propuesta de Valor y Criterios de Aceptación (CA)](#-propuesta-de-valor-y-criterios-de-aceptación-ca)
3. [Privacy by Design: Las 3 Capas de Privacidad](#-privacy-by-design-las-3-capas-de-privacidad)
4. [Taxonomía y Arquitectura de Información (IA)](#-taxonomía-y-arquitectura-de-información-ia)
5. [Orquestación y Launchpad de Despacho Escolar](#-orquestación-y-launchpad-de-despacho-escolar)
6. [Taskflow del Traspaso Físico de Custodia](#-taskflow-del-traspaso-físico-de-custodia)
7. [Sistema de Diseño & Estándares UX](#-sistema-de-diseño--estándares-ux)
8. [Modelo de Datos Relacional](#-modelo-de-datos-relacional)
9. [Stack Tecnológico](#-stack-tecnológico)
10. [Puesta en Marcha y Credenciales de Evaluación](#-puesta-en-marcha-y-credenciales-de-evaluación)
11. [Documentación y Especificaciones](#-documentación-y-especificaciones)

---

## 🎯 El Problema y Oportunidad UX

La hora de salida en las escuelas primarias suele ser caótica y vulnerable:
- **Caos en el portón**: Aglomeraciones de padres, choferes y furgones escolares compitiendo por avisar su llegada.
- **Vulnerabilidad de privacidad**: Pantallas o megáfonos gritando nombres completos de menores a la vía pública.
- **Fricción tecnológica**: Exigir a abuelos o choferes descargar una app pesada genera rechazo inmediato y abandono (menos del 25% de adopción).
- **Riesgo legal**: Las firmas en hojas de papel no acreditan hora exacta, identidad verificada ni trazabilidad ante incidentes.

**PickMe** resuelve esta fricción desacoplando la visibilidad pública de la identificación privada mediante un protocolo digital simple, seguro y elegante.

---

## 🏆 Propuesta de Valor y Criterios de Aceptación (CA)

| Criterio | Nombre | Especificación de Diseño & Ingeniería |
|---|---|---|
| **CA-1** | **Anonimato Total en TV** | La pantalla pública [`/board/[sessionId]`](src/app/board/[sessionId]/page.tsx) es **100% pasiva y anónima**. Identifica a cada alumno mediante el código único *Animal + Color* (ej: *Zorro Naranja*), sin nombres, fotos ni controles táctiles. |
| **CA-2** | **Cero Descargas (Web Móvil)** | El picker opera desde [`/retirar`](src/app/retirar/page.tsx) en cualquier navegador móvil escaneando el QR o tipeando la URL. Cero instalaciones en App Store o Play Store. |
| **CA-3** | **Sellado con Handover Code** | El traspaso físico se confirma mediante un **código criptográfico de 6 dígitos** generado en el celular del picker con TTL de 10 min, ingresado por el personal en [`/staff`](src/app/staff/page.tsx) con un teclado táctil de 64px. |
| **CA-4** | **Cadena de Custodia Inmutable** | Toda transición (`WAITING` ➔ `IN_PROCESS` ➔ `IN_TRANSIT` ➔ `ARRIVED`) se persiste en PostgreSQL con sellado de tiempo UTC, firmas de staff y hashes de integridad. |
| **CA-5** | **Consola Administrativa & Launchpad** | Sofía (Directora) gobierna la institución, despacha las URLs de Smart TV y Portón, inspecciona nóminas y audita entregas en vivo en [`/admin`](src/app/admin/page.tsx). |

---

## 🛡️ Privacy by Design: Las 3 Capas de Privacidad

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAPA 0 — Pantalla Pública / Smart TV en Patio Escolar (/board/[sessionId]) │
│ Cero datos personales · Solo código visual Animal + Color · 100% Pasivo     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ CAPA 1 — Tablet de Portón (/staff) y Web Móvil del Picker (/retirar)        │
│ Avatar + Iniciales del menor (M.G.) + Nombre y parentesco del Picker        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ CAPA 2 — Portal Administrativo y Tutor Legal (/admin, /admin/cursos)        │
│ Nombres completos, auditoría legal inmutable, gestión de autorizaciones     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Taxonomía y Arquitectura de Información (IA)

```
                                  PICKME
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      │                              │                              │
      ▼                              ▼                              ▼
  ZONA PÚBLICA / MÓVIL         ZONA DE PORTÓN                ZONA ADMINISTRATIVA
(Sin autenticación)         (Personal de portería)         (Directora / NextAuth)
      │                              │                              │
      ├── / (Landing Showcase)       └── /staff (Consola Portón)    ├── /auth/login (Login Institucional)
      ├── /board/[sessionId] (TV)        • Cola reactiva en vivo    ├── /admin (Jornada & Launchpad)
      └── /retirar (Picker móvil)        • Keypad modal 64px        ├── /admin/cursos (Nómina Alumnos)
           • Búsqueda por teléfono       • Iniciales del menor      ├── /admin/auditoria (Bitácora Legal)
           • Código Handover 6 dígitos                              └── /admin/simulador (Sandbox Demo)
```

---

## 🚀 Orquestación y Launchpad de Despacho Escolar

A diferencia de una simple tabla de datos, el panel de Sofía (`/admin`) funciona como el **Centro de Despacho de la Jornada Escolar**. Al abrir la sesión diaria (`SAN-1024`), el sistema genera y distribuye los accesos para cada dispositivo:

```
[ Iniciar Jornada SAN-1024 ] ───► 1. Smart TV Patio:    https://app.pickme.cl/board/SAN-1024
                             ───► 2. Consola Portón:    https://app.pickme.cl/staff
                             ───► 3. Afiche / QR Tótem: https://app.pickme.cl/retirar?session=SAN-1024
```

---

## 🔄 Taskflow del Traspaso Físico de Custodia

```
[ Picker llega al portón ]
            │
            ▼
[ Escanea QR de portería ] ──────────► Ingresa número celular en /retirar
            │
            ▼
[ Selecciona alumno autorizado ] ────► Pulsa "Anunciar Llegada"
            │
            ├──► Servidor transiciona alumno a IN_PROCESS en PostgreSQL
            ├──► Smart TV Patio (/board): Alumno cambia a Amarillo con pulso neón
            └──► Móvil del Picker (/retirar): Exhibe HANDOVER CODE de 6 dígitos (⏱️ 10 min)
            │
            ▼
[ Auxiliar de portón (/staff) ] ─────► Ve alerta en tablet, maestro ubica al menor en patio
            │
            ▼
[ Traspaso físico en portón ] ───────► Auxiliar solicita los 6 dígitos al Picker
            │
            ▼
[ Auxiliar digita código en Keypad ] ─► Validación criptográfica atómica
            │
            ├──► Estado pasa a IN_TRANSIT (sellado inmutable con timestamp)
            ├──► Smart TV (/board): Alumno cambia a Verde (Retirado ✓)
            └──► Apoderado recibe confirmación de retiro completado
```

---

## 🎨 Sistema de Diseño & Estándares UX

Construido bajo estándares **WCAG 2.2 Nivel AA** con enfoque *Minimal Dark & Glassmorphism*:
- **Cero frameworks de utilidades**: Implementado exclusivamente con **CSS Modules puros** y variables semánticas (`globals.css`), otorgando control milimétrico sobre renderizado y animaciones.
- **Ergonomía Táctil en Terreno**: Botones con target táctil mínimo de 48×48px. El [`Keypad`](src/components/ui/Keypad/index.tsx) cuenta con teclas de 64×64px, feedback háptico (`navigator.vibrate`) y animación de sacudida (*shake*) ante errores, diseñado para luz solar directa o uso con guantes.
- **Animaciones Elásticas**: Curva de aceleración personalizada `--transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1)` con soporte estricto de `prefers-reduced-motion`.
- **Paleta de Identificadores Layer 0**: Matriz de **20 Animales × 10 Colores** de alto contraste accesible para niños pequeños y adultos mayores.

---

## 🗄️ Modelo de Datos Relacional

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

---

## 💻 Stack Tecnológico

| Capa | Tecnología | Justificación de Arquitectura |
|---|---|---|
| **Frontend Framework** | **Next.js 16.4.3 (App Router)** | Server Components, routing modular y Turbopack para compilación instantánea. |
| **Runtime UI** | **React 19.3.0** | Hooks modernos, concurrencia nativa y compatibilidad estricta. |
| **Lenguaje** | **TypeScript 5.x (Strict)** | Tipado de dominio de extremo a extremo sin concesiones de tipo `any`. |
| **Estilos & Diseño** | **CSS Modules + Tokens** | Rendimiento óptimo, sin runtime de CSS-in-JS y aislamiento de clases por componente. |
| **Autenticación** | **NextAuth v5 (Auth.js)** | Sesiones seguras JWT con soporte dual de Credenciales Institucionales y Google OAuth. |
| **Base de Datos** | **PostgreSQL 16 (Neon / Docker)** | Integridad relacional, migraciones declarativas y driver adapter `@prisma/adapter-pg`. |
| **Generación QR** | **`qrcode.react` (SVG local)** | 100% autónomo y offline-ready sin depender de APIs externas de terceros. |
| **Tiempo Real** | **Pusher (`pusher-js`)** | Notificaciones instantáneas entre portón, Smart TV y móviles con baja latencia. |
| **Infraestructura** | **Docker & Vercel Serverless** | Despliegue en la nube con límites de conexión controlados para base serverless. |

---

## 🚀 Puesta en Marcha y Credenciales de Evaluación

### 1. Despliegue Local (Docker)

```bash
# Iniciar base de datos PostgreSQL
docker-compose up -d db

# Instalar dependencias y compilar cliente Prisma
npm install

# Aplicar migraciones y sembrar datos iniciales
npx prisma migrate dev
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

### 2. Credenciales de Evaluación (Datos Demo Sembrados)

Para evaluar el sistema en local o en Vercel, utiliza las siguientes cuentas institucionales precargadas:

| Rol | Actor / Usuario | Correo / Identificador | Contraseña / Acceso | Propósito de Evaluación |
|---|---|---|---|---|
| **Directora (Admin)** | Sofía Valenzuela | `sofia@sanmartin.edu` | `Admin123!` | Ingreso en [`/auth/login`](http://localhost:3000/auth/login) para gobernar la jornada y nómina. |
| **Personal Portón** | Carlos Mendoza | `carlos.puertas@sanmartin.edu` | `Staff123!` | Acceso directo a la tablet de portón en [`/staff`](http://localhost:3000/staff). |
| **Retirador (Tío)** | Ignacio Herrera | `+56981112233` | *Sin contraseña* | Retira a Mateo González (*Zorro Naranja*) en [`/retirar`](http://localhost:3000/retirar?session=SAN-1024). |
| **Retirador (Furgón)** | Don Pedro Transporte | `+56984445566` | *Sin contraseña* | Retiro escolar de Valentina Soto (*Delfín Celeste*). |
| **Apoderada** | Carolina Herrera | `+56991112233` | *Sin contraseña* | Retiro directo y recepción de aviso seguro. |

* **Código de Sesión Activa:** `SAN-1024` (Colegio San Martín).

---

## 📚 Documentación y Especificaciones

* [`docs/PLAN_MVP_FUNCIONAL.md`](docs/PLAN_MVP_FUNCIONAL.md): **Plan Maestro de Ingeniería MVP**: Gobernanza real de cursos, onboarding institucional, importador masivo Excel/CSV y cadena de entrega end-to-end.
* [`docs/PRD.md`](docs/PRD.md): Requerimientos de producto detallados, personas y reglas de negocio.
* [`docs/SDD.md`](docs/SDD.md): Especificación formal de arquitectura de sistemas, launchpad y contratos criptográficos.
* [`docs/INFORMATION_ARCHITECTURE.md`](docs/INFORMATION_ARCHITECTURE.md): Mapa integral de navegación, taxonomía y touchpoints UX.
* [`docs/ROADMAP.md`](docs/ROADMAP.md): Registro de hitos y fases de desarrollo.
* [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md): Guía de despliegue a producción con Neon PostgreSQL.
* [`docs/AGENT_SPECS.md`](docs/AGENT_SPECS.md): Especificación técnica interna del entorno de desarrollo de agentes.
