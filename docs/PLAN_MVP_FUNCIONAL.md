# 📋 PickMe — Plan de Ingeniería: MVP Productivo y Operativo

**Objetivo:** Transformar PickMe de un prototipo de presentación con datos estáticos a un **SaaS Operativo Real de Salida Escolar y Cadena de Custodia**, operable por colegios reales, con cuentas de usuario reales, gobernanza de nómina, despacho dinámico de sesiones y flujo de retiro en vivo.

---

## 🔍 1. Análisis de Viabilidad Externa (Costo $0 / Free Tier)

Para asegurar que el sistema sea 100% go-live sin costos mensuales ni tarjetas de crédito obligatorias, se evaluaron los servicios externos:

| Servicio | Rol en el Sistema | Estrategia Free / Sin Bloqueantes | Viabilidad |
|---|---|---|---|
| **PostgreSQL** | Base de datos relacional y auditoría | **Neon Serverless PostgreSQL** (Free tier permanente, 0.5 GiB, compute serverless que duerme sin costo). | ✅ 100% Viable (Ya aprovisionado) |
| **Hosting / Deploy** | Servidor web y Server Actions | **Vercel Hobby Tier** (Free permanente, soporte nativo de Next.js App Router). | ✅ 100% Viable |
| **Google OAuth** | Login institucional de directores | **Google Cloud Console OAuth 2.0 Client** (Free permanente). Si no se configuran tokens, NextAuth Credentials funciona como fallback universal con cualquier correo institucional. | ✅ 100% Viable |
| **Sincronización en Vivo** | Conexión TV ➔ Móvil ➔ Portón | **SSE (Server-Sent Events) + Polling Reactivo nativo** en Next.js. Elimina la necesidad de planes de pago de Pusher/Ably, costo $0 permanente y menor latencia en Vercel. | ✅ 100% Viable (Cero dependencias) |
| **Notificaciones WhatsApp** | Aviso al apoderado de entrega | **Estrategia Híbrida Inteligente**:<br>1. *Simulador y Webhook reactivo*: Notificación en vivo en el sistema.<br>2. *WhatsApp Direct Link (`wa.me`)*: Genera el enlace oficial preformateado y firmado de custodia a costo $0 y sin requerir cuentas de pago de Twilio o aprobación comercial de Meta. | ✅ 100% Viable (Sin barrera de entrada) |

---

## 🗺️ 2. Hoja de Ruta de Implementación (5 Fases)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HOJA DE RUTA AL MVP PRODUCTIVO                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 1: Motor de Onboarding & Cuenta Real                                   │
│ • Detección de cuenta nueva en primer login                                 │
│ • Flujo /admin/onboarding para crear Colegio (School) y vincular Director   │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 2: Gobernanza Real de Cursos y Alumnos (/admin/cursos)                 │
│ • CRUD de Cursos (Crear, Editar, Eliminar cursos)                           │
│ • CRUD de Alumnos con Apoderados Titulares y Retiradores Autorizados        │
│ • Algoritmo Asignador de Avatares Anónimos (Cero colisiones por sala)       │
│ • Importador Masivo de Nóminas vía archivo CSV                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 3: Despacho y Ciclo de Vida de Jornada Escolar (/admin)                │
│ • Botón "Iniciar Jornada" (Crea PickupSession real en BD con código diario) │
│ • Generador de URLs dinámicas para TV (/board/[id]), Staff y Afiche QR       │
│ • Botón "Finalizar y Cerrar Jornada" (Congela eventos hacia /auditoria)     │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 4: Flujo de Retiro Operativo End-to-End                                │
│ • /retirar: Picker ingresa su teléfono, ve alumnos autorizados y solicita  │
│ • /board/[id]: TV proyecta en vivo el avatar en espera                     │
│ • /staff: Auxiliar digita código de 6 dígitos en Keypad y sella entrega     │
│ • /admin/auditoria: Refleja el evento con firma y timestamp UTC real        │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 5: Despliegue en Vercel & Verificación en Producción                   │
│ • Configuración de variables de entorno en Vercel                           │
│ • Verificación de migraciones y pruebas con usuarios reales                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 3. Especificación Técnica por Componente

### FASE 1: Onboarding Institucional
- **Ruta**: `/admin/onboarding` (Protegida por middleware; redirige automáticamente si el usuario no tiene `schoolId`).
- **Campos**:
  - Nombre Oficial del Colegio (ej: *Colegio San Martín de Tours*).
  - RBD / Código de establecimiento (opcional).
  - Dirección y Teléfono de contacto.
- **Acción Server**: `createSchoolOnboardingAction(formData)`. Crea `School`, asocia `User` con rol `SCHOOL_ADMIN`, y redirige a `/admin/cursos`.

### FASE 2: Gobernanza de Cursos y Alumnos (`/admin/cursos`)
- **Acciones de Curso**:
  - `createClassroomAction(grade, section)` (ej: *1° Básico*, *A*).
  - Listado con tarjetas por curso y total de alumnos matriculados.
- **Acciones de Alumno**:
  - `createStudentAction({ fullName, classroomId, guardianName, guardianPhone, pickers: [...] })`.
  - **Lógica de Avatares**: Consulta los avatares ya usados en esa `classroomId` y selecciona de forma determinista o aleatoria el siguiente par libre entre los 8 animales (*Zorro, Oso, Delfín, Lobo, Panda, Cocodrilo, León, Búho*) y 6 colores (*Naranja, Café, Celeste, Azul, Verde, Amarillo*), garantizando **0 colisiones** en la pantalla del patio.
- **Importador CSV**:
  - Modal para subir archivo `.csv` con formato: `nombre_alumno, curso, apoderado_nombre, apoderado_telefono, retirador_nombre, retirador_parentesco`.
  - Vista previa de validación de filas antes de persistir en PostgreSQL.

### FASE 3: Despacho de Jornadas (`/admin`)
- **Apertura de Jornada**:
  - Server Action `openDailySessionAction()`.
  - Genera código de sesión legible (ej: `CSM-20261106`).
  - Puebla automáticamente los `PickupEvents` iniciales en estado `WAITING` para todos los alumnos activos del colegio.
- **Cierre de Jornada**:
  - Server Action `closeDailySessionAction(sessionId)`.
  - Cierra la sesión (`CLOSED`), calcula estadísticas de retiro y traslada los registros finales a `/admin/auditoria`.

### FASE 4: Flujo de Retiro End-to-End
1. **Retirador (`/retirar?session=...`)**:
   - Ingresa su número de WhatsApp.
   - La API (`/api/pickup/lookup`) busca en la sesión activa si ese teléfono está registrado como Apoderado o Picker autorizado.
   - Exhibe la tarjeta del menor con sus iniciales y avatar anónimo.
   - Al pulsar *"Anunciar Llegada en Portón"*:
     - La API (`/api/pickup/solicitar`) actualiza el estado a `IN_PROCESS`.
     - Genera un `handoverCode` criptográfico aleatorio de 6 dígitos con vigencia de 10 minutos (`handoverExpiry`).
2. **Pantalla Mural TV (`/board/[sessionId]`)**:
   - Monitorea los eventos de la sesión mediante SSE o polling reactivo cada 3 segundos.
   - En cuanto el evento pasa a `IN_PROCESS`, la tarjeta del alumno enciende su anillo ámbar de animación.
3. **Consola Tablet Staff (`/staff?session=...`)**:
   - Muestra la cola de llamados en tiempo real.
   - El auxiliar Carlos pulsa al alumno, se abre el modal del Keypad táctil de 64px.
   - Al digitar los 6 dígitos, la API (`/api/pickup/verificar-handover`) valida el código y la vigencia.
   - Si coincide: actualiza el evento a `ARRIVED`, registra `staffConfirmedAt: new Date()` y el funcionario responsable.
4. **Auditoría Forense (`/admin/auditoria`)**:
   - Registra el hash SHA-256 inmutable de la entrega y el sello de tiempo UTC exacto.

---

## 🚀 4. Plan de Ejecución Inmediato

Comenzaremos por el núcleo de datos: **FASE 1 (Onboarding de cuenta) y FASE 2 (CRUD de Cursos, Alumnos y Asignador de Avatares en `/admin/cursos`)**.
Con esto, cualquier usuario que entre al sistema podrá dar de alta su colegio, armar sus cursos y poblar su nómina con avatares reales.

