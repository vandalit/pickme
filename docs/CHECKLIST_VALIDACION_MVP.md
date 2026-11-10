# PickMe — Checklist operativo de validación del MVP

**Estado inicial:** Pendiente de validación manual
**Entorno:** ____________________
**Fecha de inicio:** ____________________
**Responsable:** ____________________

Este checklist es el registro de pruebas funcionales. No se considera validado algo por compilar o existir en el código: marca cada punto solo después de probarlo en la aplicación y anotar el resultado.

## Cómo registrar resultados

- `[ ]` Pendiente
- `[x]` Validado correctamente
- `[!]` Falló; anotar pasos, resultado esperado/obtenido y evidencia
- `[-]` Bloqueado; anotar el prerrequisito pendiente
- No pegar secretos, tokens, contraseñas ni datos reales de alumnos en este documento.
- Usar cuentas y datos de prueba. No limpiar ni borrar la base de datos para preparar estas pruebas.
- Si cambia el código para arreglar una falla, repetir la prueba y registrar el nuevo resultado.

**Registro para cada fallo/bloqueo:** ID de prueba · fecha/hora · cuenta/rol de prueba · pasos · esperado · obtenido · captura/log sin secretos · issue/commit relacionado.

### Protocolo de cambios para login y onboarding

Este flujo es una ruta crítica. Una comprobación parcial no permite marcarlo como arreglado ni continuar con otras validaciones.

1. **Antes de editar:** confirmar entorno y URL, proceso que sirve la app, base seleccionada, estado del worktree y último resultado conocido. Leer el flujo completo afectado: página de login → callback OAuth → sincronización de identidad → JWT/session → middleware/redirect → selección de rol → alta del colegio y membresía.
2. **Definir el fallo y el invariante:** reproducirlo y registrar URL final, respuesta/redirect, error de consola o servidor y cambio observable en la base. No inferir el punto de fallo solo por un spinner.
3. **Cambio mínimo:** corregir la causa demostrada. No reescribir ni reemplazar callbacks, configuración de Auth.js, middleware o tipos de sesión como parte de un arreglo local sin demostrar que son la causa. No mezclar refactors o modularización con un fix del login.
4. **Verificación técnica:** ejecutar TypeScript, build y pruebas relevantes; anotar el resultado. Estas verificaciones no sustituyen la prueba manual OAuth.
5. **Verificación funcional completa en local:** login desde una sesión cerrada → Google → callback a localhost → sesión PickMe → identidad vinculada en PostgreSQL Docker → destino esperado → selección de rol → destino de onboarding → enviar formulario de colegio → colegio, membresía y período persistidos → panel correcto. Cerrar sesión y volver a entrar para comprobar persistencia.
6. **Cierre:** marcar cada paso por separado como validado, fallido o bloqueado. No decir “login arreglado” hasta completar el ciclo correspondiente; si solo se probó una parte, describir exactamente cuál. Confirmar que no se usó Neon Production.

**Regla de protección:** Production nunca es destino de diagnóstico funcional ni de pruebas de integración. No ejecutar migraciones, seeds, altas ni limpieza allí para depurar el login. No pedir ni registrar secretos, cookies o tokens.

### Bitácora de login/onboarding — 2026-11-09

| Estado | Observación comprobada |
|---|---|
| [x] Login Google local | Los logs registran callback local de Google con HTTP 302 y después acceso autenticado a `/onboarding`. Esto valida el recorrido de esa sesión de prueba, no todos los casos de identidad existentes. |
| [x] Selección Director/Admin | El servidor registró `setRoleAction("SCHOOL_ADMIN")` y la carga de `/admin/onboarding` con HTTP 200. |
| [x] Alta del primer colegio | El servidor registró `completeOnboardingAction` completada y redirección a `/admin/cursos?onboarded=1`; luego se ejecutaron altas de alumnos. Solo en PostgreSQL Docker local. |
| [x] Destello entre selector y formulario | El cliente liberaba `loading` antes de `router.push`, repintando las opciones. Se quitó el reset exitoso y la revalidación innecesaria; el usuario confirmó el cambio y continuó con el flujo. |
| [ ] Pendiente | Verificar explícitamente que la membresía, el período y el colegio correcto persisten al cerrar sesión y volver a entrar; probar también staff y usuarios con múltiples colegios. |

### Matriz de entorno — completar antes de probar login o datos

| Entorno | URL de app (sin secretos) | Base/branch (solo nombre) | Callback OAuth autorizado | Validado |
|---|---|---|---|---|
| Local (`npm run dev`) | `http://localhost:3000` | PostgreSQL Docker local | Pendiente | [ ] |
| Vercel Preview | ____________________ | Pendiente de verificar | ____________________ | [ ] |
| Vercel Production | ____________________ | Neon `main` (confirmado por el usuario; no usar para pruebas) | ____________________ | [ ] |

- No registrar `DATABASE_URL`, tokens ni datos personales en esta tabla.
- Vercel Production es productivo: no usarlo para altas de prueba. Usar Preview con una base Neon aislada.
- La app local debe apuntar a `LOCAL_DATABASE_URL`; Vercel usa su `DATABASE_URL`. No se sincronizan automáticamente.
- **Bloqueo vigente:** no iniciar pruebas en Vercel Preview hasta confirmar que su base está aislada de Production.
- **Estado del esquema:** el esquema anterior (incluido aislamiento por colegio para apoderados y pickers) se concilió en Docker y Neon Production. Después se incorporó el modelo de identidad global y membresías: Docker local tiene cinco migraciones y coincide con `prisma/schema.prisma`; Neon Production sigue con tres migraciones y aún no recibe ese nuevo modelo. No usar Production para validar el modelo nuevo.
- Las pruebas de integración automatizadas usan `LOCAL_DATABASE_URL` o el PostgreSQL Docker local por defecto, y rechazan hosts no locales; nunca deben ejecutarse contra `DATABASE_URL` de Production.
- Las migraciones remotas requieren destino explícito; el seed es destructivo y solo se permite localmente con `PICKME_SEED_RESET=true`.
- Ver [DECISIONES_ARQUITECTURA.md](DECISIONES_ARQUITECTURA.md) para discrepancias y decisiones abiertas.

---

## 1. Infraestructura y estructura básica

### 1.1 Entorno de prueba

- [ ] **INF-01** Completar la matriz de entorno; identificar si la prueba corre en Docker local, Vercel Preview o Production.
- [ ] **INF-02** Confirmar de manera segura el destino de la base para la app actual: local usa PostgreSQL Docker (`LOCAL_DATABASE_URL`); Vercel usa Neon (`DATABASE_URL`). No copiar URLs ni credenciales al checklist.
- [ ] **INF-03** Confirmar que la aplicación inicia y muestra `/` y `/auth/login` sin errores de servidor.
- [ ] **INF-04** Confirmar conexión de solo lectura al PostgreSQL local o Neon Preview correspondiente; no usar Production para pruebas.
- [ ] **INF-05** Confirmar estado de `_prisma_migrations` por entorno sin aplicar cambios durante el diagnóstico; registrar solo nombres/estado de migración.
- [ ] **INF-06** Confirmar en Google Cloud que el callback OAuth exacto del host probado está autorizado, incluido `/api/auth/callback/google`.
- [ ] **INF-07** Confirmar que el simulador `/simulador` es accesible y no crea ni modifica datos de operación local/Preview/Production.

### 1.2 Rutas y navegación general

- [ ] **NAV-01** Desde `/`, abrir “Acceso Colegio” y confirmar que llega a `/auth/login`.
- [ ] **NAV-02** Confirmar que rutas privadas `/admin` y `/staff` redirigen a login si no hay sesión.
- [ ] **NAV-03** Confirmar que rutas públicas (landing, `/retirar`, board/simulador) no exigen autenticación.
- [ ] **NAV-04** Tras cerrar sesión, confirmar que volver a una ruta privada exige iniciar sesión nuevamente.
- [ ] **NAV-05** Confirmar que una URL de retorno válida se conserva durante el login y que una URL manipulada no envía al usuario a un sitio externo.

---

## 2. Navegación por persona y control de acceso

### 2.1 Visitante / persona no autenticada

- [ ] **PER-01** Puede abrir landing y login.
- [ ] **PER-02** Puede abrir las rutas públicas del picker y board sin ver nombres completos ni datos de administración.
- [ ] **PER-03** No puede abrir `/admin/*` ni `/staff` directamente.

### 2.2 Director / SCHOOL_ADMIN

- [ ] **PER-04** Un administrador autenticado llega a su espacio escolar y puede navegar sus secciones.
- [ ] **PER-05** Un administrador sin colegio asignado llega al onboarding; no queda en bucle entre login, `/admin` y onboarding.
- [ ] **PER-06** Un administrador con colegio asignado no vuelve al onboarding al navegar o iniciar una sesión nueva.
- [ ] **PER-07** Un administrador no ve ni modifica datos pertenecientes a otro colegio.

### 2.3 Personal de portería / STAFF

- [ ] **PER-08** Staff activo asignado al colegio puede abrir `/staff`.
- [ ] **PER-09** Staff no puede entrar a `/admin`; la redirección conduce a su área permitida.
- [ ] **PER-10** Staff pendiente no puede operar la cola antes de aceptar/obtener una invitación válida.
- [ ] **PER-11** Invitación válida permite vincular al staff al colegio correcto; invitación inválida, vencida o usada no concede acceso.

### 2.4 Picker / apoderado y pantalla pública

- [ ] **PER-12** Picker opera sin cuenta de administrador ni acceso a pantallas privadas.
- [ ] **PER-13** Staff ve solo los datos operativos necesarios; el board público no expone nombres completos, teléfonos o datos de cuenta.

---

## 3. Taskflows funcionales

### 3.1 Login Google y resolución del usuario — empezar aquí

- [ ] **AUTH-01** Abrir login con proveedor Google configurado; aparece el botón y no aparece el formulario de contraseña.
- [ ] **AUTH-02** Iniciar sesión con una cuenta de prueba ya registrada; Google vuelve a PickMe y se crea sesión.
- [ ] **AUTH-03** Confirmar destino tras login para usuario existente con colegio asignado: llega a su panel, sin rebote al onboarding.
- [ ] **AUTH-04** Cerrar sesión y volver a iniciar; no se reutiliza una sesión cerrada.
- [ ] **AUTH-05** Repetir el inicio con Google cuando el proveedor no esté disponible (solo en entorno controlado); se muestra un error recuperable y el servidor registra el fallo sin exponer secretos.
- [ ] **AUTH-06** Probar configuración OAuth ausente/incompleta en un entorno controlado; el login informa que no está configurado y no muestra un botón que no pueda funcionar.

### 3.2 Alta y primer ingreso de usuario — segundo bloque a validar

- [ ] **USER-01** Usar una cuenta Google de prueba nunca antes utilizada; el primer login crea un único usuario.
- [ ] **USER-02** Confirmar que el email se guarda normalizado y no se crean duplicados al repetir login.
- [ ] **USER-03** Confirmar el rol y estado inicial asignados al primer usuario; registrar valor observado: ____________________
- [ ] **USER-04** Confirmar que el usuario nuevo queda vinculado al usuario Google correcto y no recibe una escuela ajena.
- [ ] **USER-05** Confirmar que, después del primer login, el usuario llega a la selección/onboarding esperado sin bucles ni pantalla vacía.
- [ ] **USER-06** Probar un email ya existente en la base de prueba y confirmar que el login conserva su rol, escuela y estado actuales.
- [ ] **USER-07** Confirmar que una cuenta suspendida o no autorizada no obtiene acceso operativo.

**Resultado AUTH/USER (completar antes de seguir):**

- Cuenta de prueba (email no sensible o alias): ____________________
- ¿Login Google completado?: ____________________
- ID/rol/estado observado (sin tokens): ____________________
- ¿Usuario creado o reutilizado correctamente?: ____________________
- URL final y mensaje/error visible: ____________________
- Evidencia o incidencia: ____________________

### 3.3 Construcción del colegio / onboarding

- [ ] **SCH-01** Iniciar alta de colegio como usuario nuevo autorizado.
- [ ] **SCH-02** Completar datos obligatorios y confirmar validación de entradas inválidas.
- [ ] **SCH-03** Guardar colegio y verificar que el usuario queda asociado con rol administrador.
- [ ] **SCH-04** Confirmar cursos/salas iniciales conforme al comportamiento definido; registrar cuáles se crean: ____________________
- [ ] **SCH-05** Recargar y volver a entrar: el colegio persiste y no se duplica.
- [ ] **SCH-06** Intentar repetir onboarding con el mismo usuario; confirmar que no crea colegios duplicados ni reemplaza la asociación sin confirmación.
- [ ] **SCH-07** Verificar que cambiar o completar onboarding invalida cachés y que la navegación refleja el colegio nuevo.

### 3.4 Nómina, cursos y asistencia

- [ ] **ROS-01** Crear, editar y eliminar un curso/sala de prueba.
- [ ] **ROS-02** Crear y editar un alumno de prueba; confirmar avatar/código asignado y unicidad dentro de su sala.
- [ ] **ROS-03** Importar CSV válido y verificar cantidades/campos importados.
- [ ] **ROS-04** Importar CSV con errores y confirmar reporte claro sin importación parcial inesperada.
- [ ] **ROS-05** Marcar asistencia y estados (activo, ausente, retirado) y confirmar persistencia tras recargar.
- [ ] **ROS-06** Confirmar aislamiento de cursos y alumnos por colegio.
- [!] **ROS-07 — Privacidad multi-tenant: teléfono compartido entre colegios** El alta de alumno podía resolver un Guardian por WhatsApp sin filtrar por colegio. `Guardian.whatsappNumber` tenía unicidad global, por lo que un colegio podía reutilizar y modificar el contacto de otro. El log de la prueba del 2026-11-09 confirma que se reutilizó un Guardian preexistente, pero no registra el valor del teléfono ni permite verificar por sí solo el colegio de origen; la observación del usuario indica que eran colegios distintos. Tratar como incidente de aislamiento, no como simple conciliación. No considerar corregido hasta aplicar la migración y validar la regresión multi-colegio.
- [ ] **ROS-08 — Caso borde dentro del mismo colegio** Cuando varios alumnos del mismo colegio comparten el mismo WhatsApp, confirmar explícitamente la reutilización del contacto de ese colegio. La interfaz debe indicar que conserva el nombre ya registrado; nunca debe revelar nombres, teléfonos ni la existencia de registros de otro colegio.
- [ ] **ROS-09 — Remediación y regresión de aislamiento** Tras aplicar la migración en el entorno de prueba, probar dos colegios con el mismo teléfono: cada uno debe ver/editar únicamente su contacto, y los cambios de uno no deben alterar el otro. La migración marca como “Por verificar” los nombres y relaciones de contactos que estaban compartidos entre escuelas, y elimina de esos registros los hashes de documento y tokens familiares compartidos. Verificar y corregir esos contactos en cada colegio antes de volver a operar con ellos. Revisar también el historial de autorizaciones, pases diarios y eventos de retiro.

### 3.5 Apertura de jornada y board

- [ ] **SES-01** Abrir jornada desde el panel y confirmar que se crea una sola sesión activa para el colegio.
- [ ] **SES-02** Confirmar que el snapshot incluye solo alumnos elegibles según asistencia.
- [ ] **SES-03** Abrir URL/QR del board y verificar actualización de estados.
- [ ] **SES-04** Confirmar que board muestra identificadores anónimos y no nombres completos.
- [ ] **SES-05** Abrir una URL de sesión inexistente o cerrada; verificar estado vacío/standby claro y sin datos de otra sesión.

### 3.6 Solicitud de retiro / picker

- [ ] **PICK-01** Abrir el flujo desde QR o código de jornada válido.
- [ ] **PICK-02** Buscar un alumno con datos de prueba y confirmar que solo devuelve resultados autorizados para el flujo.
- [ ] **PICK-03** Solicitar retiro y confirmar creación del evento/código temporal esperado.
- [ ] **PICK-04** Confirmar que expiración, reintentos y códigos inválidos no habilitan entrega.
- [ ] **PICK-05** Confirmar que el board refleja el estado de retiro solicitado.

### 3.7 Entrega por staff

- [ ] **HAND-01** Staff asignado ve la solicitud de retiro en la cola correcta.
- [ ] **HAND-02** Código incorrecto no confirma entrega y se muestra un error claro.
- [ ] **HAND-03** Código correcto confirma la entrega una sola vez y registra el staff responsable.
- [ ] **HAND-04** La cola y el board reflejan el estado confirmado sin revelar información adicional en la pantalla pública.
- [ ] **HAND-05** Confirmar comportamiento ante jornada cerrada, solicitud expirada y doble envío.

### 3.8 Auditoría, cierre y administración de staff

- [ ] **AUD-01** Verificar que eventos de la jornada quedan en auditoría con hora, actor y transición de estado correctos.
- [ ] **AUD-02** Cerrar jornada y confirmar que no se aceptan nuevas solicitudes.
- [ ] **AUD-03** Confirmar que el board pasa a estado de jornada cerrada/standby y que el QR no inicia retiros inválidos.
- [ ] **STAFF-01** Invitar personal por correo/token y confirmar colegio, rol y vencimiento.
- [ ] **STAFF-02** Revocar una invitación y confirmar que el enlace deja de conceder acceso.
- [ ] **STAFF-03** Confirmar que un admin puede gestionar personal solo dentro de su colegio.

---

## Orden de ejecución recomendado

1. **INF-01 a INF-06**: identificar entorno y verificar prerrequisitos.
2. **AUTH-01 a AUTH-04**, luego **USER-01 a USER-06**: confirmar primero login y resolución del usuario.
3. **SCH-01 a SCH-07**: crear/vincular el colegio.
4. Completar navegación por personas y luego los taskflows en orden.
5. Si un prerrequisito falla, marcar los pasos dependientes como `[-]` y registrar el bloqueo; no compensar con cambios manuales en la base de datos.

## Resumen de ejecución

| Sección | Pendientes | Correctos | Fallidos | Bloqueados |
|---|---:|---:|---:|---:|
| Infraestructura / navegación |  |  |  |  |
| Personas y permisos |  |  |  |  |
| Login / usuario nuevo |  |  |  |  |
| Colegio / onboarding |  |  |  |  |
| Operación y auditoría |  |  |  |  |

**Siguiente prueba a ejecutar:** INF-01
**Incidencias abiertas:** ____________________
