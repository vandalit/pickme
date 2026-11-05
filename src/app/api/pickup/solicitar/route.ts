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

    // 1. Validar que el alumno existe y obtener sus datos
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { classroom: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'El alumno especificado no fue encontrado.' },
        { status: 404 }
      );
    }

    // 2. Buscar si hay un pickerId asociado a este teléfono
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

    // 3. Generar Handover Code seguro de 6 dígitos
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de vigencia

    // 4. Buscar o crear el evento de custodia en la sesión activa
    const existingEvent = await prisma.pickupEvent.findFirst({
      where: {
        sessionId,
        studentId,
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
          sessionId,
          studentId,
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

