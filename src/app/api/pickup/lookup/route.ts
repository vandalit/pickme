import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type StudentPickupLookup = {
  id: string;
  fullName: string;
  initials: string;
  animalId: string;
  colorId: string;
  classroomName: string;
  status: string;
  eventId: string | null;
  handoverCode: string | null;
  handoverExpiry: Date | null;
};

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

    // Normalizar formato de teléfono (remover espacios y guiones)
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (cleanPhone.replace(/\D/g, '').length < 8) {
      return NextResponse.json(
        { error: 'Ingresa un número telefónico válido con al menos 8 dígitos.' },
        { status: 400 }
      );
    }

    // 1. Buscar la sesión activa correspondiente con estricto aislamiento multi-tenant
    let session = null;
    if (sessionCodeOrId) {
      const matchingSessions = await prisma.pickupSession.findMany({
        where: {
          OR: [
            { id: sessionCodeOrId },
            { sessionCode: { equals: sessionCodeOrId, mode: 'insensitive' } },
          ],
          status: 'OPEN',
        },
        include: { school: true },
      });

      if (matchingSessions.length > 1) {
        return NextResponse.json(
          { error: 'Hay más de una jornada asociada a este código. Contacta al colegio.' },
          { status: 409 }
        );
      }
      session = matchingSessions[0] ?? null;

      if (!session) {
        return NextResponse.json(
          { error: `El código "${sessionCodeOrId}" no corresponde a ninguna jornada escolar abierta.` },
          { status: 404 }
        );
      }
    } else {
      // Si no se especificó código, buscar la jornada abierta del colegio al que pertenece este apoderado/picker
      const phoneSuffix = cleanPhone.slice(-8);
      const matchingSessions = await prisma.pickupSession.findMany({
        where: {
          status: 'OPEN',
          school: {
            classrooms: {
              some: {
                students: {
                  some: {
                    OR: [
                      {
                        guardians: {
                          some: {
                            guardian: { whatsappNumber: { contains: phoneSuffix } },
                          },
                        },
                      },
                      {
                        authorizations: {
                          some: {
                            picker: { whatsappNumber: { contains: phoneSuffix } },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: { school: true },
        take: 2,
      });
      if (matchingSessions.length > 1) {
        return NextResponse.json(
          { error: 'Hay más de una jornada asociada a este número. Ingresa el código de portón de tu colegio.' },
          { status: 409 }
        );
      }
      session = matchingSessions[0] ?? null;
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No se encontró ninguna jornada escolar abierta asociada a tu número.' },
        { status: 404 }
      );
    }

    // 2. Buscar si el teléfono pertenece a un Picker o Guardian registrado
    const picker = await prisma.picker.findFirst({
      where: {
        schoolId: session.schoolId,
        OR: [
          { whatsappNumber: cleanPhone },
          { whatsappNumber: { contains: cleanPhone.slice(-8) } },
        ],
      },
      include: {
        authorizations: {
          where: {
            status: 'ACTIVE',
            student: {
              classroom: { schoolId: session.schoolId },
            },
          },
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
        schoolId: session.schoolId,
        OR: [
          { whatsappNumber: cleanPhone },
          { whatsappNumber: { contains: cleanPhone.slice(-8) } },
        ],
      },
      include: {
        students: {
          where: {
            student: {
              classroom: { schoolId: session.schoolId },
            },
          },
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
    const studentsMap = new Map<string, StudentPickupLookup>();

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
  } catch (error: unknown) {
    console.error('Error in /api/pickup/lookup:', error);
    return NextResponse.json(
      { error: 'Error interno al consultar autorización.' },
      { status: 500 }
    );
  }
}
