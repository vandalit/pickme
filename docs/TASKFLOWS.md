# PickMe — Task Flows Funcionales

> Descripción detallada de cada flujo del sistema desde la perspectiva del usuario.
> Estos flows son la fuente de verdad para diseño e implementación.

---

## TF-01 | Admin — Setup inicial de la escuela

**Actor**: Admin (Sofía)  
**Precondición**: Cuenta de admin creada  
**Postcondición**: Escuela configurada con alumnos y apoderados invitados

```
┌─ Admin accede a /admin ──────────────────────────────────────┐
│                                                              │
│  1. Completa datos de la escuela:                            │
│     • Nombre, dirección, teléfono de emergencia              │
│     • Configuración de privacidad (Layer 0 por defecto)      │
│     • Tiempo de QR refresh (default: 5 min)                  │
│     • Tiempo de confirmación de llegada (default: 30 min)    │
│                                                              │
│  2. Crea salones (ej: "1°A", "2°B")                         │
│                                                              │
│  3. Carga alumnos:                                           │
│     • Opción A: Importa CSV (nombre, RUT, salón, whatsapp    │
│       apoderado, dirección de hogar)                         │
│     • Opción B: Carga manual alumno por alumno               │
│                                                              │
│  4. Sistema:                                                 │
│     • Genera UUID interno por alumno                         │
│     • Asigna publicCode único Animal+Color por salón         │
│     • Asigna avatar animal default (randomizado)             │
│     • Envía WhatsApp de invitación a cada apoderado          │
│       con magic link de onboarding                           │
│                                                              │
│  5. Admin ve dashboard con estado de onboarding:             │
│     • "X de Y apoderados completaron su perfil"              │
└──────────────────────────────────────────────────────────────┘
```

**Estados posibles del alumno en onboarding:**
- `PENDING` — apoderado no abrió el link
- `PROFILE_COMPLETE` — apoderado configuró su perfil
- `PICKER_REGISTERED` — al menos un picker autorizado registrado
- `READY` — listo para operar

---

## TF-02 | Apoderado — Onboarding y configuración

**Actor**: Apoderado  
**Canal**: WhatsApp → navegador (sin instalar nada)  
**Precondición**: Admin cargó al alumno y envió invitación  
**Postcondición**: Apoderado con perfil activo y al menos un picker registrado

```
┌─ Apoderado recibe WhatsApp ──────────────────────────────────┐
│                                                              │
│  "Hola! Sofía te invita a configurar el retiro seguro de     │
│   [Nombre alumno] en [Escuela]. Toca para comenzar →         │
│   pickme.app/onboarding?token=xxxx"                          │
│                                                              │
│  1. Apoderado toca el link → se abre en el navegador         │
│     (no descarga nada)                                       │
│                                                              │
│  2. Verifica su número de WhatsApp (OTP de 6 dígitos)        │
│                                                              │
│  3. Ve la card de su hijo/a:                                 │
│     • Avatar asignado por defecto (Animal + Color)           │
│     • Puede personalizar: cambiar animal, color, o cambiar   │
│       a avatar humanizado (género, cabello, ropa, tono piel) │
│                                                              │
│  4. Registra Pickers autorizados:                            │
│     • Nombre completo                                        │
│     • Número de WhatsApp                                     │
│     • Relación (familiar / chofer / nana / otro)             │
│     • Tipo de autorización:                                  │
│       - Permanente                                           │
│       - Fecha específica                                     │
│       - Rango de fechas                                      │
│     • Sistema envía WhatsApp al picker confirmando registro   │
│                                                              │
│  5. Apoderado ve confirmación: "Todo listo"                  │
│     • Puede agregar más pickers                              │
│     • Puede editar avatar                                    │
│     • Puede regresar en cualquier momento al mismo link      │
└──────────────────────────────────────────────────────────────┘
```

---

## TF-03 | Apoderado — Registro de Picker adicional (post-onboarding)

**Actor**: Apoderado  
**Cuándo**: En cualquier momento (no solo durante la sesión)

```
┌─ Apoderado abre pickme.app/apoderado (su portal) ───────────┐
│                                                              │
│  1. Accede con magic link enviado por WhatsApp               │
│     O con su número de WhatsApp + OTP                        │
│                                                              │
│  2. Ve la sección "Personas autorizadas"                     │
│                                                              │
│  3. Toca "Agregar persona"                                   │
│     • Ingresa datos del picker                               │
│     • Define vigencia                                        │
│                                                              │
│  4. Confirma → Picker recibe WhatsApp con su código          │
│                                                              │
│  5. Apoderado puede:                                         │
│     • Ver lista de pickers activos y vencidos                │
│     • Revocar autorización de un picker (acción inmediata)   │
│     • Editar vigencia de una autorización                    │
└──────────────────────────────────────────────────────────────┘
```

---

## TF-04 | Apoderado — Autorización de emergencia (en tiempo real)

**Actor**: Apoderado  
**Cuándo**: Durante una sesión de salida activa, el picker no está registrado  
**Criticidad**: Alta — debe completarse en menos de 3 minutos

```
┌─ Apoderado necesita autorizar a alguien en el momento ───────┐
│                                                              │
│  Escenario: Sofía (apoderada) no puede ir, manda a su        │
│  vecina Carmen que no estaba registrada.                     │
│                                                              │
│  OPCIÓN A — Apoderado inicia el proceso:                     │
│  1. Abre su portal (/apoderado)                              │
│  2. Toca "Autorizar ahora" (botón de emergencia destacado)   │
│  3. Ingresa datos de Carmen (nombre + WhatsApp)              │
│  4. Elige confirmación:                                      │
│                                                              │
│     [Confirmar con botón]                                    │
│      → Registro: timestamp + IP + device fingerprint         │
│      → Equivale a firma digital simple                       │
│                                                              │
│     [Grabar micro-video]  (si la escuela lo requiere)        │
│      → Apoderado graba 5-10 seg desde la cámara             │
│      → "Yo, [nombre], autorizo a Carmen a recoger a          │
│         [alumno] hoy [fecha]"                                │
│      → Video se almacena cifrado como evidencia legal        │
│                                                              │
│  5. Staff recibe alerta: "Picker de emergencia autorizado    │
│     para [alumno]: Carmen García"                            │
│  6. Carmen recibe WhatsApp con QR temporal de un solo uso    │
│                                                              │
│  OPCIÓN B — Picker llega sin registro, staff lo detecta:     │
│  1. Picker ingresa al flujo /retirar, sistema dice:          │
│     "No estás registrado. El apoderado debe autorizarte."    │
│  2. Sistema envía WhatsApp al apoderado:                     │
│     "[Persona] quiere retirar a [alumno]. ¿Autorizas?"       │
│     [Sí, autorizar] [No, rechazar] [Ver más]                 │
│  3. Apoderado responde → flujo continúa o se cancela         │
└──────────────────────────────────────────────────────────────┘
```

---

## TF-05 | Staff — Abrir sesión de salida

**Actor**: Staff (maestra, auxiliar)  
**Cuándo**: 5-10 minutos antes del horario de salida

```
┌─ Staff accede a /staff ──────────────────────────────────────┐
│                                                              │
│  1. Login con credenciales de staff                          │
│                                                              │
│  2. Toca "Nueva sesión de salida"                            │
│     • Selecciona salón(es) incluidos                         │
│     • Confirma horario (pre-poblado con hora actual)         │
│     • Tipo: Normal / Especial / Excursión                    │
│                                                              │
│  3. Sistema:                                                 │
│     • Genera ID único de sesión                              │
│     • Genera QR firmado (HMAC) con token de sesión           │
│     • Programa auto-refresh del QR cada N minutos            │
│     • Activa el Board en el Smart TV (si está conectado)     │
│     • Cambia estado de los alumnos a "Esperando"             │
│                                                              │
│  4. Staff ve su vista de control:                            │
│     • Lista de pickers con validación pendiente              │
│     • Puede ver estado de todos los alumnos de la sesión     │
│     • Botón "Cerrar sesión" para cuando termina              │
└──────────────────────────────────────────────────────────────┘
```

---

## TF-06 | Smart TV — Display del Board

**Actor**: Smart TV (pantalla en el portón)  
**Cuándo**: Desde que staff abre sesión hasta que la cierra  
**Sin interacción humana**: El Board es solo display

```
┌─ Smart TV carga /board/[sessionId] ─────────────────────────┐
│                                                              │
│  Display layout:                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PICKME  • Salida 14:30 • Martes 28 Oct               │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  [🐊🟡]Esperando  [🐻🔵]En proceso  [🐧🟢]Retirado✓  │ │
│  │  [🦊🔴]Esperando  [🦁🟠]Esperando  [🦭🟣]Esperando   │ │
│  │                                                        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Escanea para retirar a tu hijo/a:                     │ │
│  │         [██QR██]   Código: K7-4X2                      │ │
│  │  pickme.app/retirar                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Actualizaciones en tiempo real (Pusher):                   │
│  • Estado del alumno cambia → animación de transición        │
│  • QR se refresca automáticamente → fade out → fade in       │
│  • Si sesión se cierra → pantalla de "Sesión cerrada"        │
│                                                              │
│  Si no hay sesión activa:                                   │
│  → Pantalla de standby con logo de PickMe                   │
└──────────────────────────────────────────────────────────────┘
```

**Reglas del Board:**
- Solo muestra Layer 0 (Animal + Color)
- Nunca muestra nombres, iniciales, fotos
- No requiere autenticación (es público)
- El URL del board se configura una sola vez en el TV

---

## TF-07 | Picker — Flujo de retiro (happy path)

**Actor**: Picker  
**Precondición**: Está autorizado, hay sesión activa  
**Postcondición**: Alumno retirado, apoderado notificado

```
┌─ Picker llega al portón ─────────────────────────────────────┐
│                                                              │
│  1. Picker abre la cámara de su teléfono                     │
│     → Escanea QR del Smart TV                               │
│     → Se abre pickme.app/retirar?session=xxx en el browser   │
│     (o ingresa el código alfanumérico manualmente)           │
│                                                              │
│  2. Formulario en pantalla:                                  │
│     "¿A quién vienes a buscar?"                              │
│     [Campo de texto: nombre del alumno]                      │
│     [Buscar]                                                 │
│                                                              │
│  3. Sistema valida:                                          │
│     a) ¿Picker registrado? (por número de WhatsApp o sesión) │
│     b) ¿Autorizado para ese alumno?                          │
│     c) ¿Autorización vigente?                                │
│     d) ¿Hay restricciones activas?                           │
│                                                              │
│  → SI TODO OK:                                               │
│  4. Picker ve: "Validado ✓ — Espera a que el staff           │
│     confirme la entrega"                                     │
│     (pantalla de espera con spinner)                         │
│                                                              │
│  5. Staff recibe alerta (Layer 1):                           │
│     "[Nombre Picker] viene a buscar a S.M. (Avatar)"         │
│     "Autorizado por: Sofía M. • Vigente: Permanente"         │
│     [Confirmar entrega]                                      │
│                                                              │
│  6. Staff confirma visualmente que la persona coincide        │
│     → Toca "Confirmar entrega"                               │
│                                                              │
│  7. Sistema genera handover code de 6 dígitos                │
│     → Se muestra en el teléfono del PICKER                   │
│     → Staff ve input: "Ingresa el código que muestra         │
│       el picker para completar el traspaso"                  │
│                                                              │
│  8. Staff ingresa el código de 6 dígitos                     │
│     → Sistema valida (expira en 10 min, 1 solo uso)          │
│     → PickupEvent registrado con timestamp completo          │
│                                                              │
│  9. Board actualiza: alumno pasa a "Retirado ✓"             │
│     (Pusher event → animación en TV)                         │
│                                                              │
│  10. WhatsApp al apoderado:                                  │
│      "[Nombre alumno] fue retirado por [Picker] a las        │
│       14:35. ¿Confirmás que llegó bien? [Sí ✓] [Problema ⚠]"│
└──────────────────────────────────────────────────────────────┘
```

---

## TF-08 | Picker — Flujo de retiro (picker no autorizado)

**Actor**: Picker  
**Precondición**: NO está autorizado para ese alumno

```
┌─ Picker ingresa datos y el sistema rechaza ─────────────────┐
│                                                              │
│  Sistema detecta: picker no autorizado                       │
│                                                              │
│  Picker ve en pantalla:                                      │
│  "No estamos encontrando tu autorización para retirar a      │
│   este alumno. El apoderado debe autorizarte."               │
│  [Contactar apoderado]                                       │
│                                                              │
│  Staff recibe alerta (silenciosa, sin alarma visual):        │
│  "Intento no autorizado: [nombre] intentó retirar a [alumno] │
│   → No estaba en lista de autorizados"                       │
│  [Tomar nota del incidente] [Alertar apoderado ahora]        │
│                                                              │
│  Sistema registra el evento como UNAUTHORIZED_ATTEMPT        │
│  con timestamp, datos del intento, sessionId                 │
│                                                              │
│  Si el apoderado autoriza en tiempo real (TF-04):            │
│  → Picker recibe actualización: "Ahora estás autorizado.     │
│     Sigue el proceso."                                       │
│  → Flujo continúa desde el paso 4 de TF-07                  │
└──────────────────────────────────────────────────────────────┘
```

---

## TF-09 | Apoderado — Confirmación de llegada

**Actor**: Apoderado  
**Cuándo**: Después de que el picker retira al alumno (30 min de ventana)

```
┌─ Apoderado recibe WhatsApp ──────────────────────────────────┐
│                                                              │
│  "[Nombre] fue retirado por [Picker] a las 14:35.           │
│   ¿Confirmás que llegó bien?"                                │
│                                                              │
│  [Sí, llegó bien ✓]   [Hay un problema ⚠️]                  │
│                                                              │
│  HAPPY PATH:                                                 │
│  Apoderado toca "Sí, llegó bien"                             │
│  → PickupEvent.status = ARRIVED                              │
│  → Cadena de custodia cerrada ✓                              │
│                                                              │
│  NO CONFIRMACIÓN en 30 min:                                  │
│  → WhatsApp de recordatorio al apoderado                     │
│  → Si no responde en otros 15 min → alerta al Admin          │
│                                                              │
│  PROBLEMA:                                                   │
│  Apoderado toca "Hay un problema"                            │
│  → PickupEvent.status = ALERT                                │
│  → Se activa TF-10 (Protocolo de alerta)                     │
└──────────────────────────────────────────────────────────────┘
```

---

## TF-10 | Sistema — Protocolo de Alerta

**Actor**: Sistema (automático)  
**Trigger**: Cualquiera de los siguientes eventos

```
TRIGGERS DE ALERTA:
├── Apoderado presiona "Hay un problema"
├── Apoderado no confirma llegada en 45 minutos
├── Intento de retiro no autorizado (puede escalar)
└── [V2] GPS muestra desvío significativo de ruta

ACCIONES EN CASCADA:
1. PickupEvent.status → ALERT
   Registro inmutable del motivo, timestamp, actores involucrados

2. WhatsApp URGENTE a todos los Guardians del alumno:
   "⚠️ ALERTA — [Nombre alumno]: [descripción del problema]
    Contacta a la escuela: [teléfono de emergencia]"

3. Dashboard del Admin muestra alerta en rojo:
   Card con datos completos del incidente
   Botones: [Marcar como resuelto] [Exportar reporte] [Llamar apoderado]

4. [V2] Si GPS activo:
   WhatsApp al Picker: "¿Estás bien? Responde para confirmar."
   Si no responde en 5 min:
   → Escala a número de emergencia configurado por la escuela

RESOLUCIÓN:
Admin puede marcar el incidente como resuelto con nota.
El evento queda en el historial con status ALERT + nota de resolución.
```

---

## TF-11 | Staff — Cierre de sesión

**Actor**: Staff  
**Cuándo**: Al finalizar el horario de salida

```
┌─ Staff cierra la sesión ─────────────────────────────────────┐
│                                                              │
│  Staff ve resumen de la sesión:                              │
│  • X alumnos retirados                                       │
│  • X alumnos aún "Esperando" (no retirados en la sesión)    │
│  • X incidentes registrados                                  │
│                                                              │
│  Sistema alerta si hay alumnos sin retirar:                 │
│  "Hay X alumnos que aún no fueron retirados.                 │
│   ¿Confirmas el cierre de sesión?"                           │
│  [Sí, cerrar] [Mantener sesión abierta]                      │
│                                                              │
│  Al confirmar:                                               │
│  • PickupSession.status = CLOSED                             │
│  • QR del board se invalida                                  │
│  • Board muestra pantalla de "Sesión cerrada"                │
│  • Datos de la sesión son inmutables desde ese momento       │
│  • Admin puede generar reporte de la sesión                  │
└──────────────────────────────────────────────────────────────┘
```

---

## TF-12 | Admin — Gestión de incidentes

**Actor**: Admin (Sofía)  
**Cuándo**: Al revisar el dashboard o al recibir alerta

```
┌─ Admin accede a vista de incidentes ────────────────────────┐
│                                                              │
│  1. Dashboard muestra:                                       │
│     • Incidentes activos (en rojo)                           │
│     • Incidentes resueltos (en gris)                         │
│     • Intentos no autorizados (en amarillo)                  │
│                                                              │
│  2. Admin abre un incidente y ve:                            │
│     • Timeline completa del PickupEvent                      │
│     • Todos los actores involucrados (con nombres completos) │
│     • Historial de notificaciones enviadas                   │
│     • [V2] GPS track si aplicable                            │
│                                                              │
│  3. Admin puede:                                             │
│     • Agregar nota al incidente                              │
│     • Marcar como resuelto                                   │
│     • Exportar reporte (PDF / CSV) para evidencia            │
│     • Revocar autorización de un picker desde acá            │
│                                                              │
│  4. Exportación de logs:                                     │
│     • Por sesión                                             │
│     • Por alumno                                             │
│     • Por picker                                             │
│     • Por rango de fechas                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Resumen de Estados por Entidad

### PickupEvent.status

```
PENDING        → Picker escaneó QR, aún no confirmado por staff
IN_TRANSIT     → Handover code ingresado, apoderado aún no confirma
ARRIVED        → Apoderado confirmó llegada
ALERT          → Cualquier trigger de alerta activo
RESOLVED       → Alerta marcada como resuelta por Admin
```

### Student.pickupStatus (durante sesión)

```
WAITING        → Esperando ser retirado (Custodia: Escuela)
HANDOVER       → Picker validado en portón, staff realizando traspaso con Handover Code
IN_TRANSIT     → Retirado de la escuela, en viaje hacia el hogar con Enlace Mágico GPS (Custodia: Picker)
ARRIVED        → En casa, recepción confirmada por el apoderado vía WhatsApp (Custodia: Hogar)
```

### Authorization.status

```
ACTIVE         → Vigente según fechas definidas
EXPIRED        → Vencida por fecha
REVOKED        → Revocada manualmente por apoderado o admin
EMERGENCY      → Autorización de emergencia (un solo uso)
```
