import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AnimalId, ColorId } from '@/lib/avatars';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const cleanParam = sessionId?.trim();

    if (!cleanParam) {
      return NextResponse.json({ error: 'Falta identificador de sesión' }, { status: 400 });
    }

    // Buscar la sesión por código alfanumérico o UUID
    const session = await prisma.pickupSession.findFirst({
      where: {
        OR: [
          { id: cleanParam },
          { sessionCode: { equals: cleanParam, mode: 'insensitive' } },
        ],
      },
      include: {
        school: true,
        events: {
          include: {
            student: {
              include: {
                classroom: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada', sessionCode: cleanParam },
        { status: 404 }
      );
    }

    const students = session.events.map((e) => {
      let publicStatus: 'WAITING' | 'IN_PROCESS' | 'HANDOVER' | 'IN_TRANSIT' | 'ARRIVED' | 'ALERT' =
        'WAITING';

      if (e.status === 'IN_PROCESS') publicStatus = 'IN_PROCESS';
      else if (e.status === 'WAITING') publicStatus = 'WAITING';
      else if (e.status === 'HANDOVER') publicStatus = 'HANDOVER';
      else if (e.status === 'IN_TRANSIT') publicStatus = 'IN_TRANSIT';
      else if (e.status === 'ARRIVED') publicStatus = 'ARRIVED';
      else if (e.status === 'ALERT') publicStatus = 'ALERT';

      return {
        id: e.student.id,
        animalId: e.student.animalId as AnimalId,
        colorId: e.student.colorId as ColorId,
        classroomName: `${e.student.classroom.grade} ${e.student.classroom.section}`,
        status: publicStatus,
      };
    });

    const waiting = students.filter((s) => s.status === 'WAITING').length;
    const inProcess = students.filter(
      (s) => s.status === 'IN_PROCESS' || s.status === 'HANDOVER'
    ).length;
    const completed = students.filter(
      (s) => s.status === 'IN_TRANSIT' || s.status === 'ARRIVED'
    ).length;
    const total = students.length;

    return NextResponse.json({
      success: true,
      schoolName: session.school.name,
      sessionCode: session.sessionCode,
      status: session.status,
      startedAt: session.startedAt,
      closedAt: session.closedAt,
      counts: { waiting, inProcess, completed, total },
      students,
    });
  } catch (error) {
    console.error('[API Board] Error al consultar sesión:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al consultar la sesión' },
      { status: 500 }
    );
  }
}
