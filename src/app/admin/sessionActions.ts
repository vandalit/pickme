'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveUserSchool } from '@/lib/userSchool';
import { revalidatePath } from 'next/cache';

/**
 * Genera un código de sesión reconocible a partir del nombre del colegio.
 * Ej: "Colegio San Martín" -> "CSM-7429"
 */
function generateSessionCode(schoolName: string): string {
  const words = schoolName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  let acronym = words
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('');

  if (acronym.length < 2) {
    acronym = 'PICK';
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${acronym}-${randomNum}`;
}

export interface SessionActionResult {
  success: boolean;
  error?: string;
  sessionCode?: string;
  sessionId?: string;
}

/**
 * Inicia la jornada de salida de hoy:
 * 1. Verifica autenticación y colegio.
 * 2. Comprueba si ya existe una sesión OPEN.
 * 3. Busca todos los alumnos con status = 'ACTIVE' en las aulas del colegio.
 * 4. Crea la PickupSession y los PickupEvents en estado 'WAITING'.
 */
export async function openDailySessionAction(): Promise<SessionActionResult> {
  try {
    const userSession = await auth();
    if (!userSession?.user?.email) {
      return { success: false, error: 'No tienes una sesión de usuario activa.' };
    }

    const { school, needsOnboarding } = await resolveUserSchool(userSession.user.email);
    if (needsOnboarding || !school) {
      return {
        success: false,
        error: 'Debes completar el onboarding de tu colegio antes de abrir una jornada.',
      };
    }

    // Comprobar si ya existe una sesión abierta
    const existingOpenSession = await prisma.pickupSession.findFirst({
      where: {
        schoolId: school.id,
        status: 'OPEN',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOpenSession) {
      return {
        success: true,
        sessionCode: existingOpenSession.sessionCode,
        sessionId: existingOpenSession.id,
        error: 'Ya existe una jornada escolar abierta.',
      };
    }

    // Obtener los alumnos activos del colegio
    const activeStudents = await prisma.student.findMany({
      where: {
        classroom: {
          schoolId: school.id,
        },
        status: 'ACTIVE',
      },
      include: {
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (activeStudents.length === 0) {
      return {
        success: false,
        error:
          'No tienes alumnos activos matriculados. Ingresa alumnos en el menú "Cursos y Alumnos" o importa una plantilla CSV antes de iniciar la jornada.',
      };
    }

    const sessionCode = generateSessionCode(school.name);

    // Crear la sesión e insertar los eventos de custodia iniciales (WAITING)
    const newSession = await prisma.pickupSession.create({
      data: {
        schoolId: school.id,
        sessionCode,
        status: 'OPEN',
        startedAt: new Date(),
        events: {
          create: activeStudents.map((student) => ({
            studentId: student.id,
            status: 'WAITING',
          })),
        },
      },
    });

    revalidatePath('/admin');
    revalidatePath(`/board/${sessionCode}`);
    revalidatePath('/staff');

    return {
      success: true,
      sessionCode: newSession.sessionCode,
      sessionId: newSession.id,
    };
  } catch (error) {
    console.error('[SessionAction] Error al abrir jornada:', error);
    return {
      success: false,
      error: 'Ocurrió un error al iniciar la jornada escolar en la base de datos.',
    };
  }
}

/**
 * Cierra la jornada escolar actual:
 * 1. Pasa el estado a 'CLOSED'.
 * 2. Registra el timestamp closedAt.
 * 3. Congela la sesión para consulta histórica en auditoría.
 */
export async function closeDailySessionAction(sessionId?: string): Promise<SessionActionResult> {
  try {
    const userSession = await auth();
    if (!userSession?.user?.email) {
      return { success: false, error: 'No tienes una sesión de usuario activa.' };
    }

    const { school } = await resolveUserSchool(userSession.user.email);
    if (!school) {
      return { success: false, error: 'No se encontró el colegio asociado.' };
    }

    // Buscar la sesión a cerrar
    const targetSession = sessionId
      ? await prisma.pickupSession.findFirst({
          where: { id: sessionId, schoolId: school.id },
        })
      : await prisma.pickupSession.findFirst({
          where: { schoolId: school.id, status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
        });

    if (!targetSession) {
      return {
        success: false,
        error: 'No se encontró ninguna sesión escolar activa para cerrar.',
      };
    }

    await prisma.pickupSession.update({
      where: { id: targetSession.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/auditoria');
    revalidatePath('/staff');
    revalidatePath(`/board/${targetSession.sessionCode}`);

    return {
      success: true,
      sessionCode: targetSession.sessionCode,
      sessionId: targetSession.id,
    };
  } catch (error) {
    console.error('[SessionAction] Error al cerrar jornada:', error);
    return {
      success: false,
      error: 'Ocurrió un error al cerrar la jornada escolar.',
    };
  }
}

/**
 * Simula el arribo de un apoderado en portería para un alumno en específico.
 * Genera el Handover Code de 6 dígitos y mueve el evento a 'IN_PROCESS'.
 */
export async function simulateArrivalForEventAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const event = await prisma.pickupEvent.findUnique({
      where: { id: eventId },
      include: { session: true },
    });

    if (!event) {
      return { success: false, error: 'Evento no encontrado.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pickupEvent.update({
      where: { id: eventId },
      data: {
        status: 'IN_PROCESS',
        handoverCode: code,
        handoverExpiry: expiry,
        pickerScannedAt: new Date(),
      },
    });

    revalidatePath('/admin');
    revalidatePath(`/board/${event.session.sessionCode}`);
    revalidatePath('/staff');

    return { success: true };
  } catch (error) {
    console.error('[SessionAction] Error al simular arribo:', error);
    return { success: false, error: 'Error al simular llegada del alumno.' };
  }
}

