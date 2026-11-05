import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone')?.trim();
    const sessionCodeOrId = searchParams.get('session')?.trim();

    if (!phone) {
      return NextResponse.json(
        { error: 'El número de teléfono es requerido.' },
        { status: 400 }
      );
    }

    // 1. Buscar la sesión activa correspondiente
    let session = null;
    if (sessionCodeOrId) {
      session = await prisma.pickupSession.findFirst({
        where: {
          OR: [
            { id: sessionCodeOrId },
            { sessionCode: { equals: sessionCodeOrId, mode: 'insensitive' } },
          ],
          status: 'OPEN',
        },
        include: { school: true },
      });
    }

    // Si no se pasó session o no se encontró, buscar la sesión abierta más reciente
    if (!session) {
      session = await prisma.pickupSession.findFirst({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        include: { school: true },
      });
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No hay ninguna sesión de salida escolar abierta en este momento.' },
        { status: 404 }
      );
    }

    // Normalizar formato de teléfono (remover espacios y guiones)
    const cleanPhone = phone.replace(/[\s-]/g, '');

    // 2. Buscar si el teléfono pertenece a un Picker o Guardian registrado
    const picker = await prisma.picker.findFirst({
      where: {
        OR: [
          { whatsappNumber: cleanPhone },
          { whatsappNumber: { contains: cleanPhone.slice(-8) } },
        ],
      },
      include: {
        authorizations: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                classroom: true,
                events: {
                  where: { sessionId: session.id },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // También verificar si el apoderado (Guardian) viene a retirar directamente
    const guardian = await prisma.guardian.findFirst({
      where: {
        OR: [
          { whatsappNumber: cleanPhone },
          { whatsappNumber: { contains: cleanPhone.slice(-8) } },
        ],
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                classroom: true,
                events: {
                  where: { sessionId: session.id },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!picker && !guardian) {
      return NextResponse.json(
        {
          error:
            'Número no registrado. Verifica tu teléfono o contacta al apoderado para que te autorice.',
        },
        { status: 403 }
      );
    }

    // Unificar lista de alumnos autorizados
    const studentsMap = new Map<string, any>();

    if (picker) {
      for (const auth of picker.authorizations) {
        const st = auth.student;
        const currentEvent = st.events[0] || null;
        studentsMap.set(st.id, {
          id: st.id,
          fullName: st.fullName,
          initials: st.initials,
          animalId: st.animalId,
          colorId: st.colorId,
          classroomName: `${st.classroom.grade} ${st.classroom.section}`,
          status: currentEvent ? currentEvent.status : 'WAITING',
          eventId: currentEvent ? currentEvent.id : null,
          handoverCode: currentEvent ? currentEvent.handoverCode : null,
          handoverExpiry: currentEvent ? currentEvent.handoverExpiry : null,
        });
      }
    }

    if (guardian) {
      for (const sg of guardian.students) {
        const st = sg.student;
        if (!studentsMap.has(st.id)) {
          const currentEvent = st.events[0] || null;
          studentsMap.set(st.id, {
            id: st.id,
            fullName: st.fullName,
            initials: st.initials,
            animalId: st.animalId,
            colorId: st.colorId,
            classroomName: `${st.classroom.grade} ${st.classroom.section}`,
            status: currentEvent ? currentEvent.status : 'WAITING',
            eventId: currentEvent ? currentEvent.id : null,
            handoverCode: currentEvent ? currentEvent.handoverCode : null,
            handoverExpiry: currentEvent ? currentEvent.handoverExpiry : null,
          });
        }
      }
    }

    const students = Array.from(studentsMap.values());

    return NextResponse.json({
      success: true,
      pickerName: picker?.fullName || guardian?.fullName,
      sessionId: session.id,
      sessionCode: session.sessionCode,
      schoolName: session.school.name,
      students,
    });
  } catch (error: any) {
    console.error('Error in /api/pickup/lookup:', error);
    return NextResponse.json(
      { error: 'Error interno al consultar autorización.' },
      { status: 500 }
    );
  }
}
