# PRD — PickMe: Gestión de Salida Escolar

**Versión:** 2.0  
**Estado:** En desarrollo activo  
**Documento técnico relacionado:** [SDD.md](SDD.md)

---

## 1. Problema y oportunidad

El proceso de retiro escolar es uno de los momentos de mayor riesgo y fricción en la operación diaria de un colegio. Los métodos actuales —listas en papel, comunicación verbal, registros manuales— generan:

- **Incidentes de seguridad**: alumnos entregados a personas no autorizadas.
- **Cuellos de botella**: filas y confusión en portería durante el peak de salida.
- **Falta de trazabilidad**: sin registro auditable de quién retiró a quién, cuándo y con qué autorización.
- **Carga operativa en admisión**: llamadas telefónicas para verificar autorizaciones o informar cambios de último minuto.

**La oportunidad:** digitalizar y auditar todo el flujo de retiro sin requerir apps nativas ni capacitación técnica significativa para ningún actor (apoderado, portero, director).

---

## 2. Restricciones no negociables

| Restricción | Razón |
|---|---|
| Sin apps nativas (iOS/Android) | Adopción inmediata; cero fricciones de instalación |
| Sin Tailwind ni frameworks CSS externos | CSS Modules para control total y bundle mínimo |
| Privacidad por capas | Pickers anónimos; datos sensibles solo visibles con contexto |
| Multi-tenant estricto | Cada colegio es un workspace aislado; `schoolId` en cada entidad |
| Sin almacenamiento de contraseñas | Staff usa Google OAuth; próximamente invitation link con token |
| Despliegue serverless | Vercel + Neon; sin infraestructura propia que mantener |

---

## 3. Personas

> Las personas son arquetipos de usuario, no cuentas del sistema.

### Sofía — Directora / School Admin
- **Rol en el sistema:** `SCHOOL_ADMIN`
- **Acceso:** `/admin/*`
- **Motivación:** mantener el colegio seguro y reducir incidentes en portería.
- **Dolores:** no sabe en tiempo real cuántos alumnos quedan por retirar; los registros en papel no sirven de evidencia.
- **Tareas principales:** configurar el colegio, gestionar nómina de alumnos, marcar asistencia diaria, abrir/cerrar jornadas, revisar auditoría forense, gestionar personal de portería.

### Carlos — Portero / Staff
- **Rol en el sistema:** `STAFF`
- **Acceso:** `/staff`
- **Motivación:** despachar alumnos rápido y sin errores; no quiere responsabilidad legal por una entrega incorrecta.
- **Dolores:** no puede verificar autorizaciones al vuelo; los apoderados se acumulan en la reja.
- **Tareas principales:** ver cola de retiros en tiempo real, validar OTP del apoderado, confirmar handover.

### Ignacio — Apoderado / Picker
- **Rol en el sistema:** Anónimo
- **Acceso:** `/retirar`, `/board`
- **Motivación:** retirar a su hijo rápido sin hacer fila ni tener que hablar con nadie si no es necesario.
- **Dolores:** no sabe si el colegio sabe que ya llegó; a veces manda a un familiar y no sabe cómo autorizarlo.
- **Tareas principales:** anunciar su llegada, recibir OTP, consultar el board de estado.

---

## 4. Épicas de producto

### E1 — Workspace multi-tenant (crear colegio, invitar staff)
**Estado:** Implementado

- Creación de workspace de colegio con datos básicos (nombre, dirección, teléfono de emergencia, timezone, horario de salida).
- El primer usuario del workspace adquiere rol `SCHOOL_ADMIN`.
- Admin gestiona personal de portería desde `/admin/staff` mediante registro directo o invitación por token temporal (48h/7d).
- Sistema de estados de usuario: `UserStatus` (`PENDING` → `ACTIVE` → `SUSPENDED`).
- Modelo `Invitation` con token UUID de un solo uso.

### E2 — Onboarding bifurcado Admin / Staff
**Estado:** Implementado (`/onboarding`, `/staff/join`)

- `/onboarding`: flujo guiado donde el usuario escoge su rol:
  - **Director**: deriva a `/admin/onboarding` para fundar el workspace escolar.
  - **Staff**: deriva a `/staff/join` para vincularse o aceptar su invitación.
- `/staff/join`: el staff accede con su enlace de invitación (`?token=...`) y se vincula en un click, o envía una solicitud a un colegio registrado.
- El token de invitación actúa como factor de vinculación temporal sin necesidad de gestionar contraseñas manuales.

### E3 — Gestión de nómina y asistencia diaria
**Estado:** Implementado

- Admin crea aulas (`Classroom`: grado + sección) y alumnos (`Student`) en `/admin/cursos`.
- Cada alumno tiene un identificador visual: animal + color (sin foto).
- Antes de abrir la jornada, admin marca asistencia: `ACTIVE` (presente) / `ABSENT` (ausente) por alumno.
- Solo los alumnos `ACTIVE` participan en la jornada de salida.

### E4 — Jornada de salida (apertura manual + automática)
**Estado:** Implementado

- Admin abre jornada manualmente desde `/admin`: crea `PickupSession(OPEN)` y un `PickupEvent(WAITING)` por cada alumno `ACTIVE`.
- **Acción explícita "Send / Sincronizar"**: Botón directo en la barra de control de `/admin/cursos` para aperturar la salida con un click o sincronizar la nómina viva.
- **Horario automático multizona**: `School.defaultExitTime` y `School.timezone` configurables. Endpoint `GET /api/cron/auto-open-sessions` (bearer `CRON_SECRET`) abre la sesión a la hora exacta en el huso horario local de la institución.
- Admin puede cerrar la jornada manualmente; al cierre se genera el log forense.

### E5 — Lista viva de custodia (con llegadas tardías)
**Estado:** Implementado

- El board `/board/[sessionId]` muestra el estado de cada `PickupEvent` en tiempo real (polling 5 s).
- Estados: `WAITING → IN_PROCESS → HANDOVER → IN_TRANSIT → ARRIVED`.
- **Llegadas tardías (`addLateArrivalToSessionAction`)**: si un alumno ausente llega tarde y es marcado `ACTIVE` durante una jornada abierta, se incorpora automáticamente a la cola de salida de portería sin reiniciar la jornada.
- Integración de QR interactivo directo en el Smart TV Board enlazando a `/retirar?session=${sessionCode}`.

### E6 — Smart TV Board con PIN
**Estado:** Implementado

- `/board` es de acceso público (sin login).
- Proyectable en TV de portería o salas de espera.
- Muestra estado consolidado de todos los alumnos de la jornada activa.
- PIN de sesión para acceso al board de una jornada específica.

### E7 — Cadena de custodia (OTP handover)
**Estado:** Implementado

- Picker accede a `/retirar` y anuncia que viene a buscar al alumno.
- Sistema genera OTP de 6 dígitos (`handoverCode`) con expiración (`handoverExpiry`).
- Staff valida OTP en `/staff` → el `PickupEvent` avanza a `IN_TRANSIT`.
- En caso de alerta: se crea un `Incident`.

### E8 — Registro forense
**Estado:** Implementado

- Al cerrar la jornada, se genera un log `.txt` estructurado con todos los `PickupEvent` de la sesión.
- El archivo incluye hash SHA-256 para verificación de integridad.
- Disponible en `/admin/auditoria`.

### E9 — Panel Staff con link al Board TV
**Estado:** Implementado

- `/staff` incluye enlace directo al Board TV de la sesión activa.
- Cola de retiros con polling automático cada 5 s.
- Staff ve: alumno, estado, picker, código OTP pendiente de validar.

---

## 5. Restricciones de diseño

| Área | Decisión |
|---|---|
| **Estilos** | CSS Modules exclusivamente. Sin Tailwind, sin styled-components |
| **Plataforma** | Web responsiva. Sin apps iOS/Android |
| **Privacidad** | Pickers son anónimos en la capa pública. `idDocumentHash` para identificación interna |
| **Tiempo real** | Polling cada 5 s. Sin WebSockets ni servicios de terceros de tiempo real |
| **Autenticación** | Google OAuth para admin y staff. Sin contraseñas almacenadas |
| **Datos escolares** | Multi-tenant estricto: ninguna query cruza workspaces |

---

## 6. Métricas de éxito

| Métrica | Objetivo |
|---|---|
| Tiempo medio de handover (anuncio → IN_TRANSIT) | < 3 minutos |
| Incidentes de entrega no autorizada | 0 durante jornadas con PickMe activo |
| Adopción de staff | ≥ 90 % de porteros usan el sistema desde el primer día |
| Uptime durante jornada de salida | ≥ 99.5 % |
