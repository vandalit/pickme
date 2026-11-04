# PickMe — Arquitectura de Información y Mapa de Navegación UX

**Versión**: 1.0  
**Fecha**: Noviembre 2026  
**Enfoque**: Modularidad de Componentes, Privacy by Design y Product-Led Onboarding  

---

## 1. Visión General de la Taxonomía

PickMe divide la experiencia de usuario en **tres zonas estrictamente delimitadas**:

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
      ├── /board/[sessionId] (TV)        • Lista en tiempo real     ├── /admin/colegio (Sedes/Horarios)
      ├── /retirar (Picker móvil)        • Handover Keypad          ├── /admin/cursos (Salones y Alumnos)
      └── /apoderado (Magic link)        • Layer 1 (Iniciales)      ├── /admin/sesiones (En vivo)
                                                                    ├── /admin/simulador (Sandbox Demo)
                                                                    └── /admin/auditoria (Historial)
```

---

## 2. Matriz de Rutas y Especificación de Pantallas

### 2.1 Zona Pública (Cero Barreras de Acceso)

| Ruta | Actor Principal | Dispositivo Target | Nivel de Privacidad | Comportamiento UX |
|---|---|---|---|---|
| **`/`** | Directores, Padres, Visitantes | Desktop / Móvil | Público | Landing institucional con propuesta de valor, botón "Iniciar con Google" para colegios y acceso rápido a demostración. |
| **`/board/[sessionId]`** | Transeúntes, Choferes, Niños | Smart TV (55"+) | **Layer 0 (Máximo Anonimato)** | Pantalla 100% pasiva y no interactiva. Grid de alumnos por curso usando únicamente código *Animal + Color*. Código QR firmado con rotación cada 5 min y código alfanumérico visible. Cero interacción táctil. |
| **`/retirar`** | Picker (Familiar / Chofer) | Smartphone (Web) | Layer 1 (Restringido) | Se abre tras escanear el QR o tipear `pickme.app/retirar`. Formulario minimalista: celular + búsqueda de alumno. Pantalla de espera reactiva y display del *Handover Code* de 6 dígitos. |
| **`/apoderado`** | Tutor Legal | Smartphone (Web) | Layer 2 (Verificado) | Acceso por Magic Link temporal. Gestión de personas autorizadas (permanente o temporal) y botón interactivo para confirmar llegada segura del alumno. |

### 2.2 Zona de Portón (Personal Escolar)

| Ruta | Actor Principal | Dispositivo Target | Nivel de Privacidad | Comportamiento UX |
|---|---|---|---|---|
| **`/staff`** | Maestra / Auxiliar de portón | Tablet / Smartphone | **Layer 1 (Operativo)** | Vista autenticada optimizada para uso con una sola mano bajo luz solar. Lista de llamados entrantes en tiempo real (Pusher) mostrando Avatar + Iniciales del menor + Nombre del Picker. Teclado numérico táctil (*Keypad*) para ingresar el código de traspaso físico. |

### 2.3 Zona de Administración (Sofía)

| Ruta | Actor Principal | Dispositivo Target | Nivel de Privacidad | Comportamiento UX |
|---|---|---|---|---|
| **`/admin`** | Sofía (Directora) | Desktop / Tablet | **Layer 2 (Auditoría Total)** | Vista general de la institución: métricas del día (alumnos esperando, en proceso y entregados), accesos rápidos y sesiones activas. |
| **`/admin/colegio`** | Sofía | Desktop | Layer 2 | Configuración del colegio: sedes, turnos de salida (mañana, tarde), tolerancia de horarios y parámetros de rotación de QR. |
| **`/admin/cursos`** | Sofía | Desktop | Layer 2 | Jerarquía de salones (1°A, 2°B). Carga de nómina de alumnos (manual o CSV) y asignación automática del identificador único *Animal + Color* por aula. |
| **`/admin/sesiones`** | Sofía / Staff | Desktop / Tablet | Layer 2 | Apertura, supervisión y cierre formal de sesiones de salida escolar en tiempo real. |
| **`/admin/simulador`** | Sofía | Desktop | **Sandbox Privado** | **El Sandbox de Validación**: pantalla dividida interactiva que permite a Sofía simular una sesión completa con datos mock para validar conexiones, tokens, QR, fechas operativas y tracking antes de operar en vivo. |
| **`/admin/auditoria`** | Sofía | Desktop | Layer 2 | Libro inmutable de eventos de custodia (`PickupEvent`), incidentes y exportación de reportes en CSV/PDF para respaldo legal. |

---

## 3. Arquitectura Modular de Componentes (`src/components/`)

Diseñada bajo el principio de **Componentes Presentacionales (Puros) vs. Contenedores de Estado**:

```
src/components/
├── ui/                     # Átomos y Componentes Base Reutilizables
│   ├── Button/             # Botones accesibles (variantes: primary, secondary, alert, ghost)
│   ├── Badge/              # Badges de estado de custodia (waiting, in_process, picked_up)
│   ├── Keypad/             # Teclado táctil numérico de 6 dígitos para portón
│   ├── Modal/              # Diálogo accesible con focus trap y escape
│   └── QRDisplay/          # Renderizador SVG local y offline con qrcode.react
│
├── board/                  # Módulo Smart TV (Layer 0)
│   ├── BoardHeader.tsx     # Cabecera con logo, fecha, reloj en vivo y métricas pill
│   ├── StudentGrid.tsx     # Cuadrícula agrupada por salones con auto-fill responsive
│   ├── StudentCard.tsx     # Card de alumno con glow de color, emoji animal y animación
│   └── QRPanel.tsx         # Panel lateral de portón con anillo SVG de progreso
│
├── staff/                  # Módulo de Portón (Layer 1)
│   ├── ValidationCard.tsx  # Ficha del picker autorizado y avatar con iniciales
│   └── HandoverModal.tsx   # Modal de tipeo rápido del código de traspaso físico
│
└── admin/                  # Módulo Administrativo y Sandbox
    ├── AdminSidebar.tsx    # Barra lateral de navegación del panel de Sofía
    ├── SchoolSetup.tsx     # Asistente de configuración de cursos y turnos
    └── SandboxSimulator/   # Motor de simulación y demostración guiada
        ├── SimulatorShell.tsx   # Contenedor de pantalla dividida
        ├── VirtualPhone.tsx     # Mockup de smartphone para roles Picker y Apoderado
        ├── WhatsAppMockup.tsx   # Maqueta visual interactiva de mensajes y botones
        └── LiveLogConsole.tsx   # Consola de depuración de tokens y eventos en vivo
```

---

## 4. Principios de Interfaz y Diseño Visual (UX Guidelines)

1. **Tokens Centralizados**: Ningún componente define colores o radios en duro; todos consumen variables de `src/app/globals.css`.
2. **Microanimaciones Funcionales**: Uso de curvas de resorte (`cubic-bezier(0.34, 1.56, 0.64, 1)`) para dar feedback inmediato sin ralentizar el dispositivo móvil.
3. **Legibilidad a Distancia (Smart TV)**: Tipografía Inter con escala tipográfica agrandada para ser leída sin esfuerzo a 5-10 metros de distancia en exteriores.
4. **Ergonomía Táctil en Portón**: En `/staff` y `/retirar`, las áreas de toque (*touch targets*) tienen un mínimo de 48×48px para operar rápidamente con una sola mano.

