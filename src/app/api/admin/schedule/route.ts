import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { resolveUserSchool } from '@/lib/userSchool';

/**
 * GET /api/admin/schedule
 * Retorna la configuración de horario de salida del colegio.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return NextResponse.json({ error: 'Colegio no encontrado.' }, { status: 404 });
  }

  const schoolRecord = await prisma.school.findUnique({ where: { id: school.id } });

  return NextResponse.json({
    defaultExitTime: schoolRecord?.defaultExitTime ?? null,
  });
}

/**
 * PATCH /api/admin/schedule
 * Actualiza el horario de salida recurrente del colegio.
 * Body: { defaultExitTime: "HH:MM" | null }
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const callerRole = session.user.role;
  if (callerRole !== 'SCHOOL_ADMIN') {
    return NextResponse.json({ error: 'Solo un Director puede configurar horarios.' }, { status: 403 });
  }

  const { school } = await resolveUserSchool(session.user.email);
  if (!school) {
    return NextResponse.json({ error: 'Colegio no encontrado.' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { defaultExitTime } = body as { defaultExitTime?: string | null };

  // Validar formato HH:MM o null para limpiar
  if (defaultExitTime !== null && defaultExitTime !== undefined) {
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(defaultExitTime)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use HH:MM en 24h (ej: 15:30).' },
        { status: 400 }
      );
    }
  }

  await prisma.school.update({
    where: { id: school.id },
    data: { defaultExitTime: defaultExitTime ?? null },
  });

  return NextResponse.json({ success: true, defaultExitTime: defaultExitTime ?? null });
}
