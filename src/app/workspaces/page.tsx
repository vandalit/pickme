import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { selectWorkspaceAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function WorkspacesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/workspaces');
  }

  const memberships = await prisma.schoolMembership.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    include: { school: true },
    orderBy: { school: { name: 'asc' } },
  });

  if (memberships.length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingRole: true },
    });
    redirect(user?.onboardingRole === 'STAFF' ? '/staff/join' : '/onboarding');
  }

  const canCreateSchool = memberships.some(
    (membership) => membership.role === 'SCHOOL_ADMIN' || membership.role === 'SUPERADMIN'
  );

  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', padding: '2rem' }}>
      <h1>Selecciona un colegio</h1>
      <p>Tu cuenta puede acceder a más de un espacio de trabajo.</p>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
        {memberships.map((membership) => (
          <form action={selectWorkspaceAction} key={membership.id}>
            <button
              type="submit"
              name="schoolId"
              value={membership.schoolId}
              style={{
                width: '100%',
                padding: '1.25rem',
                textAlign: 'left',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <strong>{membership.school.name}</strong>
              <span style={{ display: 'block', marginTop: 4 }}>
                {membership.role === 'STAFF' ? 'Personal de portería' : 'Administración escolar'}
              </span>
            </button>
          </form>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <a href="/staff/join?add=1">Solicitar acceso a otro colegio</a>
        {canCreateSchool && <a href="/admin/onboarding?new=1">Crear otro colegio</a>}
      </div>
    </main>
  );
}
