import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/cron/auto-open-sessions
 *
 * Debe llamarse cada minuto desde un scheduler externo (Vercel Cron, cron-job.org, etc.).
 * Verifica qué colegios tienen `defaultExitTime` configurado y si la hora actual
 * coincide con la hora de salida. Si no hay sesión abierta, abre una automáticamente.
 *
 * Protección mínima: cabecera Authorization con token de cron desde variable de entorno.
 */
export async function GET(req: NextRequest) {
  // Verificar token de autorización del scheduler
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  const now = new Date();
  // Hora local en formato HH:MM
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Buscar colegios que tienen horario configurado para esta hora
  const schools = await prisma.school.findMany({
    where: { defaultExitTime: currentTime },
  });

  if (schools.length === 0) {
    return NextResponse.json({ triggered: 0, message: 'No schools scheduled for this minute.' });
  }

  const results: { schoolId: string; schoolName: string; result: string }[] = [];

  for (const school of schools) {
    try {
      // Verificar si ya hay una sesión abierta
      const existingOpen = await prisma.pickupSession.findFirst({
        where: { schoolId: school.id, status: 'OPEN' },
      });

      if (existingOpen) {
        results.push({ schoolId: school.id, schoolName: school.name, result: 'already_open' });
        continue;
      }

      // Obtener alumnos activos
      const activeStudents = await prisma.student.findMany({
        where: {
          classroom: { schoolId: school.id },
          status: 'ACTIVE',
        },
      });

      if (activeStudents.length === 0) {
        results.push({ schoolId: school.id, schoolName: school.name, result: 'no_active_students' });
        continue;
      }

      // Generar código de sesión
      const words = school.name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      const acronym = words.slice(0, 3).map((w) => w[0].toUpperCase()).join('') || 'PICK';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const sessionCode = `${acronym}-${randomNum}`;

      await prisma.pickupSession.create({
        data: {
          schoolId: school.id,
          sessionCode,
          status: 'OPEN',
          startedAt: now,
          events: {
            create: activeStudents.map((student) => ({
              studentId: student.id,
              status: 'WAITING',
            })),
          },
        },
      });

      results.push({
        schoolId: school.id,
        schoolName: school.name,
        result: `opened:${sessionCode}`,
      });
    } catch (err: any) {
      results.push({ schoolId: school.id, schoolName: school.name, result: `error:${err.message}` });
    }
  }

  return NextResponse.json({
    triggered: results.length,
    time: currentTime,
    results,
  });
}

