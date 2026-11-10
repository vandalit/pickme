# PickMe — Entornos, base de datos y decisiones pendientes

**Propósito:** registrar una fuente común de verdad para despliegue, validación y datos. No contiene URLs completas, credenciales ni datos personales.

## Arquitectura operativa acordada para avanzar

| Entorno | Aplicación | Base de datos | Uso |
|---|---|---|---|
| Desarrollo local | `npm run dev` o servicio `web` de Docker | PostgreSQL 16 del servicio Docker; `LOCAL_DATABASE_URL` | Desarrollo y pruebas con datos sintéticos |
| Vercel Preview | Deploy de previsualización | Pendiente de verificar en Vercel | Validación funcional antes de liberar |
| Vercel Production | Deploy productivo | Neon `main`; mismo endpoint configurado en `.env` local, confirmado por el usuario | Producción; no usar para pruebas |

La app local usa `LOCAL_DATABASE_URL`; el runtime de Vercel usa `DATABASE_URL`. Prisma CLI apunta a local por defecto. Toda operación remota requiere `PICKME_DATABASE_TARGET=remote`. No existe sincronización automática ni se deben copiar datos de un entorno a otro sin decisión, respaldo y procedimiento explícitos.

**Estado de verificación:** la conexión Neon de `.env` local corresponde a Production `main`, según confirmación del usuario; no se inspeccionaron las variables del dashboard de Vercel. El destino de Preview sigue sin verificarse. Docker local es una instancia PostgreSQL separada.

Google OAuth es un proveedor externo común, pero cada host requiere que su callback esté autorizado. El éxito del login local no prueba el callback de Vercel ni viceversa.

## Registro operativo del login y onboarding

El login y el primer onboarding son un único flujo crítico que debe verificarse de extremo a extremo. La página cargando, el botón de Google visible, la respuesta de `/api/auth/providers` o el redirect a Google son comprobaciones parciales, no evidencia de que el login haya terminado.

**Última evidencia local (2026-11-09):**

- La página de login respondió HTTP 200 y Auth.js publicó el proveedor Google.
- Un clic inició el redirect a Google con el callback de localhost.
- Se observaron callback OAuth local de Google con HTTP 302, acceso autenticado a `/onboarding`, selección de rol, `GET /admin/onboarding` con HTTP 200, alta del colegio y redirección a `/admin/cursos?onboarded=1`; después se ejecutaron altas de alumnos. Todo ocurrió en PostgreSQL Docker local.
- El usuario precisó que el fallo visible era un destello: las dos opciones reaparecían brevemente antes del formulario. El cliente liberaba `loading` antes de `router.push`, lo que volvía a pintar las tarjetas. También revalidaba innecesariamente la ruta actual. Se quitaron ambos comportamientos y el usuario confirmó el cambio.
- En la prueba local, la base ya contiene registros de onboarding/validación; el estado “cero filas” descrito en la sección histórica corresponde al momento posterior a la limpieza, no al estado local actual.
- Pendiente comprobar explícitamente persistencia de membresía y período tras cerrar sesión/reingresar, además de los escenarios staff y multi-colegio.
- Una hipótesis anterior de que el problema observado era un rebote por JWT obsoleto no quedó demostrada para este síntoma; no presentarla como causa confirmada.
- No declarar el login arreglado a partir de compilación o de abrir Google. La secuencia y las puertas de validación están en [CHECKLIST_VALIDACION_MVP.md](CHECKLIST_VALIDACION_MVP.md).

**Disciplina para cambios posteriores:** antes de modificar auth, middleware o onboarding, reproducir y ubicar la etapa exacta; registrar URL final, respuesta/redirect y evidencia local; leer callbacks y guards de ambos lados; hacer el cambio quirúrgico más pequeño que resuelva la causa. No reescribir ni modularizar infraestructura compartida de auth por conveniencia, y no mezclar refactor con corrección funcional. Después, correr TypeScript/build/pruebas y repetir el recorrido manual completo local: login, callback, sesión, usuario, rol, formulario, colegio y membresía. Production no se usa para reproducir ni probar el fallo.

## Discrepancias documentales detectadas

| ID | Discrepancia | Evidencia actual | Resolución propuesta | Estado |
|---|---|---|---|---|
| DOC-01 | README decía Neon como única base, mientras Compose y `.env.example` describen PostgreSQL local. | README, `.env.example`, Compose, `.env` ignorado | Mantener Docker local + Neon en Vercel; dejar explícito que son bases distintas. | Documentado y selección local verificada por lectura |
| DOC-02 | `.env` local apunta a Neon aunque la intención de desarrollo es usar Docker. | Host de `.env` reconocido como Neon; no se muestran credenciales | Hacer que la app local use `LOCAL_DATABASE_URL`; reservar `DATABASE_URL` para Vercel/operaciones remotas explícitas. | Código usa destinos separados; conexión local comprobada |
| DOC-03 | Preview no tiene destino confirmado; Production usa Neon `main`. | El usuario confirmó que Neon de `.env` local es el endpoint de Production; no se inspeccionó el dashboard de Vercel. | Verificar Preview en Vercel sin copiar secretos; mantener Production fuera de las pruebas. | Preview pendiente |
| DOC-04 | La guía Vercel permitía sembrar datos tras migrar, pero el seed borra tablas antes de sembrar. | `prisma/seed.ts` ejecuta varios `deleteMany()` | Prohibir seeds remotos y exigir confirmación local explícita. | Protección añadida; rechazo remoto probado; no se ejecutó seed |
| DOC-05 | Roadmap marca Docker y Prisma como pendientes aunque sus artefactos existen. | Dockerfile, Compose, Prisma schema y migraciones presentes | Marcar implementación como existente, separar claramente “configurado” de “validado”. | Actualizado |
| DOC-06 | SDD/STACK/planes mezclan Neon, Supabase, Twilio, magic links, Pusher y estados de auth que no necesariamente coinciden con el producto actual. | Textos históricos en `docs/SDD.md`, `docs/STACK.md`, `docs/PLAN_MVP_FUNCIONAL.md` y otros. | Resolver documento por documento; no tratar descripciones históricas como configuración vigente. | Pendiente |
| DOC-07 | Se habla de cuentas/colegios demo en Neon y de fixtures locales sin un inventario conciliado. | Planes de prueba y seed histórico; se vaciaron las filas de aplicación en Docker y Neon para iniciar la validación desde cero. | Mantener datos sintéticos separados por entorno; no sembrar Production. | Filas de aplicación vacías en ambas bases |
| DOC-08 | Google OAuth se documenta como configuración general, pero los callbacks dependen del host. | README, guía Vercel y configuración OAuth externa. | Registrar y probar callbacks localhost, Preview estable y Production por separado. | Pendiente de verificación en Google Cloud |
| DOC-09 | Las bases divergían y sus historiales solo registraban `init`, pese a cambios de esquema aplicados fuera de migraciones. | Antes de conciliar, Docker correspondía al esquema inicial; Neon coincidía con el schema de HEAD salvo el aislamiento por colegio pendiente. | Versionar el salto posterior a `init`, registrar en Neon el tramo que ya existía y aplicar el aislamiento como migración. | Resuelto; ambas bases coinciden con `prisma/schema.prisma` |
| DOC-10 | El schema de ejemplo del SDD usa otra taxonomía y campos respecto de `prisma/schema.prisma`. | SDD incluye `enum Role` y una copia de modelos; el código usa `UserRole` y su schema actual. | Reemplazar el schema duplicado por referencia al schema Prisma como fuente de verdad. | Pendiente |
| DOC-11 | README describía el lookup como búsqueda por nombre/código aunque el endpoint requiere teléfono y jornada. | `GET /api/pickup/lookup` | Alinear la descripción al contrato real. | Corregido |

## Inventario de solo lectura previo al vaciado — 2026-11-09

Se consultaron únicamente metadatos de esquema, conteos agregados y el registro de migraciones. No se leyeron nombres, correos, teléfonos ni filas de alumnos. Esta tabla es la foto anterior al vaciado y no representa el estado actual.

| Métrica | PostgreSQL Docker local | Neon al que apunta el `.env` local |
|---|---:|---:|
| Usuarios | 2 | 6 |
| Colegios | 1 | 4 |
| Cursos | 2 | 6 |
| Alumnos | 6 | 13 |
| Apoderados | 3 | 15 |
| Pickers | 2 | 108 |
| Autorizaciones | 2 | 9 |
| Jornadas | 1 | 3 |
| Eventos de retiro | 6 | 13 |
| `daily_passes` | No existe | 0 filas |
| Migraciones registradas | Solo `20261105060524_init` | Solo `20261105060524_init` |

En esa foto previa, el esquema Docker carecía de tablas y campos añadidos después de `init`; Neon ya contenía esos cambios aunque su registro no los documentaba. La comparación posterior confirmó que el Neon consultado es el endpoint de Production `main` según el usuario.

## Estado tras conciliación — 2026-11-09

- Se eliminaron todas las filas de aplicación en PostgreSQL Docker local y Neon Production `main`; se conservaron tablas, columnas, índices, restricciones y `_prisma_migrations`.
- Las tablas de aplicación quedaron con cero filas en ambas bases. Antes del cambio de identidad, `_prisma_migrations` conservaba tres registros en cada base.
- Se añadió `20261109030000_reconcile_post_init_schema` para versionar cambios que ya estaban en Neon pero faltaban en Docker. En Neon se registró como aplicada porque el esquema ya contenía esos cambios; en Docker se ejecutó.
- `20261109041500_scope_guardians_and_pickers_by_school` se aplicó en ambas bases.
- `prisma migrate diff` entre cada base y `prisma/schema.prisma` no detectó diferencias; `prisma migrate status` confirmó Neon actualizado.
- El deployment de Production sigue en `3d579c2`, 49 commits detrás del HEAD local revisado. Su código no incorpora el aislamiento por colegio de los endpoints; no probar ni operar flujos de Production con datos nuevos hasta desplegar código compatible.
- Después se acordó una identidad global Google con membresías escolares e historial de períodos. Docker local aplicó `20261109171000_global_google_identity_memberships` y `20261109180000_membership_period_role`; quedó con cinco migraciones y sin diferencias frente al modelo actual.
- Neon Production conserva por ahora el esquema anterior al modelo de membresías (tres migraciones registradas); la nueva migración no se aplicó allí.
- El modelo nuevo continúa solo en Docker local. El flujo funcional local de Google y creación del colegio ya tiene evidencia en los logs de desarrollo; Vercel Preview no está verificado.

## Identidad de acceso y pertenencia a colegios

- `User` representa una identidad global de PickMe. En Google login se busca primero por el `providerAccountId` de Google (el `sub` estable de esa cuenta) y se guarda en `User.googleId`; el ID primario de `User` sigue siendo el UUID interno de PickMe. Si existía una identidad creada por invitación con el mismo email y aún no tenía `googleId`, se vincula en el login verificado.
- `SchoolMembership` guarda colegio, rol y estado por espacio de trabajo. `MembershipPeriod` conserva cada período activo; al suspender una membresía se cierra el período, y una recontratación reactiva la misma cuenta/membresía y abre un período nuevo.
- Si una identidad tiene varios colegios activos, se selecciona explícitamente el espacio de trabajo. No se auto-vincula al colegio más reciente. El selector solo lista membresías activas y la cookie de selección se valida contra la membresía en cada resolución.
- Los IDs de `Guardian` y `Picker` son UUID internos, independientes de sus teléfonos. El teléfono no es ID de usuario. La unicidad de apoderado y picker es por `(schoolId, whatsappNumber)`; las consultas de alta, reutilización y retiro validan el `schoolId` activo, así que un número repetido en otro colegio no reutiliza ni revela el registro del primero.
- Este modelo está aplicado solo en Docker local. No se desplegó a Neon Production; el código local aún debe probar sus flujos antes de planificar el destino Preview.

## Decisiones que requieren confirmación

| ID | Decisión | Recomendación | Bloquea |
|---|---|---|---|
| DEC-01 | ¿Preview tendrá Neon branch/base separada de Production? | Sí; verificar/crear destino aislado antes de probar. | Validación segura en Vercel |
| DEC-02 | ¿Qué branch/proyecto Neon es el destino oficial de Production? | Neon `main`, confirmado por el usuario como el mismo endpoint usado por Vercel Production. | No bloquea; falta inspección directa del dashboard |
| DEC-03 | ¿Qué dataset es canónico si Neon y Docker contienen datos distintos? | Los datos se descartaron; `prisma/schema.prisma` y sus migraciones versionadas son la referencia del esquema. | Resuelto para iniciar pruebas |
| DEC-04 | ¿Se mantienen fixtures/cuentas demo? | Solo en una base local desechable; nunca en Production. | Uso seguro del seed |
| DEC-05 | ¿Un cliente OAuth de Google o clientes separados? | Clientes separados para aislar Preview/Production si Google Cloud lo permite; como mínimo callbacks exactos por host. | Prueba del login por entorno |
| DEC-06 | ¿Cómo alinear esquemas divergentes antes de desplegar el nuevo modelo de identidad? | El aislamiento quedó aplicado en ambas; el modelo global de identidad e historial está aplicado solo en Docker local, no en Neon Production. | Docker conciliado; diseñar despliegue compatible y aislar Preview |

## Siguientes pasos

1. Verificar y aislar la base usada por Vercel Preview; no dirigir pruebas a Production.
2. Verificar en Google Cloud los callbacks OAuth exactos para local y Preview.
3. Ejecutar el checklist: primero login y resolución de usuario, luego colegio, alumnos y board.
4. No sembrar ni probar altas en Neon Production.
