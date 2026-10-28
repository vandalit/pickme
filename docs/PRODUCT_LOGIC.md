# PickMe — Product Logic Document
> Sistema de gestión de salida escolar con cadena de custodia digital

---

## 1. Visión del Producto

PickMe resuelve la entrega segura de alumnos al final del día escolar. Opera bajo tres principios:

- **Sin apps nuevas** para padres: todo corre en el navegador o WhatsApp
- **Anonimato por defecto** en displays públicos
- **Cadena de custodia auditable** desde el colegio hasta el hogar

---

## 2. Actores del Sistema

| Rol | Dispositivo | Canal principal | Descripción |
|---|---|---|---|
| **Admin / Sofía** | Desktop / Tablet | Web app | Configura la escuela, alumnos y sesiones |
| **Apoderado** | Smartphone | WhatsApp + Link web | Autoriza pickers, confirma llegada |
| **Picker** | Smartphone | WhatsApp + QR scan | Recoge al alumno |
| **Staff / Entregador** | Smartphone / Tablet | Web app (staff view) | Valida y ejecuta la entrega física |
| **Smart TV (Board)** | TV en portón | Web app (board view) | Display público de sesión activa |

---

## 3. Capas de Anonimato (Privacy Layers)

El sistema opera con **tres niveles de identidad** según el contexto de visualización:

```
Layer 0 — Display público (Smart TV / portón)
  → Animal + Color  [ej: "Cocodrilo Amarillo"]
  → Sin nombre, sin foto, sin iniciales

Layer 1 — Vista Staff (tablet del entregador)
  → Avatar + Iniciales  [ej: avatar niña + "S.M."]
  → Solo visible en dispositivo autenticado

Layer 2 — Vista Admin / Apoderado autenticado
  → Nombre completo + Avatar personalizado
  → Acceso solo tras login verificado
```

### 3.1 Sistema de Avatares

**Opción A — Avatar Humanizado**
- Género: niño / niña / neutro
- Color de cabello: 6 opciones
- Color de ropa: 8 opciones
- Tono de piel: 5 opciones
- Configurable por apoderado, default asignado por sistema

**Opción B — Avatar Animal**
- Selección de ~20 animales (oso, cocodrilo, pingüino, etc.)
- Color principal asignado aleatoriamente pero persistente
- Combinaciones únicas dentro del mismo salón (no puede haber dos "Cocodrilo Amarillo" en el mismo grupo)

**Opción C — Código Numérico** _(configuración especial, opt-in por escuela)_
- El alumno se identifica solo con un número de 4 dígitos
- Máximo anonimato, mínima expresividad visual

> **Regla**: La combinación Animal+Color es siempre la primera capa pública. Las opciones A y C son configuraciones específicas de la escuela.

---

## 4. Entidades de Datos

```
Student
  ├── id (UUID interno)
  ├── avatar (config completa)
  ├── publicCode (Animal + Color | número)
  ├── initials (para staff view)
  ├── grade / classroom
  ├── homeAddress (coords georreferenciadas)
  └── relationships[]

Relationship (Student <-> Persona)
  ├── personId
  ├── type: [GUARDIAN | PICKER]
  ├── isAuthorizedToPickup: boolean
  ├── authorizationExpiry: date | null   <- puede ser permanente o temporal
  └── authorizedBy: guardianId

Guardian (Apoderado)
  ├── id
  ├── whatsappNumber (verificado)
  ├── name
  └── students[]  <- alumnos a su cargo

Picker
  ├── id
  ├── whatsappNumber
  ├── name
  ├── idDocumentHash  <- hash del RUT/doc, no el doc completo
  └── authorizedFor[]  <- lista de students

PickupSession
  ├── id
  ├── date
  ├── school
  ├── qrCode  <- generado al abrir sesión, único por sesión
  ├── qrExpiresAt  <- se refresca según config (ej: cada 5 min)
  ├── status: [OPEN | CLOSED]
  └── events[]

PickupEvent
  ├── id
  ├── sessionId
  ├── studentId
  ├── pickerId
  ├── staffId  <- quien entregó físicamente
  ├── handoverCode  <- código de 6 dígitos para confirmar traspaso
  ├── timeline:
  │     ├── pickerScanned: timestamp
  │     ├── staffConfirmed: timestamp
  │     ├── handoverCompleted: timestamp
  │     └── guardianConfirmed: timestamp | null
  ├── gpsTrack[]  <- array de coordenadas
  └── status: [PENDING | IN_TRANSIT | ARRIVED | ALERT]
```

---

## 5. Flujos Principales

### 5.1 Setup (Admin)

```
Sofía crea la escuela
  -> Define salones y alumnos (CSV import o manual)
  -> Sistema genera publicCode único por salón
  -> Envía invitación WhatsApp a cada apoderado con link de onboarding
  -> Apoderado completa perfil, personaliza avatar del hijo
  -> Apoderado registra Pickers autorizados (nombre + WhatsApp + relación)
```

### 5.2 Autorización de Picker (Apoderado)

```
Apoderado abre link web (sin instalar nada)
  -> Ingresa datos del Picker (nombre, WhatsApp, relación)
  -> Define ventana de autorización:
      ├── Permanente
      ├── Fecha específica
      └── Rango de fechas
  -> Sistema envía WhatsApp al Picker con su código de acceso
  -> Picker queda registrado y puede ser buscado en futuras sesiones
```

### 5.3 Sesión de Salida (Staff abre sesión)

```
Staff (o Admin) abre nueva sesión en web app
  -> Selecciona: fecha, horario, tipo (salida normal / salida especial)
  -> Sistema genera:
      ├── QR único de sesión
      └── Código alfanumérico de sesión (fallback sin cámara)
  -> Smart TV muestra Board:
      ├── QR grande
      ├── Código de sesión
      └── Lista de alumnos en Layer 0 (Animal + Color)
         -> Estado: [Esperando | En proceso | Retirado]
```

### 5.4 Flujo de Retiro — El Flujo Core

```
PASO 1 — Picker llega al colegio
  -> Escanea QR del Smart TV con su cámara
  -> Se abre link web en su teléfono (sin instalar nada)
  -> O bien: ingresa código de sesión manualmente en pickme.app/retirar

PASO 2 — Identificación del alumno
  -> Picker indica a quién va a buscar:
      ├── Opción A: Escribe nombre del alumno en el formulario web
      ├── Opción B: Lo dice por WhatsApp al bot ("Voy a buscar a Sofía")
      └── Opción C: Ingresa el código numérico del alumno (si aplica)

PASO 3 — Validación de seguridad (backend)
  -> Sistema verifica:
      ├── ¿Picker está registrado en el sistema?
      ├── ¿Está autorizado para ESE alumno?
      ├── ¿La autorización está vigente (fecha)?
      └── ¿Hay alguna alerta o restricción activa?
  -> Si todo OK -> genera handover token + notifica al Staff

PASO 4 — Confirmación Staff
  -> Staff recibe alerta en su tablet:
      "Picker [Nombre] está aquí para buscar a [Iniciales + Avatar]"
      "Verificado CHECK — Autorizado por [Apoderado]"
  -> Staff confirma visualmente que la persona coincide
  -> Staff presiona "Confirmar entrega" en su tablet

PASO 5 — Handover Code
  -> Sistema genera código de 6 dígitos (como delivery de comida)
  -> Código se muestra en la pantalla del Picker
  -> Staff lo ingresa en su tablet para confirmar el traspaso físico
  -> Evento registrado: [staffId, pickerId, studentId, timestamp]

PASO 6 — GPS Tracking activado
  -> Sistema envía WhatsApp al Picker con link de tracking
      "Comparte tu ubicación en tiempo real" -> link abre en browser
  -> Sistema notifica al Apoderado:
      "[Nombre] fue retirado por [Picker] a las 14:32. Seguimiento activo"
  -> Apoderado recibe link de tracking en tiempo real

PASO 7 — Confirmación de llegada
  -> Sistema monitorea GPS del Picker contra homeAddress del alumno
  -> Cuando GPS entra en radio de 100m del hogar:
      -> Envía WhatsApp al Apoderado: "¿Confirmás que [Nombre] llegó?"
      -> Botón: [SÍ, llegó] [No, hay problema]
  -> Si Apoderado confirma -> PickupEvent status = ARRIVED
  -> Si no confirma en 30 min -> ALERTA automática a Admin
```

### 5.5 Protocolo de Alerta (Luz Roja)

**Trigger automático si:**
- GPS se aleja significativamente de la ruta esperada (colegio → hogar)
- Picker no autorizado intenta retirar
- Apoderado no confirma llegada en ventana de tiempo configurada
- Apoderado presiona "Hay un problema"

**Acciones en cascada:**
```
1. Notificación inmediata a todos los Apoderados del alumno
2. Alerta en dashboard del Admin (Sofía)
3. Registro del incidente con GPS track completo
4. Sistema envía WhatsApp al Picker:
   "Hemos notado que estás fuera de ruta. ¿Todo está bien?"
   -> [Sí, estoy bien] [Necesito ayuda]
5. Si no responde en 5 min -> escala a número de emergencia de la escuela
```

---

## 6. El Board — Smart TV Display

Layout del display público en el portón de salida:

```
┌─────────────────────────────────────────────────────────┐
│  PICKME  —  Salida 14:30  —  Martes 28 Oct              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Cocodrilo Amarillo]  [Oso Azul]  [Pingüino Verde]     │
│     Esperando            En proceso    Esperando        │
│                                                         │
│  [Zorro Rojo]  [León Naranja]  [Delfín Celeste]         │
│     Retirado ✓    Esperando       Esperando             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Para retirar a tu hijo/a escanea el código:            │
│                                                         │
│         ┌──────────────┐                               │
│         │   [QR CODE]  │   Código: K7-4X2              │
│         └──────────────┘                               │
│  pickme.app/retirar                                     │
└─────────────────────────────────────────────────────────┘
```

**Reglas del Board:**
- Solo muestra alumnos de la sesión activa con su publicCode (Layer 0)
- Sin nombres, sin fotos, sin iniciales visibles al público
- El publicCode es único por salón, no necesariamente por toda la escuela
- QR se refresca cada N minutos (configurable, default: 5 min)
- Sesiones pasadas: datos anonimizados, pero auditables por Admin

---

## 7. Integración WhatsApp

| Evento | Destinatario | Tipo |
|---|---|---|
| Onboarding | Apoderado | Link de configuración |
| Picker registrado | Picker | Confirmación + código de acceso |
| Retiro iniciado | Apoderado | Aviso + link de tracking |
| Handover completado | Apoderado | "Fue retirado a las HH:MM" |
| Llegada detectada | Apoderado | "¿Confirmás llegada?" + botones |
| Alerta activa | Apoderado + Admin | "Protocolo de alerta activado" |
| Bot de identificación | Picker | Responder quién van a buscar |

---

## 8. Persistencia y Auditoría

```
Datos permanentes (cifrados):
  -> PickupEvents completos con timeline
  -> GPS tracks de eventos con ALERTA
  -> Registro histórico de autorizaciones

Datos que se anonimizan tras 90 días:
  -> GPS tracks de eventos normales (solo se conserva: llegó / no llegó)
  -> Logs de sesión

Datos que NUNCA son públicos:
  -> Nombres completos de alumnos
  -> Fotos de alumnos
  -> Dirección exacta del hogar
  -> Números de WhatsApp de pickers / apoderados
```

---

## 9. Consideraciones de Seguridad

- **QR de sesión**: firmado con HMAC, expira por tiempo Y por sesión
- **Link de picker**: token único de un solo uso por evento de retiro
- **GPS tracking**: el picker comparte ubicación vía Web Geolocation API
- **homeAddress**: almacenada como coordenadas cifradas, nunca como texto plano
- **Handover code**: 6 dígitos, expira en 10 minutos, un solo uso
- **Sin contraseñas para padres**: autenticación por magic link vía WhatsApp

---

## 10. Roadmap: MVP → V2

### MVP (primera versión funcional)

- [ ] Board básico en Smart TV (Layer 0, QR, estados en tiempo real)
- [ ] Flujo de picker: scan QR → identificación → validación → handover code
- [ ] Vista Staff: validación y confirmación de entrega física
- [ ] Vista Admin: gestión de alumnos, avatares, pickers autorizados
- [ ] WhatsApp: notificación de retiro + confirmación de llegada (manual)
- [ ] Sin GPS automático en MVP (confirmación 100% manual por apoderado)

### V2 (expansión)

- [ ] GPS tracking real-time con alertas automáticas por desvío de ruta
- [ ] Bot de WhatsApp con NLP para identificación de alumno por voz/texto
- [ ] Autorizaciones temporales con vencimiento y recurrencia
- [ ] Reportes y dashboard de incidentes para Admin
- [ ] Multi-salón y multi-escuela
- [ ] Autorizaciones de emergencia (un apoderado autoriza a alguien en tiempo real)

---

## 11. Stack Técnico Propuesto

| Capa | Tecnología | Razón |
|---|---|---|
| Frontend | Next.js | SSR, múltiples vistas, PWA-ready |
| Estilos | CSS custom (design tokens) | Control total, animaciones |
| Backend | Next.js API Routes | Unificado, deploy simple |
| Base de datos | PostgreSQL + Prisma | Relaciones complejas, auditoría |
| WhatsApp | Twilio / Meta Cloud API | Mensajes + bot conversacional |
| GPS | Web Geolocation API | Sin instalar nada en el picker |
| Auth | Magic links por WhatsApp OTP | Sin contraseñas para padres |
| Hosting | Vercel + Supabase | Deploy rápido, escala |
| QR | qrcode.js | Generación client-side, refrescable |
| Real-time | WebSockets / Pusher | Board y estados en vivo |
