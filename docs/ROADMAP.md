# PickMe — Hoja de Ruta

---

## Visión General

```
MVP (Fase 1)     → Flujo de retiro verificado, Board anónimo, cadena de custodia básica
V1 (Fase 2)      → Autorizaciones para eventos y excursiones, multi-salón
V2 (Fase 3)      → GPS tracking, bot WhatsApp con NLP, alertas automáticas
V3 (Fase 4)      → Multi-escuela, analytics, integraciones externas
```

---

## Fase 1 — MVP Testeable

**Objetivo**: Flujo completo de retiro de un alumno funciona de punta a punta en una sola escuela.  
**Criterio de éxito**: Sofía puede correr una sesión de salida real con el sistema.

### Módulo 1.1 — Fundación y Setup

- [ ] Setup del proyecto Next.js 15 con App Router
- [ ] Design tokens CSS + sistema de estilos base
- [ ] Schema de Prisma: Student, Guardian, Picker, Authorization, PickupSession, PickupEvent
- [ ] Seed de datos de prueba (escuela ficticia con 20 alumnos)
- [ ] Configuración de Pusher
- [ ] Configuración de Twilio WhatsApp sandbox

### Módulo 1.2 — Smart TV Board

- [ ] Vista `/board/[sessionId]` — layout full-screen para Smart TV
- [ ] Grid de alumnos con publicCode Animal+Color (Layer 0)
- [ ] Generación y display de QR de sesión
- [ ] QR con auto-refresh cada 5 minutos
- [ ] Estados en tiempo real: Esperando / En proceso / Retirado (via Pusher)
- [ ] Código alfanumérico fallback visible
- [ ] Animaciones de transición de estado

### Módulo 1.3 — Panel Admin

- [ ] Vista `/admin` — dashboard principal
- [ ] Gestión de alumnos: crear, editar, asignar publicCode
- [ ] Asignación de avatares (humanizado y animal)
- [ ] Gestión de salones
- [ ] Crear y abrir sesión de salida
- [ ] Ver historial de sesiones y eventos
- [ ] Ver y gestionar incidentes

### Módulo 1.4 — Portal del Apoderado

- [ ] Acceso por magic link (enviado por WhatsApp)
- [ ] Vista del alumno: avatar, publicCode, pickers autorizados
- [ ] Registro de nuevos pickers (nombre, WhatsApp, relación, vigencia)
- [ ] Flujo de autorización de emergencia (picker no registrado, en tiempo real)
  - [ ] Confirmación simple (botón + timestamp)
  - [ ] Micro-grabación de video (opción para colegios con requisito legal mayor)
- [ ] Historial de retiros del alumno

### Módulo 1.5 — Flujo del Picker

- [ ] Vista `/retirar` — accesible sin login
- [ ] Ingreso de código de sesión (fallback sin cámara)
- [ ] Formulario: "¿A quién vienes a buscar?"
- [ ] Validación de autorización en backend
- [ ] Display del handover code de 6 dígitos
- [ ] Pantalla de espera mientras el staff confirma
- [ ] Pantalla de error si no está autorizado

### Módulo 1.6 — Vista Staff

- [ ] Vista `/staff` — autenticada con login de staff
- [ ] Lista de pickers con validación pendiente (en tiempo real, via Pusher)
- [ ] Card de validación: picker + alumno (Layer 1) + estado de autorización
- [ ] Botón "Confirmar entrega"
- [ ] Input de handover code para cerrar el traspaso
- [ ] Historial de retiros de la sesión activa

### Módulo 1.7 — Notificaciones WhatsApp y Enlace Mágico GPS

- [ ] Integración transaccional con Twilio / WhatsApp Cloud API (1 a 1)
- [ ] Notificación al apoderado cuando el picker llega al colegio y pide al alumno
- [ ] Notificación de retiro completado tras validar el Handover Code de 6 dígitos
- [ ] Generación de Enlace Mágico Web (`/viaje?token=...`) para el Picker/Chofer:
  - [ ] Captura periódica de coordenadas mediante HTML5 Geolocation (`watchPosition`)
  - [ ] Cero descargas de apps nativas para el chofer o apoderado
- [ ] Mensaje interactivo al apoderado con mapa de seguimiento y botones de confirmación:
  - [ ] Botón "Llegó bien ✓" (Cierre de custodia legal)
  - [ ] Botón "Reportar anomalía ⚠️"
- [ ] Protocolo de alerta automática si pasan 30 minutos sin confirmación de llegada

### Módulo 1.8 — Cadena de Custodia Activa (4 Estados)

- [ ] Modelo de 4 estados: `WAITING` (Escuela) ➔ `HANDOVER` (Puerta) ➔ `IN_TRANSIT` (Picker/Ruta) ➔ `ARRIVED` (Hogar)
- [ ] Registro inmutable de cada PickupEvent con timeline completa y coordenadas GPS de ruta
- [ ] Vista de auditoría en panel Admin
- [ ] Exportación de logs legales por sesión (CSV / PDF)

---

## Fase 2 — V1: Expansión de Funcionalidades

**Objetivo**: PickMe es usado regularmente por la escuela, con más tipos de eventos.

### Módulo 2.1 — Autorizaciones para Eventos

- [ ] Flujo de autorización para excursiones y eventos especiales
- [ ] Envío masivo de solicitud de autorización por WhatsApp (a todos los apoderados del salón)
- [ ] Dashboard de estado: quién autorizó, quién falta
- [ ] Recordatorios automáticos a apoderados que no han respondido

### Módulo 2.2 — Gestión Avanzada de Pickers

- [ ] Autorizaciones recurrentes (ej: "todos los lunes")
- [ ] Autorización por rango de fechas con vencimiento automático
- [ ] Perfil del picker con foto de referencia (opcional, para uso del staff)
- [ ] Blacklist de personas no autorizadas con alerta al intentar retirar

### Módulo 2.3 — Multi-salón

- [ ] Una sesión puede incluir uno o varios salones
- [ ] Filtro en el Board por salón
- [ ] Permisos de staff por salón

### Módulo 2.4 — Dashboard de Sofía (Analytics)

- [ ] Métricas de retiro: tiempo promedio, pickers frecuentes, incidentes por período
- [ ] Reporte de alumnos que nunca fueron retirados a tiempo
- [ ] Exportación de reportes para presentar a dirección o apoderados

---

## Fase 3 — V2: Tracking y Bot Conversacional

**Objetivo**: PickMe conoce la ruta del alumno desde el colegio hasta el hogar.

### Módulo 3.1 — GPS Tracking

- [ ] Link de tracking compartido con apoderado cuando picker sale del colegio
- [ ] Picker comparte ubicación vía Web Geolocation API (sin instalar nada)
- [ ] Visualización en mapa para el apoderado en tiempo real
- [ ] Detección automática de llegada al homeAddress (radio configurable, default 100m)
- [ ] Confirmación automática sugerida al apoderado cuando GPS entra en radio
- [ ] Protocolo de alerta si GPS se desvía significativamente de la ruta esperada

### Módulo 3.2 — Bot WhatsApp con NLP

- [ ] Picker puede responder al bot de WhatsApp para identificar al alumno
  - Ej: "Vengo a buscar a Sofía Martínez" → bot hace match y retorna validación
- [ ] Apoderado puede autorizar directamente respondiendo al bot
- [ ] Respuestas de confirmación de llegada via botones interactivos de WhatsApp
- [ ] Bot maneja preguntas frecuentes del apoderado

### Módulo 3.3 — Alertas Automáticas por GPS

- [ ] Alerta al apoderado si ruta es inusual
- [ ] Protocolo de confirmación: bot le pregunta al picker "¿Estás bien?"
- [ ] Escalación a número de emergencia si no hay respuesta en 5 minutos
- [ ] Registro del incidente con GPS track completo para auditoría

---

## Fase 4 — V3: Plataforma Multi-Escuela

**Objetivo**: PickMe puede venderse o implementarse en múltiples colegios.

### Módulo 4.1 — Multi-Tenancy

- [ ] Una instancia de PickMe soporta múltiples escuelas
- [ ] Aislamiento completo de datos entre escuelas
- [ ] Admin de escuela vs. Super Admin de plataforma
- [ ] Onboarding self-service para nuevas escuelas

### Módulo 4.2 — Integraciones Externas

- [ ] Integración con sistemas de gestión escolar (importar alumnos y apoderados)
- [ ] Webhooks configurables para integraciones personalizadas
- [ ] API pública documentada

### Módulo 4.3 — Configuración Avanzada de Privacidad

- [ ] Escuelas pueden definir su política de retención de datos
- [ ] Anonimización automática después de período configurable
- [ ] Exportación de datos por apoderado (GDPR / LGPD compliance)
- [ ] Destrucción segura de datos de alumnos al egresar

---

## Timeline Orientativo

```
Semana 1-2    Módulos 1.1 + 1.2 (Fundación + Board)
Semana 3      Módulos 1.3 + 1.4 (Admin + Apoderado)
Semana 4      Módulos 1.5 + 1.6 (Picker + Staff)
Semana 5      Módulos 1.7 + 1.8 (WhatsApp + Auditoría)
Semana 6      QA, ajustes, prueba piloto con Sofía
─────────────────────────────────────────────────
Semana 7-10   Fase 2 (V1)
Semana 11-16  Fase 3 (V2 con GPS)
Semana 17+    Fase 4 (multi-escuela)
```

---

## Decisiones de Arquitectura por Fase

| Decisión | MVP | V2 | V3 |
|---|---|---|---|
| WhatsApp API | Twilio sandbox | Meta Cloud API | Meta Cloud API |
| Auth apoderado | Magic link | Magic link | SSO opcional |
| GPS | No incluido | Web Geolocation | Web Geolocation |
| Bot WhatsApp | No incluido | NLP básico (Twilio Studio) | NLP avanzado |
| Infraestructura | Vercel + Supabase | Vercel + Supabase | Railway o AWS |
| Multi-tenant | No | No | Sí |
