'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestJoinSchoolAction, acceptTokenInvitationAction } from './actions';
import styles from './page.module.css';

interface SchoolItem {
  id: string;
  name: string;
  address: string | null;
  hasPendingRequest: boolean;
}

interface Props {
  userEmail: string;
  schools: SchoolItem[];
  tokenInvite?: {
    token: string;
    schoolName: string;
  } | null;
  isPendingNotice?: boolean;
}

export default function JoinClientContent({
  schools,
  tokenInvite,
  isPendingNotice,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localSchools, setLocalSchools] = useState<SchoolItem[]>(schools);

  // Aceptar invitación por token
  const handleAcceptToken = () => {
    if (!tokenInvite?.token) return;
    setError(null);
    startTransition(async () => {
      const res = await acceptTokenInvitationAction(tokenInvite.token);
      if (res.success) {
        router.push(res.redirectTo || '/staff');
      } else {
        setError(res.error || 'No se pudo aceptar la invitación.');
      }
    });
  };

  // Solicitar unirse a un colegio de la lista
  const handleRequestJoin = (schoolId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await requestJoinSchoolAction(schoolId);
      if (res.success) {
        setLocalSchools((prev) =>
          prev.map((s) => (s.id === schoolId ? { ...s, hasPendingRequest: true } : s))
        );
      } else {
        setError(res.error || 'Error al enviar la solicitud.');
      }
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon}>🚪</div>
        <h1 className={styles.title}>Vincular Colegio de Portería</h1>
        <p className={styles.subtitle}>
          Como miembro del equipo operativo, debes pertenecer a un colegio para visualizar la
          cola de retiros diaria.
        </p>
      </div>

      {isPendingNotice && (
        <div className={styles.alertPending}>
          <span>⏳</span>
          <div>
            <strong>Acceso en espera de confirmación:</strong>
            <br />
            Tu solicitud está pendiente de aprobación por el Administrador del colegio.
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {/* Caso: Invitación por token encontrada */}
      {tokenInvite && (
        <div className={styles.alertPending} style={{ borderColor: '#10b981', color: '#34d399' }}>
          <div>
            <strong>Invitación disponible:</strong>
            <br />
            Fuiste invitado a unirte a <strong>{tokenInvite.schoolName}</strong>.
            <div style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className={styles.joinBtn}
                onClick={handleAcceptToken}
                disabled={isPending}
              >
                {isPending ? 'Ingresando...' : 'Aceptar e ingresar a Portería'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listado de colegios disponibles */}
      <div>
        <h2 style={{ fontSize: '1rem', color: '#f1f5f9', marginBottom: '0.75rem' }}>
          Colegios registrados
        </h2>
        {localSchools.length === 0 ? (
          <div className={styles.emptySchools}>
            No hay colegios activos disponibles en este momento.
          </div>
        ) : (
          <div className={styles.schoolList}>
            {localSchools.map((s) => (
              <div key={s.id} className={styles.schoolItem}>
                <div className={styles.schoolInfo}>
                  <span className={styles.schoolName}>{s.name}</span>
                  {s.address && <span className={styles.schoolAddress}>{s.address}</span>}
                </div>
                {s.hasPendingRequest ? (
                  <span className={styles.requestedBadge}>Solicitado</span>
                ) : (
                  <button
                    type="button"
                    className={styles.joinBtn}
                    onClick={() => handleRequestJoin(s.id)}
                    disabled={isPending}
                  >
                    Solicitar unirse
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

