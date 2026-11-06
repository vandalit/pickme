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
 * Resuelve la escuela vinculada al usuario autenticado.
 * Si es una cuenta nueva sin institución creada en la BD, indica `needsOnboarding: true`.
 */
export async function resolveUserSchool(email?: string | null): Promise<UserSchoolResolution> {
  if (!email) {
    return { needsOnboarding: true, school: null, user: null };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Buscar al usuario por correo electrónico
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

    // 2. Si es la cuenta semilla demo preconfigurada (sofia@sanmartin.edu)
    if (normalizedEmail === 'sofia@sanmartin.edu') {
      const demoSchool = await prisma.school.findFirst({
        where: { name: { contains: 'San Martín' } },
      });

      if (demoSchool) {
        return {
          needsOnboarding: false,
          school: {
            id: demoSchool.id,
            name: demoSchool.name,
            address: demoSchool.address,
            emergencyPhone: demoSchool.emergencyPhone,
          },
          user: {
            id: 'user-sofia-admin',
            email: 'sofia@sanmartin.edu',
            name: 'Sofía Valenzuela',
            role: 'SCHOOL_ADMIN',
          },
        };
      }
    }

    // 3. Usuario nuevo o no registrado en BD -> Requiere Onboarding
    return {
      needsOnboarding: true,
      school: null,
      user: null,
    };
  } catch (error) {
    console.warn('[resolveUserSchool] Error al consultar BD, evaluando fallback:', error);
    // Si la BD no responde y es sofia, permitimos modo demo
    if (normalizedEmail === 'sofia@sanmartin.edu') {
      return {
        needsOnboarding: false,
        school: {
          id: 'demo-school-san-martin',
          name: 'Colegio San Martín',
          address: 'Av. Libertador 1234, Santiago',
          emergencyPhone: '+56991112233',
        },
        user: {
          id: 'user-sofia-admin',
          email: 'sofia@sanmartin.edu',
          name: 'Sofía Valenzuela',
          role: 'SCHOOL_ADMIN',
        },
      };
    }

    // Cualquier otra cuenta requiere onboarding
    return {
      needsOnboarding: true,
      school: null,
      user: null,
    };
  }
}

