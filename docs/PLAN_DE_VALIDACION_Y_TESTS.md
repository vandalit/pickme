# PickMe — Plan de Validación, Coherencia UX y Suite de Pruebas

**Versión**: 2.0  
**Fecha**: 6 de Noviembre, 2026  
**Regla de Oro**: Commits locales pequeños y verificados — *Prohibido ejecutar `git push`*.  
**Objetivo**: Validar metódicamente cada flujo, punto de contacto y regla de negocio para asegurar que PickMe sea un SaaS completamente funcional y robusto, eliminando cualquier residuo de maqueta desconectada.

> Para registrar pruebas manuales y resultados de cada sesión, usar el [Checklist operativo de validación del MVP](CHECKLIST_VALIDACION_MVP.md). Este documento conserva el plan funcional original.

> **Aviso de vigencia:** las cuentas y datos de ejemplo descritos en la matriz histórica de más abajo no están confirmados como existentes ni como seguros para probar. No recrearlos en Neon/Production. Usar la matriz de entornos y datos de prueba de [DECISIONES_ARQUITECTURA.md](DECISIONES_ARQUITECTURA.md).

---

## 1. Principios de Validación del Ecosistema

1. **Separación Estricta de Entornos**:
   - El **Sandbox de Simulación** (`/admin/simulador`) corre únicamente en memoria local con datos de Sofía Valenzuela / Colegio San Martín. No abre ventanas a rutas de producción de PostgreSQL.
   - La **Operación desplegada en Vercel** (`/admin`, `/board/[sessionId]`, `/staff`, `/retirar`) usa el PostgreSQL Neon configurado para ese entorno. La validación local usa PostgreSQL Docker separado; no asumir que ambas bases tienen los mismos datos.
   - Antes de probar login o consistencia de datos, completar la matriz local / Vercel Preview / Vercel Production del [checklist](CHECKLIST_VALIDACION_MVP.md). La URL de Vercel debe verificarse en su dashboard.
2. **Cero Pantallas Vacías o Descontextualizadas**:
   - Toda ruta compartible debe validar la existencia y vigencia de la sesión escolar (`SessionStatus = 'OPEN'`).
   - El Home (`/`) no debe exponer enlaces huérfanos a sesiones hardcodeadas.
3. **Consistencia de Capas de Privacidad**:
   - **Capa 0 (Patio / TV)**: 100% anónima (*Animal + Color* único, sin nombres ni fotos).
   - **Capa 1 (Portón / Móvil)**: Solo iniciales del alumno, nombre del retirador y código de 6 dígitos.
   - **Capa 2 (Dirección)**: Nombres completos, apoderados, teléfonos y libro de auditoría forense con hash SHA-256.

---

## 2. Hoja de Ruta de Pruebas y Validación Paso a Paso

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HOJA DE RUTA DE VALIDACIÓN                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ PASO 1: Validación y Aislamiento del Sandbox (/admin/simulador)              │
│ • Confirmar que el encabezado no exponga links a producción.                │
│ • Validar la transición en memoria de las 4 etapas (Split-view).            │
│ • Estado: COMPLETADO (Commit 34f9745)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ PASO 2: Coherencia de Accesos en el Home (/)                                │
│ • Auditar la barra de navegación del Landing.                               │
│ • Eliminar enlaces hardcodeados (/board/SAN-1024, /staff sin sesión).       │
│ • Dejar CTAs coherentes: "Acceso Colegio" (/auth/login) y "Simulador".      │
│ • Permitir input de "Código de Portón" si un apoderado entra desde la web.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ PASO 3: Validación de Cursos y Alumnos (/admin/cursos)                      │
│ • Test A: Creación manual de alumnos en PostgreSQL (verificar avatar único).│
│ • Test B: Importación masiva usando public/nomina_alumnos_mock.csv (10).    │
│ • Test C: Conmutación de asistencia (ACTIVE, ABSENT, WITHDRAWN).            │
│ • Verificar cero colisiones de avatar en el mismo curso.                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PASO 4: Apertura de Jornada y Generación del Launchpad (/admin)             │
│ • Test A: Apertura de jornada formal mediante openDailySessionAction().     │
│ • Test B: Verificación de Snapshot: alumnos ACTIVE pasan a WAITING.         │
│ • Test C: Verificación de URLs del Launchpad (Board TV, Staff, Picker).     │
├─────────────────────────────────────────────────────────────────────────────┤
│ PASO 5: Prueba de Retiro y Validación Cruzada en Portón                     │
│ • Test A: Móvil Picker (/retirar?session=...): Búsqueda por WhatsApp.       │
│ • Test B: Anuncio de llegada: generación de código 6 dígitos (TTL 10 min).  │
│ • Test C: Board TV reactivo: el alumno se enciende en ámbar (IN_PROCESS).   │
│ • Test D: Consola Staff (/staff?session=...): recepción de llamada.         │
│ • Test E: Validación en Keypad 64px: ingreso de 6 dígitos y sellado.        │
│ • Test F: Móvil Picker: transición automática a "Traspaso Confirmado".      │
│ • Test G: Deep-link nativo a WhatsApp (wa.me) a costo $0.                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PASO 6: Auditoría Legal y Cierre de Jornada (/admin/auditoria y /admin)     │
│ • Test A: Registro forense con timestamp UTC, funcionario y hash SHA-256.  │
│ • Test B: Cierre de jornada con closeDailySessionAction().                  │
│ • Test C: Invalidación del QR en el Smart TV (pantalla de standby).         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Matriz de Datos de Prueba

* **Fixtures de prueba**: no asumir que el CSV o las cuentas demo históricas siguen disponibles o pertenecen a un entorno aislado.
* Crear datos de prueba únicamente en PostgreSQL local o Vercel Preview después de confirmar el destino en el [checklist](CHECKLIST_VALIDACION_MVP.md).
* No incluir nombres, teléfonos ni correos reales en este plan; consultar [DECISIONES_ARQUITECTURA.md](DECISIONES_ARQUITECTURA.md) para el inventario agregado.
