# PickMe — Hoja de Ruta (Roadmap)

**Versión**: 1.0 — MVP Funcional  
**Estado**: Activo  
**Última actualización**: Noviembre 2026  

---

## Fases del Proyecto

```
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 0: Arquitectura Base, Dockerización & Modelo de Datos             │
│  [X] Migración de prototipo inicial a POC/                             │
│  [X] Actualización y alineación de PRD, SDD y Roadmap                  │
│  [ ] Configuración Docker multi-stage (Next.js standalone + Postgres)  │
│  [ ] Prisma Schema definitivo con migraciones y seed de prueba         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 1: Core de Custodia, Dashboard de Sofía & Sandbox Demo            │
│  [ ] Hito 1: Autenticación Google OAuth para Administradora (Sofía)    │
│  [ ] Hito 2: Dashboard Escolar (Colegio, Sedes, Salones, Horarios)     │
│  [ ] Hito 3: Modo Simulación / Sandbox interactivo para Sofía          │
│  [ ] Hito 4: Display Smart TV pasivo y anónimo (/board/[sessionId])    │
│  [ ] Hito 5: Flujo de Picker móvil (/retirar)                          │
│  [ ] Hito 6: Consola de entrega Staff con Handover Code (/staff)       │
│  [ ] Hito 7: Emulador visual interactivo de WhatsApp (sin Twilio MVP)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 2: Operación Piloto y Notificaciones Reales (V1)                  │
│  [ ] Conector Twilio WhatsApp real (salida de sandbox)                 │
│  [ ] Magic links vía SMS/WhatsApp para Apoderados                      │
│  [ ] Gestión avanzada de Pickers recurrentes y temporales              │
│  [ ] Reportes de auditoría legal y exportación CSV de sesiones         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 3: Geocercas y Tracking sin App (V2)                              │
│  [ ] Web Geolocation streaming en navegador móvil del picker           │
│  [ ] Detección automática de radio de 100m al hogar                    │
│  [ ] Protocolo de alerta por desvío de ruta                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Detalle de Hitos Inmediatos (Fase 0 y Fase 1)

### Hito 0.1 — Entorno Docker y Persistencia
- [ ] Dockerfile multi-stage optimizado para Next.js 16 con `output: 'standalone'`.
- [ ] `docker-compose.yml` con servicios `web` (Next.js) y `db` (PostgreSQL 16) con healthcheck.
- [ ] Variables de entorno `.env.example` limpias.

### Hito 0.2 — Modelo de Datos (Prisma)
- [ ] Archivo `prisma/schema.prisma` implementando la taxonomía: School, User, Classroom, Student, Guardian, Picker, Authorization, PickupSession, PickupEvent, Incident.
- [ ] Migración inicial `init` ejecutada dentro de PostgreSQL.
- [ ] Script de Seed con colegio de prueba ("Escuela Primaria San Martín") con 20 alumnos en 2 cursos.

### Hito 1.1 — Arquitectura de Información y Scaffolding UI
- [ ] Estructura limpia en `src/` con carpetas:
  - `src/components/ui/` (Átomos y componentes base).
  - `src/components/board/` (Componentes del Smart TV pasivo).
  - `src/components/staff/` (Componentes de validación de entrega).
  - `src/components/simulator/` (Consola de simulación y emulador WhatsApp).
- [ ] Tokens de diseño consolidados (`globals.css`).

### Hito 1.2 — Dashboard de Sofía y Onboarding Sandbox
- [ ] Login con Google OAuth.
- [ ] Vista de configuración de salones y turnos.
- [ ] Botón de "Validar dinámica de retiro" (Sandbox interactivo).

### Hito 1.3 — Display Smart TV (/board/[sessionId])
- [ ] Layout pasivo full-screen para Smart TV.
- [ ] Generación de QR nativa con `qrcode.react` (sin APIs externas).
- [ ] Sincronización en tiempo real de estados de alumnos (Pusher).

### Hito 1.4 — Flujo del Picker y Consola de Staff
- [ ] Vista móvil `/retirar` (sin login, optimizada para celular).
- [ ] Vista `/staff` con tarjeta de validación de identidad y teclado de Handover Code.
