import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { resolveUserSchool } from '@/lib/userSchool';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, studentId, sessionId, enteredCode } = body;

    if (!enteredCode) {
      return NextResponse.json(
        { error: 'Debes ingresar el código de 6 dígitos.' },
        { status: 400 }
      );
    }

    const userSession = await auth();
    if (!userSession?.user?.email) {
      return NextResponse.json({ error: 'Debes iniciar sesión como personal del colegio.' }, { status: 401 });
    }
    const { school, membership, user } = await resolveUserSchool(userSession.user.email);
    if (
      !school ||
      !membership ||
      membership.status !== 'ACTIVE' ||
      !user ||
      !['STAFF', 'SCHOOL_ADMIN'].includes(membership.role)
    ) {
      return NextResponse.json({ error: 'No tienes autorización activa para confirmar entregas.' }, { status: 403 });
    }

    // Buscar el evento correspondiente
    let event = null;
    if (eventId) {
      event = await prisma.pickupEvent.findUnique({
        where: { id: eventId },
        include: {
          session: { select: { schoolId: true } },
          student: {
            include: {
              guardians: {
                include: { guardian: true },
              },
            },
          },
        },
      });
    } else if (studentId && sessionId) {
      event = await prisma.pickupEvent.findFirst({
        where: { studentId, sessionId },
        orderBy: { createdAt: 'desc' },
        include: {
          session: { select: { schoolId: true } },
          student: {
            include: {
              guardians: {
                include: { guardian: true },
              },
            },
          },
        },
      });
    }

    if (!event) {
      return NextResponse.json(
        { error: 'No se encontró el evento de retiro correspondiente.' },
        { status: 404 }
      );
    }

    if (event.session.schoolId !== school.id) {
      return NextResponse.json({ error: 'El evento no pertenece a tu colegio activo.' }, { status: 403 });
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
        staffId: user.id,
      },
    });

    // TRIGGER DE CUSTODIA: Preparar aviso para el apoderado titular
    const primaryGuardian = event.student.guardians.find((g) => g.isPrimary)?.guardian || event.student.guardians[0]?.guardian;
    const guardianPhone = primaryGuardian?.whatsappNumber || null;
    const notificationText = `Hola ${primaryGuardian?.fullName || 'Apoderado'}, tu alumno(a) ${event.student.fullName} fue retirado(a) exitosamente en portón a las ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs.`;
    const waLink = guardianPhone
      ? `https://wa.me/${guardianPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(notificationText)}`
      : null;

    return NextResponse.json({
      success: true,
      status: updated.status,
      confirmedAt: updated.staffConfirmedAt,
      message: 'Traspaso físico completado. Alumno entregado a la persona autorizada.',
      notification: {
        guardianPhone,
        guardianName: primaryGuardian?.fullName || null,
        studentName: event.student.fullName,
        waLink,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/pickup/verificar-handover:', error);
    return NextResponse.json(
      { error: 'Error interno al verificar traspaso físico.' },
      { status: 500 }
    );
  }
}
