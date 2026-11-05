import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionParam = searchParams.get('session');

    // 1. Obtener la sesión activa
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
    }

    if (!session) {
      session = await prisma.pickupSession.findFirst({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        include: { school: true },
      });
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No hay ninguna sesión de salida activa en este momento.' },
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

