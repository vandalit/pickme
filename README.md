<p align="center">
  <img src="docs/assets/banner.png" alt="PickMe — Smart School Pickup & Digital Custody" width="100%" />
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
5. [Taskflow del Traspaso Físico de Custodia](#-taskflow-del-traspaso-físico-de-custodia)
6. [Sistema de Diseño & Estándares UX](#-sistema-de-diseño--estándares-ux)
7. [Modelo de Datos Relacional](#-modelo-de-datos-relacional)
8. [Stack Tecnológico](#-stack-tecnológico)
9. [Puesta en Marcha y Datos Demo](#-puesta-en-marcha-y-datos-demo)
10. [Documentación y Especificaciones](#-documentación-y-especificaciones)

---

## 🎯 El Problema y Oportunidad UX

La hora de salida en las escuelas primarias suele ser caótica y vulnerable:
- **Caos en el portón**: Aglomeraciones de padres, choferes y furgones escolares compitiendo por avisar su llegada.
- **Vulnerabilidad de privacidad**: Pantallas o megáfonos gritando nombres completos de menores a la vía pública.
- **Fricción tecnológica**: Exigir a abuelos o choferes descargar una app pesada genera rechazo inmediato y abandono.
- **Riesgo legal**: Las firmas en hojas de papel no acreditan hora exacta, identidad verificada ni trazabilidad ante incidentes.

**PickMe** resuelve esta fricción desacoplando la visibilidad pública de la identificación privada mediante un protocolo digital simple, seguro y elegante.

---

## 🏆 Propuesta de Valor y Criterios de Aceptación (CA)

| Criterio | Nombre | Especificación de Diseño & Ingeniería |
|---|---|---|
| **CA-1** | **Anonimato Total en TV** | La pantalla pública [`/board/[sessionId]`](src/app/board/[sessionId]/page.tsx) es **100% pasiva y anónima**. Identifica a cada alumno mediante el código único *Animal + Color* (ej: *Zorro Naranja*), sin nombres, fotos ni controles táctiles. |
| **CA-2** | **Cero Descargas (Web Móvil)** | El picker opera desde [`/retirar`](src/app/retirar/page.tsx) en cualquier navegador móvil escaneando el QR o tipeando la URL. Cero instalaciones en App Store o Play Store. |
| **CA-3** | **Sellado con Handover Code** | El traspaso físico se confirma mediante un **código criptográfico de 6 dígitos** generado en el celular del picker con TTL de 10 min, ingresado por el personal en [`/staff`](src/app/staff/page.tsx) con un teclado táctil de 64px. |
| **CA-4** | **Cadena de Custodia Inmutable** | Toda transición (`WAITING` ➔ `IN_PROCESS` ➔ `IN_TRANSIT` ➔ `ARRIVED`) se persiste en PostgreSQL con sellado de tiempo y firmas de los actores intervinientes. |
| **CA-5** | **Product-Led Onboarding & Sandbox** | Sofía (Directora) puede simular un ciclo escolar completo en el [`/admin/simulador`](src/app/admin/simulador/page.tsx) interactivo en menos de 3 minutos antes de desplegar en vivo. |

---

## 🛡️ Privacy by Design: Las 3 Capas de Privacidad

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 0 — Pantalla Pública / Smart TV en Vía Pública                        │
│ Cero datos personales · Solo código visual Animal + Color · 100% Pasivo     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ LAYER 1 — Tablet de Portón / Personal Escolar Autenticado (/staff)          │
│ Avatar + Iniciales del menor (M.G.) + Nombre y parentesco del Picker        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ LAYER 2 — Portal Administrativo y Tutor Legal (/admin, /apoderado)          │
│ Nombres completos, auditoría legal inmutable, gestión de autorizaciones     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Taxonomía y Arquitectura de Información (IA)

PickMe divide la navegación en **tres zonas delimitadas por permisos y contextos de uso**:

```
                                  PICKME
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      │                              │                              │
      ▼                              ▼                              ▼
  ZONA PÚBLICA                 ZONA PORTÓN                   ZONA ADMINISTRACIÓN
(Sin autenticación)         (Personal escolar)             (Sofía / Google Auth)
      │                              │                              │
      ├── / (Landing)                └── /staff                     ├── /admin (Dashboard)
      ├── /board/[sessionId] (TV)        • Lista reactiva en vivo   ├── /admin/colegio (Sedes)
      ├── /retirar (Picker móvil)        • Handover Keypad modal    ├── /admin/cursos (Salones)
      └── /apoderado (Magic link)        • Layer 1 (Iniciales)      ├── /admin/sesiones (En vivo)
                                                                    ├── /admin/simulador (Sandbox)
                                                                    └── /admin/auditoria (Logs)
```

---

## 🔄 Taskflow del Traspaso Físico de Custodia

```
[ Picker llega al colegio ]
            │
            ▼
[ Escanea QR o ingresa a /retirar ] ──► Ingresa número celular
            │
            ▼
[ Selecciona alumno autorizado ] ─────► Pulsa "Anunciar Llegada"
            │
            ├──► Backend transiciona alumno a IN_PROCESS en PostgreSQL
            ├──► Smart TV (/board): Alumno cambia a Amarillo con pulso neón
            └──► Pantalla móvil (/retirar): Exhibe HANDOVER CODE de 6 dígitos (⏱️ 10 min)
            │
            ▼
[ Auxiliar de portón (/staff) ] ──────► Ve alerta en tablet, ubica al menor en aula
            │
            ▼
[ Traspaso en portón físico ] ────────► Auxiliar pide los 6 dígitos al Picker
            │
            ▼
[ Auxiliar ingresa código en Keypad ] ─► Coincidencia validada
            │
            ├──► Estado pasa a IN_TRANSIT (sellado inmutable con timestamp)
            ├──► Smart TV (/board): Alumno cambia a Verde (Retirado ✓)
            └──► Apoderado recibe notificación de retiro completado
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
[ School ] 1 ─── n [ User (Admin/Staff) ]
    │
    ├── 1 ─── n [ Classroom ] 1 ─── n [ Student ]
    │                                       │
    │                                       ├── n ─── n [ Guardian ]
    │                                       │
    │                                       └── n ─── n [ Picker ] (vía Authorization)
    │
    └── 1 ─── n [ PickupSession ] 1 ─── n [ PickupEvent ] 1 ─── n [ Incident ]
```

* **`PickupEvent`**: Registro inmutable de custodia (`WAITING` ➔ `IN_PROCESS` ➔ `HANDOVER` ➔ `IN_TRANSIT` ➔ `ARRIVED` ➔ `ALERT`).
* **`Authorization`**: Vínculo legal entre apoderado, alumno y persona designada (permanente, rango o emergencia).

---

## 💻 Stack Tecnológico

| Capa | Tecnología | Justificación de Arquitectura |
|---|---|---|
| **Frontend Framework** | **Next.js 16.4.3 (App Router)** | Server Components, routing modular y Turbopack para compilación instantánea. |
| **Runtime UI** | **React 19.3.0** | Hooks modernos, concurrencia nativa y compatibilidad estricta. |
| **Lenguaje** | **TypeScript 5.x (Strict)** | Tipado de dominio de extremo a extremo sin concesiones de tipo `any`. |
| **Estilos & Diseño** | **CSS Modules + Tokens** | Rendimiento óptimo, sin runtime de CSS-in-JS y aislamiento de clases por componente. |
| **Base de Datos** | **PostgreSQL 16 + Prisma 7** | Integridad relacional, migraciones declarativas y driver adapter `@prisma/adapter-pg`. |
| **Generación QR** | **`qrcode.react` (SVG local)** | 100% autónomo y offline-ready sin depender de APIs externas de terceros. |
| **Tiempo Real** | **Pusher (`pusher-js`)** | Notificaciones instantáneas entre portón, Smart TV y móviles con baja latencia. |
| **Infraestructura** | **Docker & Docker Compose** | Entorno de desarrollo idéntico a producción mediante build multi-etapa standalone. |

---

## 🚀 Puesta en Marcha y Datos Demo

### 1. Levantar el entorno local con Docker

```bash
# Iniciar base de datos PostgreSQL
docker-compose up -d db

# Instalar dependencias
npm install

# Aplicar migraciones y sembrar datos de prueba
npx prisma migrate dev
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

### 2. Cuentas y Datos Demo Sembrados (`SAN-1024`)

| Rol | Usuario / Actor | Identificador / Teléfono | Propósito de Prueba |
|---|---|---|---|
| **Admin** | Sofía Valenzuela | `sofia@sanmartin.edu` | Panel administrativo y simulador de colegio. |
| **Staff Portón** | Carlos Mendoza | `carlos.puertas@sanmartin.edu` | Tablet de entrega en [`/staff`](http://localhost:3000/staff). |
| **Picker (Tío)** | Ignacio Herrera | `+56981112233` | Anunciar retiro de Mateo González (*Zorro Naranja*). |
| **Picker (Furgón)** | Don Pedro Transporte | `+56984445566` | Retiro de Valentina Soto (*Delfín Celeste*). |
| **Apoderada** | Carolina Herrera | `+56991112233` | Retiro directo y confirmación de llegada segura. |

---

## 📚 Documentación y Especificaciones

* [`docs/PRD.md`](docs/PRD.md): Requerimientos de producto detallados y reglas de negocio.
* [`docs/SDD.md`](docs/SDD.md): Especificación formal de arquitectura de sistemas y contratos criptográficos.
* [`docs/INFORMATION_ARCHITECTURE.md`](docs/INFORMATION_ARCHITECTURE.md): Mapa integral de navegación y taxonomía UX.
* [`docs/ROADMAP.md`](docs/ROADMAP.md): Registro de hitos y fases de desarrollo.
* [`docs/AGENT_SPECS.md`](docs/AGENT_SPECS.md): Especificación técnica interna del entorno de desarrollo de agentes.
