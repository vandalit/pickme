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

// Caché en memoria para evitar cold starts de Neon en cada cambio de tab
interface CacheEntry {
  resolution: UserSchoolResolution;
  expiresAt: number;
}
const resolutionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos para resoluciones exitosas

export function clearUserSchoolCache(email?: string) {
  if (email) {
    resolutionCache.delete(email.trim().toLowerCase());
  } else {
    resolutionCache.clear();
  }
}

/**
 * Resuelve la escuela vinculada al usuario autenticado.
 * Utiliza caché en memoria con TTL para que la navegación entre pestañas sea instantánea (0ms)
 * y previene bucles de redirección a /onboarding.
 */
export async function resolveUserSchool(email?: string | null): Promise<UserSchoolResolution> {
  if (!email) {
    return { needsOnboarding: true, school: null, user: null };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cached = resolutionCache.get(normalizedEmail);
  const now = Date.now();

  // Si tenemos resolución exitosa en caché y aún es válida, usarla de inmediato (0ms)
  if (cached && !cached.resolution.needsOnboarding && cached.resolution.school && now < cached.expiresAt) {
    return cached.resolution;
  }

  // Intentar consultar base de datos (con 2 reintentos para absorber cold starts de Neon)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      let userRecord = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { school: true },
      });

      // Si el usuario existe y ya tiene colegio vinculado directamente
      if (userRecord && userRecord.school) {
        const resolution: UserSchoolResolution = {
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
        resolutionCache.set(normalizedEmail, { resolution, expiresAt: now + CACHE_TTL_MS });
        return resolution;
      }

      // Si el usuario existe pero no tiene schoolId asignado, verificar si ya existe un colegio registrado en el sistema
      const existingSchool = await prisma.school.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (existingSchool) {
        // Auto-vincular de forma transparente para evitar falsos rebotes de onboarding
        if (userRecord) {
          await prisma.user.update({
            where: { id: userRecord.id },
            data: { schoolId: existingSchool.id },
          });
        }

        const resolution: UserSchoolResolution = {
          needsOnboarding: false,
          school: {
            id: existingSchool.id,
            name: existingSchool.name,
            address: existingSchool.address,
            emergencyPhone: existingSchool.emergencyPhone,
          },
          user: userRecord
            ? {
                id: userRecord.id,
                email: userRecord.email,
                name: userRecord.name,
                role: userRecord.role,
              }
            : null,
        };
        resolutionCache.set(normalizedEmail, { resolution, expiresAt: now + CACHE_TTL_MS });
        return resolution;
      }

      // Si de verdad NO existe ningún colegio en toda la base de datos, entonces sí requiere onboarding
      const resolution: UserSchoolResolution = {
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
      // No cachear needsOnboarding por largo tiempo (solo 5 segundos para permitir completar onboarding)
      resolutionCache.set(normalizedEmail, { resolution, expiresAt: now + 5000 });
      return resolution;
    } catch (error) {
      console.warn(`[resolveUserSchool] Intento ${attempt} con advertencia en Neon DB:`, error);
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  // Si fallaron los intentos pero teníamos un registro previo en caché (aunque expirado), reutilizarlo
  if (cached && cached.resolution.school) {
    return cached.resolution;
  }

  // Fallback seguro: no forzar needsOnboarding si hubo falla de red para evitar loops
  return {
    needsOnboarding: false,
    school: null,
    user: null,
  };
}
