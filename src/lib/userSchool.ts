import { prisma } from './db';

export interface UserSchoolResolution {
  needsOnboarding: boolean;
  school: {
    id: string;
    name: string;
    address: string | null;
    emergencyPhone: string | null;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

/**
 * Resuelve la escuela vinculada al usuario autenticado desde la base de datos real.
 * Si es una cuenta nueva sin institución creada en la BD, indica `needsOnboarding: true`.
 */
export async function resolveUserSchool(email?: string | null): Promise<UserSchoolResolution> {
  if (!email) {
    return { needsOnboarding: true, school: null, user: null };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const userRecord = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { school: true },
    });

    if (userRecord && userRecord.school) {
      return {
        needsOnboarding: false,
        school: {
          id: userRecord.school.id,
          name: userRecord.school.name,
          address: userRecord.school.address,
          emergencyPhone: userRecord.school.emergencyPhone,
        },
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          role: userRecord.role,
        },
      };
    }

    // Usuario nuevo o sin establecimiento asociado -> Requiere Onboarding
    return {
      needsOnboarding: true,
      school: null,
      user: userRecord
        ? {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
            role: userRecord.role,
          }
        : null,
    };
  } catch (error) {
    console.error('[resolveUserSchool] Error al consultar base de datos:', error);
    return {
      needsOnboarding: true,
      school: null,
      user: null,
    };
  }
}
