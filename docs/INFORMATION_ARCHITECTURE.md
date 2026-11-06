# PickMe — Arquitectura de Información y Mapa de Navegación UX

**Versión**: 2.0  
**Fecha**: Noviembre 2026  
**Propósito**: Taxonomía de navegación, jerarquía visual y distribución de componentes por nivel de exposición de datos.

---

## 1. Visión General de la Taxonomía

```
                                      PICKME (Ecosistema Global)
                                                  │
         ┌────────────────────────────────────────┼────────────────────────────────────────┐
         │                                        │                                        │
         ▼                                        ▼                                        ▼
   ZONA PÚBLICA / MÓVIL                     ZONA DE PORTÓN                          ZONA DE GESTIÓN
(Cero Barrera de Entrada)               (Personal de Portería)                  (Directora Sofía / Auth)
         │                                        │                                        │
         ├── / (Landing Showcase)                 └── /staff (Tablet de Entrega)           ├── /auth/login (Login Institucional)
         ├── /board/[sessionId] (TV Patio)             • Cola viva de retiro               ├── /admin (Jornada & Launchpad)
         │    • Animal + Color único                   • Teclado Keypad 64px               ├── /admin/cursos (Nómina Alumnos)
         └── /retirar (Picker Móvil)                   • Capa 1: Iniciales                 ├── /admin/auditoria (Bitácora Legal)
              • Búsqueda por teléfono                                                      └── /admin/simulador (Sandbox Demo)
              • Generación Handover Code
```

---

## 2. Matriz de Rutas y Especificación de Pantallas

| Ruta | Actor Principal | Dispositivo Óptimo | Nivel de Privacidad | Propósito y Capacidades Clave |
|---|---|---|---|---|
| **`/`** | Visitante / Evaluador | Desktop / Móvil | Público | Presentación del caso de estudio, propuesta de valor de las 3 capas y accesos directos al ecosistema. |
| **`/board/[sessionId]`** | Alumnos y Docentes en Patio | Smart TV 1080p | **Capa 0 (Público Pasivo)** | Proyección de llamados de alumnos mediante tarjetas de alto contraste con su *Animal + Color* asignado. Cero nombres. |
| **`/retirar`** | Apoderados y Pickers | Smartphone (Web Móvil) | **Capa 1 (Operativo)** | Búsqueda por número celular, selección de alumnos autorizados y generación del código de traspaso de 6 dígitos. |
| **`/staff`** | Auxiliar en Portón (Carlos) | Tablet 10" / Móvil | **Capa 1 (Operativo)** | Cola en tiempo real de alumnos llamados, verificación de parentesco del picker y validación táctil con teclado de 64px. |
| **`/auth/login`** | Directores y Staff | Desktop / Móvil | Seguro (JWT) | Punto único de acceso con credenciales institucionales o Google Workspace OAuth. |
| **`/admin`** | Directora (Sofía) | Desktop / Laptop | **Capa 2 (Auditoría Total)** | **Centro de Despacho (Launchpad)**: apertura y cierre de jornada, métricas de embudo y generación de enlaces para TV, Portón y QR. |
| **`/admin/cursos`** | Directora (Sofía) | Desktop | **Capa 2 (Auditoría Total)** | Nómina completa de salones y alumnos. Despliega nombres completos, cursos, apoderados autorizados y pares Animal+Color. |
| **`/admin/auditoria`** | Directora (Sofía) | Desktop | **Capa 2 (Auditoría Total)** | Registro histórico inmutable de eventos de custodia, firmas de funcionarios, tiempos de espera e incidentes. |
| **`/admin/simulador`** | Directora / Evaluador | Desktop (Split-screen) | Herramienta Sandbox | Laboratorio de pruebas en 3 columnas que simula la interacción completa de Smart TV, Móvil y Tablet en < 3 minutos. |

---

## 3. Modelo de Componentes UI (`src/components/`)

```
src/components/
├── ui/                     # Átomos del Sistema de Diseño (Design Tokens)
│   ├── Badge/              # Indicador de estado de custodia (WAITING, IN_PROCESS, ARRIVED, ALERT)
│   ├── Button/             # Botones táctiles elásticos (primary, secondary, alert, ghost)
│   ├── Keypad/             # Teclado numérico táctil accesible de 64px con ranuras de código
│   ├── QRDisplay/          # Renderizador de código QR vectorial autónomo (qrcode.react)
│   └── Modal/              # Diálogo accesible con focus trap y escape handler
│
├── board/                  # Componentes de Pantalla Mural Smart TV (Capa 0)
│   ├── BoardHeader.tsx     # Reloj vivo en tiempo real, fecha en español y contadores
│   ├── StudentCard.tsx     # Tarjeta anónima con avatar animal y color dinámico
│   ├── StudentGrid.tsx     # Grilla fluida de alta visibilidad ordenada por prioridad
│   └── QRPanel.tsx         # Panel lateral con código QR grande para apoderados
│
├── picker/                 # Asistente Móvil de Retiro (Capa 1)
│   ├── StepLookup.tsx      # Formulario de teléfono y validación de sesión
│   ├── StepStudentSelect.tsx # Selector visual de alumnos autorizados
│   └── StepHandoverDisplay.tsx # Despliegue del Handover Code de 6 dígitos con temporizador
│
├── staff/                  # Consola de Auxiliar de Portón (Capa 1)
│   ├── StaffHeader.tsx     # Filtro por estados (Todos, En Portón, Esperando, Entregados)
│   ├── ValidationCard.tsx  # Tarjeta de validación de identidad con iniciales y picker
│   └── HandoverModal.tsx   # Modal de validación táctil con Keypad integrado
│
└── admin/                  # Consola de Gobierno Escolar y Simulación (Capa 2)
    ├── LaunchpadHub.tsx    # Centro de despacho de URLs (Smart TV, Portón, Afiche QR)
    ├── RosterTable.tsx     # Tabla de alumnos con revelación de nombres y retiradores
    ├── SessionFunnel.tsx   # Gráfico de embudo de salida en tiempo real
    └── SandboxSimulator/   # Vista interactiva dividida en 3 columnas (TV, Móvil, Tablet)
```
