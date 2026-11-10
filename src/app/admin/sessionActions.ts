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
 * Agrega un alumno a la jornada escolar abierta en curso (Llegada tardía / Lista viva).
 * Si ya existe un evento para este alumno en la sesión abierta, lo reactiva o retorna éxito.
 */
export async function addLateArrivalToSessionAction(
  studentId: string
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  try {
    const userSession = await auth();
    if (!userSession?.user?.email) {
      return { success: false, error: 'No tienes una sesión activa.' };
    }

    const { school } = await resolveUserSchool(userSession.user.email);
    if (!school) {
      return { success: false, error: 'No se encontró tu colegio.' };
    }

    // 1. Buscar sesión abierta del colegio
    const activeSession = await prisma.pickupSession.findFirst({
      where: {
        schoolId: school.id,
        status: 'OPEN',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeSession) {
      return {
        success: false,
        error: 'No hay ninguna jornada escolar abierta en este momento.',
      };
    }

    // 2. Verificar que el alumno pertenezca al colegio
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        classroom: { schoolId: school.id },
      },
    });

    if (!student) {
      return {
        success: false,
        error: 'Alumno no encontrado en este establecimiento.',
      };
    }

    // 3. Asegurar que el status del alumno en BD sea ACTIVE
    if (student.status !== 'ACTIVE') {
      await prisma.student.update({
        where: { id: student.id },
        data: { status: 'ACTIVE' },
      });
    }

    // 4. Comprobar si ya existe un evento de retiro para este alumno en la sesión
    const existingEvent = await prisma.pickupEvent.findFirst({
      where: {
        sessionId: activeSession.id,
        studentId: student.id,
      },
    });

    if (existingEvent) {
      // Si ya fue entregado (IN_TRANSIT o ARRIVED), no se reabre
      if (existingEvent.status === 'IN_TRANSIT' || existingEvent.status === 'ARRIVED') {
        return {
          success: false,
          error: 'El alumno ya fue retirado en la jornada de hoy.',
        };
      }
      return { success: true, eventId: existingEvent.id };
    }

    // 5. Crear el nuevo evento de retiro en cola WAITING
    const newEvent = await prisma.pickupEvent.create({
      data: {
        sessionId: activeSession.id,
        studentId: student.id,
        status: 'WAITING',
      },
    });

    // Revalidar rutas para refrescar la lista viva en tiempo real
    revalidatePath('/admin');
    revalidatePath('/admin/cursos');
    revalidatePath('/staff');
    revalidatePath(`/board/${activeSession.sessionCode}`);

    return { success: true, eventId: newEvent.id };
  } catch (error) {
    console.error('[addLateArrivalToSessionAction] Error:', error);
    return {
      success: false,
      error: 'Error interno al agregar el alumno a la jornada activa.',
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
 * Elimina el colegio de prueba actual y desvincula al usuario,
 * permitiéndole recomenzar el Onboarding desde cero con una base de datos limpia.
 */
export async function resetMySchoolAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const userSession = await auth();
    if (!userSession?.user?.email) {
      return { success: false, error: 'Sesión no iniciada.' };
    }

    const { school, user } = await resolveUserSchool(userSession.user.email);
    if (!school || !user) {
      return { success: false, error: 'No tienes un colegio vinculado.' };
    }

    const schoolId = school.id;

    // Eliminar entidades operativas. Las identidades globales sobreviven; las
    // membresías de este colegio se eliminan por cascada al borrar la escuela.
    await prisma.incident.deleteMany({ where: { event: { session: { schoolId } } } });
    await prisma.pickupEvent.deleteMany({ where: { session: { schoolId } } });
    await prisma.pickupSession.deleteMany({ where: { schoolId } });
    await prisma.dailyPass.deleteMany({ where: { schoolId } });
    await prisma.authorization.deleteMany({ where: { student: { classroom: { schoolId } } } });
    await prisma.studentGuardian.deleteMany({ where: { student: { classroom: { schoolId } } } });
    await prisma.transportService.deleteMany({ where: { schoolId } });
    await prisma.student.deleteMany({ where: { classroom: { schoolId } } });
    await prisma.classroom.deleteMany({ where: { schoolId } });
    await prisma.invitation.deleteMany({ where: { schoolId } });

    // Eliminar el colegio
    await prisma.school.delete({ where: { id: schoolId } });

    revalidatePath('/admin');
    revalidatePath('/onboarding');

    return { success: true };
  } catch (error) {
    console.error('[resetMySchoolAction] Error al resetear colegio:', error);
    return { success: false, error: 'Error al limpiar los datos del colegio.' };
  }
}
