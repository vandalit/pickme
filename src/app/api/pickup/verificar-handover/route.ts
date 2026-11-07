import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, studentId, sessionId, enteredCode, staffId } = body;

    if (!enteredCode) {
      return NextResponse.json(
        { error: 'Debes ingresar el código de 6 dígitos.' },
        { status: 400 }
      );
    }

    // Resolver usuario staff autenticado si no fue provisto explícitamente
    let effectiveStaffId = staffId || null;
    if (!effectiveStaffId) {
      const userSession = await auth();
      if (userSession?.user?.email) {
        const staffUser = await prisma.user.findUnique({
          where: { email: userSession.user.email.toLowerCase().trim() },
        });
        if (staffUser) {
          effectiveStaffId = staffUser.id;
        }
      }
    }

    // Buscar el evento correspondiente
    let event = null;
    if (eventId) {
      event = await prisma.pickupEvent.findUnique({
        where: { id: eventId },
        include: { student: true },
      });
    } else if (studentId && sessionId) {
      event = await prisma.pickupEvent.findFirst({
        where: { studentId, sessionId },
        orderBy: { createdAt: 'desc' },
        include: { student: true },
      });
    }

    if (!event) {
      return NextResponse.json(
        { error: 'No se encontró el evento de retiro correspondiente.' },
        { status: 404 }
      );
    }

    // Verificar si ya fue entregado
    if (event.status === 'IN_TRANSIT' || event.status === 'ARRIVED') {
      return NextResponse.json(
        { error: 'Este retiro ya fue confirmado y entregado con anterioridad.' },
        { status: 400 }
      );
    }

    // Verificar si expiró
    if (event.handoverExpiry && new Date() > new Date(event.handoverExpiry)) {
      return NextResponse.json(
        {
          error: 'CÓDIGO_EXPIRADO',
          message: 'El código de entrega ha expirado. El apoderado debe anunciarse nuevamente.',
        },
        { status: 400 }
      );
    }

    // Verificar concordancia del código de 6 dígitos
    if (event.handoverCode !== enteredCode.trim()) {
      return NextResponse.json(
        {
          error: 'CÓDIGO_INVÁLIDO',
          message: 'Código incorrecto. Verifica los 6 dígitos en la pantalla del picker.',
        },
        { status: 400 }
      );
    }

    // Traspaso exitoso: actualizar estado a IN_TRANSIT con firma del staff
    const updated = await prisma.pickupEvent.update({
      where: { id: event.id },
      data: {
        status: 'IN_TRANSIT',
        staffConfirmedAt: new Date(),
        staffId: effectiveStaffId || event.staffId,
      },
    });

    return NextResponse.json({
      success: true,
      status: updated.status,
      confirmedAt: updated.staffConfirmedAt,
      message: 'Traspaso físico completado. Alumno entregado a la persona autorizada.',
    });
  } catch (error: any) {
    console.error('Error in /api/pickup/verificar-handover:', error);
    return NextResponse.json(
      { error: 'Error interno al verificar traspaso físico.' },
      { status: 500 }
    );
  }
}

