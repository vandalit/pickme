import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPublicLabel, AnimalId, ColorId } from '@/lib/avatars';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, sessionId, pickerPhone } = body;

    if (!studentId || !sessionId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (studentId, sessionId).' },
        { status: 400 }
      );
    }

    // 1. Validar que la sesión escolar existe y está abierta (por UUID o por Código de Portón)
    const session = await prisma.pickupSession.findFirst({
      where: {
        OR: [
          { id: sessionId },
          { sessionCode: { equals: sessionId, mode: 'insensitive' } },
        ],
        status: 'OPEN',
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'La jornada escolar no fue encontrada o se encuentra cerrada.' },
        { status: 404 }
      );
    }

    // 2. Validar que el alumno existe y pertenece a este colegio
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        classroom: { schoolId: session.schoolId },
      },
      include: { classroom: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'El alumno especificado no fue encontrado en este establecimiento.' },
        { status: 404 }
      );
    }

    // 3. Buscar si hay un pickerId asociado a este teléfono
    let pickerId: string | null = null;
    if (pickerPhone) {
      const cleanPhone = pickerPhone.replace(/[\s-]/g, '');
      const picker = await prisma.picker.findFirst({
        where: {
          OR: [
            { whatsappNumber: cleanPhone },
            { whatsappNumber: { contains: cleanPhone.slice(-8) } },
          ],
        },
      });
      if (picker) {
        pickerId = picker.id;
      }
    }

    // 4. Generar Handover Code seguro de 6 dígitos
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de vigencia

    // 5. Buscar o crear el evento de custodia en la sesión activa
    const existingEvent = await prisma.pickupEvent.findFirst({
      where: {
        sessionId: session.id,
        studentId: student.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    let event;
    if (existingEvent) {
      event = await prisma.pickupEvent.update({
        where: { id: existingEvent.id },
        data: {
          status: 'IN_PROCESS',
          handoverCode: randomCode,
          handoverExpiry: expiry,
          pickerScannedAt: new Date(),
          pickerId: pickerId || existingEvent.pickerId,
        },
      });
    } else {
      event = await prisma.pickupEvent.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          pickerId,
          status: 'IN_PROCESS',
          handoverCode: randomCode,
          handoverExpiry: expiry,
          pickerScannedAt: new Date(),
        },
      });
    }

    const publicLabel = getPublicLabel(
      student.animalId as AnimalId,
      student.colorId as ColorId
    );

    return NextResponse.json({
      success: true,
      eventId: event.id,
      handoverCode: randomCode,
      handoverExpiry: expiry.toISOString(),
      status: event.status,
      studentPublicLabel: publicLabel,
      studentInitials: student.initials,
      classroom: `${student.classroom.grade} ${student.classroom.section}`,
      message: 'Llegada anunciada. El personal de portón está preparando la entrega.',
    });
  } catch (error: any) {
    console.error('Error in /api/pickup/solicitar:', error);
    return NextResponse.json(
      { error: 'Error interno al solicitar entrega.' },
      { status: 500 }
    );
  }
}

