# PickMe — Product Requirements Document (PRD)

**Versión**: 0.1 — MVP  
**Fecha**: Octubre 2026  
**Estado**: En definición  

---

## 1. Contexto y Problema

### Contexto

Sofía coordina una escuela primaria de 300 alumnos. Todos los padres usan WhatsApp. Nadie instala apps nuevas — la escuela lo intentó y falló.

### Problemas actuales

| # | Problema | Impacto |
|---|---|---|
| P1 | No hay registro de personas autorizadas para recoger alumnos | Las maestras no saben qué hacer cuando llega alguien desconocido |
| P2 | Las autorizaciones en papel se pierden en las mochilas | Faltan firmas el día del evento |
| P3 | No hay cadena de custodia registrada | Sin trazabilidad si ocurre un incidente |
| P4 | Datos de alumnos expuestos (nombre en pizarrón público) | Riesgo de privacidad de menores |

---

## 2. Objetivo del Producto

PickMe digitaliza el proceso de retiro escolar creando:

1. **Un registro de pickers autorizados** — quién puede buscar a quién
2. **Una cadena de custodia verificada** — del colegio al hogar, con confirmaciones
3. **Un display anónimo para el portón** — sin exponer datos de menores
4. **Confirmación legal del apoderado** — aprobación con validez jurídica

### Restricciones no negociables

- ❌ Los padres **no instalan ninguna app nueva**
- ✅ Todo funciona en el navegador del teléfono o WhatsApp
- ✅ El display del portón es público pero anónimo
- ✅ La autorización del **apoderado** es la que tiene validez legal (no la del picker)

---

## 3. Usuarios y Roles

### 3.1 Admin (Sofía)

**Quién**: Coordinadora o directora del colegio.  
**Necesita**: Gestionar alumnos, sesiones, ver trazabilidad de incidentes.  
**Accede**: Dashboard web con login.

### 3.2 Apoderado

**Quién**: Padre, madre o tutor legal del alumno.  
**Necesita**: Registrar quién puede buscar a su hijo, ser notificado del retiro, confirmar llegada.  
**Accede**: Link mágico por WhatsApp, sin contraseña. Sin instalar nada.  
**Autorización legal**: Su confirmación (o micro-grabación) tiene validez legal para la escuela.

### 3.3 Picker

**Quién**: Chofer, nana, familiar, babysitter.  
**Necesita**: Poder identificarse en el portón para retirar al alumno.  
**Accede**: Escanea QR del Smart TV → link web se abre en su teléfono. Sin instalar nada.

### 3.4 Staff / Entregador

**Quién**: Maestra, auxiliar, funcionario que hace la entrega física en el portón.  
**Necesita**: Saber si el picker está autorizado, ejecutar el traspaso con el handover code.  
**Accede**: Web app en tablet o smartphone, con login de staff.

### 3.5 Smart TV Board

**Qué es**: Pantalla pública en el portón de salida.  
**Muestra**: Alumnos esperando en formato anónimo (Animal + Color) + QR de sesión.  
**No muestra**: Nombres, fotos, iniciales, ningún dato identificable.

---

## 4. Sistema de Anonimato (Privacy by Design)

El sistema protege los datos de menores con tres capas según el contexto:

### Layer 0 — Display público (Smart TV)
- Identificador: **Animal + Color** (ej: "Cocodrilo Amarillo")
- Único por salón (no puede repetirse dentro del mismo grupo)
- No hay nombres, fotos ni iniciales visibles

### Layer 1 — Vista Staff (dispositivo autenticado)
- Identificador: **Avatar personalizado + Iniciales** (ej: "S.M.")
- Solo visible en dispositivos con sesión de staff activa

### Layer 2 — Vista Admin / Apoderado (login verificado)
- Identificador: **Nombre completo + Avatar**
- Solo accesible tras autenticación

### Sistema de Avatares

**Opción A — Avatar Humanizado** (configurable por apoderado)
- Género: niño / niña / neutro
- Cabello: 6 colores
- Ropa: 8 colores
- Tono de piel: 5 opciones

**Opción B — Avatar Animal** (default del sistema)
- ~20 animales disponibles
- Color asignado aleatoriamente, persistente
- Combinación única dentro del mismo salón

**Opción C — Código Numérico** (opt-in por escuela, máximo anonimato)
- El alumno se identifica con un número de 4 dígitos

---

## 5. Flujos de Producto

### 5.1 Setup Inicial — Admin

1. Admin crea la escuela en PickMe
2. Carga alumnos (CSV o manual): nombre, salón, iniciales, homeAddress (coords)
3. Sistema asigna publicCode único (Animal + Color) a cada alumno por salón
4. Sistema envía WhatsApp de invitación a cada apoderado con magic link
5. Apoderado configura su perfil y personaliza el avatar de su hijo (opcional)

### 5.2 Registro de Picker — Apoderado

1. Apoderado abre su link de PickMe (no instala nada)
2. Ingresa datos del Picker: nombre, WhatsApp, relación (familiar / chofer / etc.)
3. Define tipo de autorización:
   - **Permanente**: siempre autorizado
   - **Fecha puntual**: solo ese día
   - **Rango de fechas**: período de tiempo
4. Sistema envía WhatsApp al Picker confirmando su registro
5. Picker queda en el sistema listo para operar

### 5.3 Autorización de Emergencia — Apoderado en tiempo real

Si el apoderado necesita autorizar a alguien que no estaba registrado:

1. Apoderado abre su link de PickMe
2. Toca "Autorizar ahora" — flujo express
3. Ingresa nombre y WhatsApp del picker de emergencia
4. **Confirma su autorización** mediante:
   - Opción A (default): Botón de confirmación con registro de timestamp + IP + device
   - Opción B (recomendada para colegios con requisito legal mayor): Micro-grabación de video (5-10 segundos) del apoderado diciendo quién autoriza y para qué
5. Sistema notifica al Staff que hay un picker de emergencia autorizado
6. El picker de emergencia recibe link con QR temporal de un solo uso

> **Validez legal**: La autorización del apoderado —ya sea confirmación digital o micro-grabación— es la que tiene validez para la escuela. La sola presencia del picker no basta.

### 5.4 Sesión de Salida — Staff abre sesión

1. Staff abre web app y crea nueva sesión de salida
2. Selecciona tipo: salida normal / salida especial / excursión
3. Sistema genera:
   - **QR único de sesión** (firmado, expira en N minutos, configurable)
   - **Código alfanumérico** de fallback (para quienes no tienen cámara)
4. Smart TV muestra el Board con QR + lista de alumnos en Layer 0

### 5.5 Flujo de Retiro — Picker

```
PASO 1 — Llegada al colegio
  Picker escanea QR del Smart TV
  → Se abre link web en su teléfono (sin instalar nada)
  → O ingresa código alfanumérico en pickme.app/retirar

PASO 2 — Identificación del alumno
  Picker escribe el nombre del alumno que viene a buscar
  [V2: también puede decírselo al bot de WhatsApp]

PASO 3 — Validación de seguridad (backend)
  Sistema verifica:
  ├── ¿Picker está registrado?
  ├── ¿Está autorizado para ESE alumno?
  ├── ¿La autorización está vigente (fecha)?
  └── ¿Hay alguna restricción activa?

  Si OK:
  → Notifica al Staff con datos del picker y del alumno (Layer 1)
  → El estado del alumno en el Board cambia a "En proceso" (Layer 0)

  Si NO OK:
  → Picker recibe mensaje: "No estás autorizado. Contacta al apoderado."
  → Staff recibe alerta de intento no autorizado

PASO 4 — Confirmación del Staff
  Staff ve en su tablet:
  "Picker [Nombre Completo] viene a buscar a [Iniciales + Avatar]"
  "Autorizado por [Apoderado]. Vigente hasta [fecha]"
  → Staff confirma visualmente que la persona coincide con quien aparece

PASO 5 — Handover Code y Traspaso Físico
  Sistema genera código de 6 dígitos
  → Picker lo ve en su teléfono
  → Staff lo ingresa en su tablet para confirmar el traspaso físico
  → Evento queda registrado: staff + picker + alumno + timestamp
  → Alumno pasa de FASE 2 (HANDOVER) a FASE 3 (IN_TRANSIT / En Proceso de Custodia)

PASO 6 — Activación de Ruta y Tracking GPS (Sin descargar apps)
  1. WhatsApp envía enlace mágico al Picker/Chofer:
     "Retiro confirmado. Inicia viaje aquí: pickme.app/viaje?t=[token]"
  2. El Picker abre el enlace en su navegador móvil (Chrome/Safari).
     → Otorga permiso nativo de ubicación (1 tap).
     → HTML5 Geolocation (`navigator.geolocation.watchPosition`) transmite coordenadas periódicas al backend.
     → [Técnica]: Se supera la limitación de Meta WhatsApp API (que no permite streaming de Live Location en bots) sin exigir descarga de apps nativas.
  3. WhatsApp notifica al Apoderado:
     "📍 [Nombre Alumno] fue retirado por [Picker] a las [HH:MM]. Va en camino a casa.
      Puedes seguir la ruta aquí: pickme.app/seguimiento?t=[token]
      ¿Confirmas que llegó bien? [Sí, llegó ✓] [Reportar incidente ⚠️]"

PASO 7 — Confirmación de llegada y Cierre de Custodia (FASE 4: ARRIVED)
  → Si el apoderado confirma por WhatsApp o la geocerca de destino detecta llegada:
     - El alumno pasa a ARRIVED (Luz Verde Definitiva).
     - Se desactiva el streaming de ubicación.
     - Queda sellada la cadena de custodia completa en base de datos.
  → Si transcurren 30 min sin confirmación o se detecta desvío fuera de ruta:
     - Alerta roja automática a Sofía (Staff) y al Apoderado vía WhatsApp.
```

### 5.6 Ciclo de Vida de Custodia Activa (4 Estados)

| Estado | Ubicación | Responsable Legal | Canal / Tecnología |
|---|---|---|---|
| **1. En Espera (`WAITING`)** | Salón / Patio escolar | Escuela / Docentes | Smart TV Board (Capa 0) |
| **2. En Entrega (`HANDOVER`)** | Portón de salida | Staff en puerta | Tablet Staff + Handover Code 6 dígitos |
| **3. En Proceso / Tránsito (`IN_TRANSIT`)** | En camino al hogar | Picker / Transporte | Enlace Mágico Web (HTML5 Geolocation) |
| **4. En Casa / Confirmado (`ARRIVED`)** | Domicilio | Apoderado titular | Bot WhatsApp (Cierre legal de custodia) |

### 5.6 Protocolo de Alerta

**Triggers:**
- Picker no autorizado intenta retirar a un alumno
- Apoderado no confirma llegada en el tiempo configurado
- Apoderado presiona "Hay un problema"
- [V2] GPS muestra desvío significativo de ruta

**Acciones en cascada:**
1. WhatsApp de alerta a todos los apoderados del alumno
2. Alerta en dashboard del Admin (Sofía)
3. Registro del incidente con toda la timeline
4. [V2] Mensaje al Picker: "¿Estás bien?" con opciones de respuesta
5. Si no hay respuesta en 5 min → escala a número de emergencia de la escuela

---

## 6. Modelo de Datos (Resumen)

```
Student         → id, avatar, publicCode, initials, grade, classroom, homeAddress
Guardian        → id, whatsappNumber, name, students[]
Picker          → id, whatsappNumber, name, idDocumentHash, authorizedFor[]
Authorization   → pickerId, studentId, guardianId, type, expiry, legalProof
PickupSession   → id, date, school, qrCode, qrExpiresAt, status
PickupEvent     → id, sessionId, studentId, pickerId, staffId,
                  handoverCode, timeline{}, status, gpsTrack[]
Incident        → id, eventId, type, triggeredAt, resolvedAt, notes
```

Ver schema completo → `prisma/schema.prisma` (cuando se cree)

---

## 7. Requisitos No Funcionales

| Requisito | Especificación |
|---|---|
| Sin app para padres | Todo en browser / WhatsApp |
| Privacidad de menores | Ningún nombre o foto visible públicamente |
| Disponibilidad | Board disponible durante horario de salida |
| Latencia real-time | Estado del Board actualizado en < 2 segundos |
| Seguridad del QR | Firmado con HMAC, expira por tiempo y por sesión |
| Handover code | 6 dígitos, expira en 10 minutos, un solo uso |
| Validez legal | Autorización del apoderado es el acto legal (con timestamp + opción de micro-grabación) |
| Auditoría | Todo evento de retiro es inmutable y auditable |

---

## 8. Fuera de Alcance (MVP)

- ❌ GPS tracking automático (V2)
- ❌ Bot conversacional con NLP (V2)
- ❌ Calificaciones y tareas (fuera de scope del producto)
- ❌ Autorizaciones para eventos / excursiones (V2, usa el mismo motor)
- ❌ Multi-escuela (V2)
