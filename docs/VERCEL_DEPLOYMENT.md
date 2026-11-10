# Despliegue en Vercel — PickMe

## Arquitectura acordada

- **Local:** PostgreSQL 16 del servicio Docker; la app usa `LOCAL_DATABASE_URL`.
- **Vercel:** Neon PostgreSQL remoto; la app usa `DATABASE_URL`.
- Los entornos no comparten ni sincronizan datos. Production y Preview deben apuntar a bases o branches Neon separados.
- La URL configurada actualmente en Vercel no se puede inferir desde el repositorio. Verificarla en el dashboard antes de validar datos o login.

## 1. Variables de entorno

En **Settings > Environment Variables**, configurar por alcance:

| Variable | Production | Preview | Obligatoria |
|---|---|---|---|
| `DATABASE_URL` | Pooler Neon de Production | Pooler Neon de Preview, separado de Production | Sí |
| `AUTH_SECRET` | Secreto propio del entorno | Secreto de Preview distinto | Sí |
| `AUTH_GOOGLE_ID` | Cliente OAuth aprobado | Cliente OAuth aprobado para Preview | Sí |
| `AUTH_GOOGLE_SECRET` | Secreto OAuth de Production | Secreto OAuth correspondiente | Sí |
| `NEXTAUTH_URL` | URL estable de Production | URL estable de Preview | Según configuración |
| `NEXT_PUBLIC_APP_URL` | URL pública de Production | URL pública de Preview | Sí |

No copiar valores secretos a documentación, issues o logs. Confirmar que ambos entornos tienen variables y bases deliberadamente configuradas; no asumir que heredaron el mismo destino.

## 2. Google OAuth

Google no autentica “desde Vercel” como proveedor distinto: el login se inicia desde el host actual y vuelve a su callback. Autorizar en Google Cloud las URI exactas:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://<dominio-produccion>/api/auth/callback/google`
- Preview: callback del dominio estable de Preview que se probará.

Un dominio Preview diferente requiere que su callback esté autorizado. Validar login local, Preview y Production por separado. Esta documentación no confirma cuáles callback URI están configuradas en Google Cloud.

## 3. Migraciones

Antes de cambiar una base existente:

1. Identificar explícitamente el entorno y su URL de destino sin publicar credenciales.
2. Obtener respaldo y revisar el estado de `_prisma_migrations`.
3. Revisar la migración y el resultado esperado en una base local desechable.
4. Ejecutar solo migraciones versionadas con el destino remoto explícito:

```bash
PICKME_DATABASE_TARGET=remote DATABASE_URL="<URL_POOLER_NEON>" npx prisma migrate deploy
```

No ejecutar `prisma db push` en una base con datos. No ejecutar el seed en Neon/Vercel: elimina los datos de las tablas antes de sembrar fixtures y ahora exige confirmación explícita, además de rechazar destinos remotos.

## 4. Build y operación

- `package.json` genera Prisma Client en `postinstall`.
- En Vercel, la aplicación selecciona `DATABASE_URL`; localmente selecciona `LOCAL_DATABASE_URL`.
- `src/lib/db.ts` limita el pool de producción a cinco conexiones.
- Las migraciones no se consideran aplicadas solo porque el build haya pasado; confirmar el estado por entorno.

## 5. Verificación requerida antes de pruebas funcionales

- Registrar el nombre del proyecto/branch Neon y el alcance Vercel (Preview o Production), nunca la URL completa.
- Verificar aislamiento de Preview respecto de Production.
- Confirmar migración aplicada y respaldada.
- Confirmar callback Google del host exacto.
- Empezar por login; luego validar alta de usuario y consistencia de datos.

Ver [DECISIONES_ARQUITECTURA.md](DECISIONES_ARQUITECTURA.md) para el inventario de discrepancias y decisiones abiertas.
