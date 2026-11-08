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
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

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
 * y previene falsos rebotes a /onboarding causados por latencia de Neon Serverless.
 */
export async function resolveUserSchool(email?: string | null): Promise<UserSchoolResolution> {
  if (!email) {
    return { needsOnboarding: true, school: null, user: null };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cached = resolutionCache.get(normalizedEmail);
  const now = Date.now();

  if (cached && now < cached.expiresAt) {
    return cached.resolution;
  }

  // Intentar consultar base de datos (con 1 reintento para absorber cold starts de Neon)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const userRecord = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { school: true },
      });

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

      // Usuario registrado pero formalmente sin colegio asignado
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
      resolutionCache.set(normalizedEmail, { resolution, expiresAt: now + 30 * 1000 });
      return resolution;
    } catch (error) {
      console.warn(`[resolveUserSchool] Intento ${attempt} fallido al consultar Neon DB:`, error);
      if (attempt === 1) {
        // Pausa breve para permitir que Neon despierte del reposo
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  // Si fallaron ambos intentos pero teníamos un registro previo en caché (aunque caducado), reusarlo
  if (cached) {
    console.info(`[resolveUserSchool] Retornando caché previo para ${normalizedEmail} por indisponibilidad temporal de Neon.`);
    return cached.resolution;
  }

  // Si no hay caché y falló la conexión, NO asumir needsOnboarding (evita el loop de redirección)
  return {
    needsOnboarding: false,
    school: null,
    user: null,
  };
}
