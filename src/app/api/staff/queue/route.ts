import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionParam = searchParams.get('session');

    // 1. Guard de Autenticación: solo staff o admin autenticados
    const userSession = await auth();
    if (!userSession?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para consultar la cola operativa.' },
        { status: 401 }
      );
    }

    const email = userSession.user.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { school: true },
    });

    if (!user || !user.schoolId || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Tu cuenta no tiene permisos activos para operar en portería.' },
        { status: 403 }
      );
    }

    const userSchoolId = user.schoolId;
    const staffName = user.name;

    // 2. Obtener la sesión activa con aislamiento estricto
    let session = null;
    if (sessionParam) {
      session = await prisma.pickupSession.findFirst({
        where: {
          OR: [
            { id: sessionParam },
            { sessionCode: { equals: sessionParam, mode: 'insensitive' } },
          ],
        },
        include: { school: true },
      });
    } else if (userSchoolId) {
      session = await prisma.pickupSession.findFirst({
        where: {
          schoolId: userSchoolId,
          status: 'OPEN',
        },
        orderBy: { createdAt: 'desc' },
        include: { school: true },
      });
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No se especificó una sesión válida ni hay jornada abierta para tu institución.' },
        { status: 404 }
      );
    }

    // 2. Obtener todos los eventos de la sesión con relaciones
    const events = await prisma.pickupEvent.findMany({
      where: { sessionId: session.id },
      include: {
        student: {
          include: {
            classroom: true,
          },
        },
        picker: true,
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Formatear eventos para la vista operativa de staff
    const formattedEvents = events.map((evt) => ({
      id: evt.id,
      sessionId: evt.sessionId,
      status: evt.status,
      pickerScannedAt: evt.pickerScannedAt,
      staffConfirmedAt: evt.staffConfirmedAt,
      handoverExpiry: evt.handoverExpiry,
      student: {
        id: evt.student.id,
        fullName: evt.student.fullName,
        initials: evt.student.initials,
        animalId: evt.student.animalId,
        colorId: evt.student.colorId,
        classroomName: `${evt.student.classroom.grade} ${evt.student.classroom.section}`,
      },
      picker: evt.picker
        ? {
            id: evt.picker.id,
            fullName: evt.picker.fullName,
            relationship: evt.picker.relationship,
            whatsappNumber: evt.picker.whatsappNumber,
          }
        : null,
      staffName: evt.staff?.name || null,
    }));

    // Métricas en vivo
    const inProcess = formattedEvents.filter((e) => e.status === 'IN_PROCESS').length;
    const waiting = formattedEvents.filter((e) => e.status === 'WAITING').length;
    const completed = formattedEvents.filter(
      (e) => e.status === 'IN_TRANSIT' || e.status === 'ARRIVED'
    ).length;
    const total = formattedEvents.length;

    return NextResponse.json({
      success: true,
      staffName,
      session: {
        id: session.id,
        sessionCode: session.sessionCode,
        schoolName: session.school.name,
        status: session.status,
        startedAt: session.startedAt,
      },
      counts: {
        inProcess,
        waiting,
        completed,
        total,
      },
      events: formattedEvents,
    });
  } catch (error: any) {
    console.error('Error in /api/staff/queue:', error);
    return NextResponse.json(
      { error: 'Error interno al consultar la lista de portón.' },
      { status: 500 }
    );
  }
}

